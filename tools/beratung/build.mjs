#!/usr/bin/env node
// Baut eine verschlüsselte Beratungsakte aus einer lokalen Klartext-Quelle.
//
//   node tools/beratung/build.mjs <quelle.html> --slug <slug> [--pin 1234] [--plain-out <datei>]
//
// 1. ersetzt <!-- @widget name {json} --> durch die zentralen Bausteine (widgets.mjs)
// 2. bettet "@file:pfad" in src/href als data:-URI ein (Pfad relativ zur Quelle)
// 3. verschlüsselt mit AES-256-GCM (PBKDF2-SHA-256, 10k Iterationen) — passend zu shell.html
// 4. schreibt beratung/<slug>/index.html
//
// Ohne --pin wird ein zufälliger 4-stelliger Code erzeugt und ausgegeben.
// Die Klartext-Quelle gehört NIE ins Repo (siehe README.md).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt, webcrypto } from 'node:crypto';
import { WIDGETS } from './widgets.mjs';

const { subtle } = webcrypto;
const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(HERE, '../..');
const ITERATIONS = 10_000;

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export function renderWidgets(html) {
  return html.replace(/<!--\s*@widget\s+([\w-]+)\s*(\{[\s\S]*?\})?\s*-->/g, (_, name, json) => {
    const fn = WIDGETS[name];
    if (!fn) throw new Error(`Unbekanntes Widget: ${name}`);
    let args = {};
    if (json) {
      try {
        args = JSON.parse(json);
      } catch (e) {
        throw new Error(`Widget ${name}: ungültiges JSON (${e.message})`);
      }
    }
    return fn(args);
  });
}

export async function inlineFiles(html, baseDir) {
  const refs = [...new Set([...html.matchAll(/"@file:([^"]+)"/g)].map((m) => m[1]))];
  for (const ref of refs) {
    const mime = MIME[extname(ref).toLowerCase()];
    if (!mime) throw new Error(`@file:${ref}: unbekannter Dateityp`);
    const data = await readFile(resolve(baseDir, ref));
    html = html.replaceAll(`"@file:${ref}"`, `"data:${mime};base64,${data.toString('base64')}"`);
  }
  return html;
}

const b64 = (buf) => Buffer.from(buf).toString('base64');

async function deriveKey(pin, salt, usage) {
  const raw = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

export async function encrypt(plain, pin) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt, 'encrypt');
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

export async function decrypt(payload, pin) {
  const from = (s) => new Uint8Array(Buffer.from(s, 'base64'));
  const key = await deriveKey(pin, from(payload.salt), 'decrypt');
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: from(payload.iv) }, key, from(payload.ct));
  return new TextDecoder().decode(pt);
}

export function wrapShell(shell, payload, slug) {
  if (!shell.includes('__ENCRYPTED_PAYLOAD__') || !shell.includes('__SLUG__')) {
    throw new Error('shell.html: Platzhalter fehlen');
  }
  // Funktionen als Ersatz, damit "$" in Payload/Slug nicht als Muster interpretiert wird
  return shell
    .replace('__ENCRYPTED_PAYLOAD__', () => JSON.stringify(payload))
    .replace('__SLUG__', () => slug);
}

export const randomPin = () => String(randomInt(0, 10_000)).padStart(4, '0');

export async function build({ source, slug, pin = randomPin(), plainOut, outRoot = SITE_ROOT }) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Ungültiger Slug: ${slug}`);
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN muss 4-stellig sein');

  const src = await readFile(source, 'utf8');
  const plain = await inlineFiles(renderWidgets(src), dirname(resolve(source)));
  if (/@widget|"@file:/.test(plain)) throw new Error('Nicht aufgelöste Direktiven in der Quelle');

  const payload = await encrypt(plain, pin);
  if ((await decrypt(payload, pin)) !== plain) throw new Error('Round-Trip fehlgeschlagen');

  const shell = await readFile(join(HERE, 'shell.html'), 'utf8');
  const outFile = join(outRoot, 'beratung', slug, 'index.html');
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, wrapShell(shell, payload, slug));
  if (plainOut) await writeFile(plainOut, plain);

  return { outFile, pin, bytes: plain.length };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
    else args._.push(a);
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args._[0] || !args.slug) {
    console.error('Aufruf: node tools/beratung/build.mjs <quelle.html> --slug <slug> [--pin 1234] [--plain-out <datei>]');
    process.exit(1);
  }
  const res = await build({
    source: args._[0],
    slug: args.slug,
    pin: args.pin,
    plainOut: args['plain-out'],
  });
  console.log(`✓ ${res.outFile} (${(res.bytes / 1024 / 1024).toFixed(1)} MB Klartext)`);
  console.log(`  Link: https://pferdestaerken.at/beratung/${args.slug}/`);
  console.log(`  Zugangscode: ${res.pin}`);
}
