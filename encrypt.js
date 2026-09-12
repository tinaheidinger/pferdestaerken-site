#!/usr/bin/env node
/**
 * encrypt.js — Erstellt eine passwortgeschützte Beratungsakte
 *
 * Verwendung (aus dem Repo-Root):
 *   node encrypt.js <pin> <kunden-slug>
 *
 * Liest:
 *   shell.html                          — gemeinsame Seitenvorlage (CSS/JS)
 *   beratung/<slug>/report.html         — Klartext (gitignored, bleibt lokal!)
 *
 * Schreibt:
 *   beratung/<slug>/index.html          — verschlüsselte Seite (geht ins Repo)
 *
 * Algorithmus: PBKDF2-SHA256 (100.000 Iterationen) + AES-256-GCM
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const [pin, slug] = process.argv.slice(2);
if (!pin || !slug || !/^\d{4}$/.test(pin)) {
  console.error('Verwendung: node encrypt.js <4-stellige-pin> <kunden-slug>');
  process.exit(1);
}

const repoRoot = __dirname;
const shellPath = path.join(repoRoot, 'shell.html');
const reportPath = path.join(repoRoot, 'beratung', slug, 'report.html');
const outPath = path.join(repoRoot, 'beratung', slug, 'index.html');

if (!fs.existsSync(shellPath)) {
  console.error(`shell.html nicht gefunden: ${shellPath}`);
  process.exit(1);
}
if (!fs.existsSync(reportPath)) {
  console.error(`report.html nicht gefunden: ${reportPath}`);
  process.exit(1);
}

const shell = fs.readFileSync(shellPath, 'utf8');
const plaintext = fs.readFileSync(reportPath, 'utf8');

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);

const key = crypto.pbkdf2Sync(pin, salt, 100_000, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

const ctBuf = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag(); // 16 bytes GCM auth tag

const payload = {
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: Buffer.concat([ctBuf, tag]).toString('base64'),
};

const outHtml = shell.replace('__ENCRYPTED_PAYLOAD__', JSON.stringify(payload));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, outHtml, 'utf8');

console.log(`✓ ${outPath}`);
console.log(`  PIN:              ${pin}`);
console.log(`  URL:              https://pferdestaerken.at/beratung/${slug}/`);
console.log(`  Plaintext:        ${Buffer.byteLength(plaintext)} Bytes`);
console.log(`  Ciphertext:       ${ctBuf.length + tag.length} Bytes`);
