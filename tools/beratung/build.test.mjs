import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, decrypt, encrypt, inlineFiles, randomPin, renderWidgets, wrapShell } from './build.mjs';

test('encrypt/decrypt round-trip, falscher Code schlägt fehl', async () => {
  const payload = await encrypt('<p>Hallo ü</p>', '0427');
  assert.equal(await decrypt(payload, '0427'), '<p>Hallo ü</p>');
  await assert.rejects(decrypt(payload, '0428'));
});

test('randomPin ist immer 4-stellig', () => {
  for (let i = 0; i < 200; i++) assert.match(randomPin(), /^\d{4}$/);
});

test('renderWidgets ersetzt Direktiven und kennt keine unbekannten Widgets', () => {
  const html = renderWidgets('<div><!-- @widget bcs {"score": 5, "horse": "Testpferd"} --></div><!-- @widget beraterin -->');
  assert.match(html, /bcs-seg active/);
  assert.match(html, /5 \/ 9/);
  assert.match(html, /Kristina Heidinger/);
  assert.doesNotMatch(html, /@widget/);
  assert.throws(() => renderWidgets('<!-- @widget gibtsnicht -->'), /Unbekanntes Widget/);
  assert.throws(() => renderWidgets('<!-- @widget bcs {"score": 10} -->'), /1–9/);
});

test('Widget-Parameter werden HTML-escaped', () => {
  assert.match(renderWidgets('<!-- @widget bcs {"score": 3, "horse": "<b>x</b>"} -->'), /&lt;b&gt;x&lt;\/b&gt;/);
});

test('inlineFiles bettet Dateien als data:-URI ein', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'beratung-'));
  await writeFile(join(dir, 'a.png'), Buffer.from([1, 2, 3]));
  assert.equal(await inlineFiles('<img src="@file:a.png">', dir), '<img src="data:image/png;base64,AQID">');
});

test('wrapShell setzt Payload und Session-Key pro Slug', () => {
  const out = wrapShell("const PAYLOAD = __ENCRYPTED_PAYLOAD__; const K = 'ps_unlocked___SLUG__';", { ct: '$&' }, 'abc');
  assert.equal(out, `const PAYLOAD = {"ct":"$&"}; const K = 'ps_unlocked_abc';`);
});

test('build schreibt verschlüsselte Seite ohne Klartext', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'beratung-'));
  const src = join(dir, 'src.html');
  await writeFile(src, '<h1>Geheimer Kundenname</h1><!-- @widget footer -->');
  const res = await build({ source: src, slug: 'test', pin: '1234', outRoot: dir });
  const page = await readFile(res.outFile, 'utf8');
  assert.doesNotMatch(page, /Geheimer Kundenname/);
  assert.match(page, /ps_unlocked_test/);
  const payload = JSON.parse(page.match(/const PAYLOAD = (\{.*\});/)[1]);
  assert.match(await decrypt(payload, '1234'), /Geheimer Kundenname/);
  await assert.rejects(build({ source: src, slug: 'Bad Slug', outRoot: dir }), /Slug/);
});
