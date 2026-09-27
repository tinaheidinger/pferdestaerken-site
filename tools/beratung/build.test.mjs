import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  build, checkWidgets, decrypt, encrypt, extractPayload, inlineFiles, loadWidgets, randomPin, repack, wrapShell,
} from './build.mjs';

test('encrypt/decrypt round-trip, falscher Code schlägt fehl', async () => {
  const payload = await encrypt('<p>Hallo ü</p>', '0427');
  assert.equal(await decrypt(payload, '0427'), '<p>Hallo ü</p>');
  await assert.rejects(decrypt(payload, '0428'));
});

test('randomPin ist immer 4-stellig', () => {
  for (let i = 0; i < 200; i++) assert.match(randomPin(), /^\d{4}$/);
});

test('zentrale Widgets rendern (assets/beratung-widgets.js)', async () => {
  const w = await loadWidgets();
  const bcs = w.bcs({ score: '7', horse: 'Testpferd' });
  assert.match(bcs, /bcs-seg active/);
  assert.match(bcs, /Testpferd · BCS 7 – Übergewichtig/);
  assert.throws(() => w.bcs({ score: '10' }), /1–9/);
  assert.throws(() => w.bcs({}), /1–9/);
  assert.match(w.bcs({ score: '3', horse: '<b>x</b>' }), /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(w['cns-nicht-beurteilbar'](), /Nicht beurteilbar/);
  assert.match(w.akademie(), /BONUS10TINA-H/);
  assert.match(w.beraterin(), /Kristina Heidinger/);
  assert.match(w['stammdaten-beraterin'](), /Weiningergasse 3/);
  assert.match(w.footer(), /href="\/impressum\/"/);
  for (const name of ['allgemeine-hinweise', 'rechtliche-hinweise', 'lightbox']) assert.ok(w[name]());
});

test('checkWidgets erkennt unbekannte Widgets', async () => {
  await checkWidgets('<div data-widget="akademie"></div>');
  await assert.rejects(checkWidgets('<div data-widget="gibtsnicht"></div>'), /Unbekanntes Widget/);
});

test('inlineFiles bettet Dateien als data:-URI ein', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'beratung-'));
  await writeFile(join(dir, 'a.png'), Buffer.from([1, 2, 3]));
  assert.equal(await inlineFiles('<img src="@file:a.png">', dir), '<img src="data:image/png;base64,AQID">');
});

test('wrapShell setzt Payload und Slug', () => {
  const out = wrapShell('<body data-slug="__SLUG__"><script>__ENCRYPTED_PAYLOAD__</script>', { ct: '$&' }, 'abc');
  assert.equal(out, '<body data-slug="abc"><script>{"ct":"$&"}</script>');
});

test('extractPayload liest neues und altes Seitenformat', () => {
  const p = { salt: 'cw==', iv: 'aQ==', ct: 'Yw==' };
  assert.deepEqual(extractPayload(`<script id="payload" type="application/json">${JSON.stringify(p)}</script>`), p);
  assert.deepEqual(extractPayload(`const PAYLOAD = ${JSON.stringify(p)};\nconst X = {};`), p);
});

test('build schreibt verschlüsselte Seite ohne Klartext, repack behält Chiffrat', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'beratung-'));
  const src = join(dir, 'src.html');
  await writeFile(src, '<h1>Geheimer Kundenname</h1><div data-widget="footer"></div>');
  const res = await build({ source: src, slug: 'test', pin: '1234', outRoot: dir });
  const page = await readFile(res.outFile, 'utf8');
  assert.doesNotMatch(page, /Geheimer Kundenname/);
  assert.match(page, /data-slug="test"/);
  assert.match(page, /\/assets\/beratung\.js/);
  const payload = extractPayload(page);
  assert.match(await decrypt(payload, '1234'), /Geheimer Kundenname/);

  await writeFile(res.outFile, `alt: const PAYLOAD = ${JSON.stringify(payload)};`);
  await repack({ slug: 'test', outRoot: dir });
  assert.deepEqual(extractPayload(await readFile(res.outFile, 'utf8')), payload);

  await assert.rejects(build({ source: src, slug: 'Bad Slug', outRoot: dir }), /Slug/);
});
