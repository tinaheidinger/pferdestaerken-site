# Beratungsakten

Verschlüsselte Kundenseiten unter `/beratung/<slug>/`. Die Seite enthält nur das
AES-256-GCM-Chiffrat; entschlüsselt wird im Browser mit einem 4-stelligen Zugangscode.

**Dieses Repo ist öffentlich — Kundendaten niemals im Klartext committen**, auch nicht
in Commit-Nachrichten oder PR-Beschreibungen. Nur den Slug verwenden.

## Aufbau

Alles, was für alle Akten gleich ist, liegt **zentral** und wird von jeder Akte nur eingebunden:

| Datei | Inhalt |
|---|---|
| `/assets/beratung.css` | Styles |
| `/assets/beratung.js` | Code-Eingabe, Entschlüsselung, Lightbox |
| `/assets/beratung-widgets.js` | Bausteine: Stammdaten Beraterin, BCS, CNS (nicht beurteilbar), Allgemeine Hinweise, Rechtliche Hinweise, Akademie, Beraterin-Karte, Lightbox, Footer |

Eine Akte (`beratung/<slug>/index.html`) enthält nur noch den Rahmen mit Code-Eingabe,
das Chiffrat und die Einbindung dieser Dateien. Die Bausteine stehen in der Akte als
Platzhalter und werden nach dem Entsperren eingesetzt — **eine Änderung an
`beratung-widgets.js` wirkt sofort in allen Akten**, ohne neu zu verschlüsseln.

```html
<div class="meta-strip">
  <div data-widget="stammdaten-beraterin"></div> …
</div>
<div class="befund-grid">
  <div data-widget="bcs" data-score="5" data-horse="Name"></div>
  <div data-widget="cns-nicht-beurteilbar"></div> …
</div>
… <div data-widget="allgemeine-hinweise"></div>   <!-- unter der Ration-Liste -->
<div data-widget="rechtliche-hinweise"></div>
<div data-widget="akademie"></div>
<div data-widget="beraterin"></div>
<div data-widget="lightbox"></div>
<div data-widget="footer"></div>
```

Den vollständigen Aufbau einer Akte zeigt `template.html`.

## Build-Skript

`build.mjs` wird nur für das gebraucht, was pro Akte passiert:

- Fotos/PDFs einbetten (`"@file:assets/…"` in `src`/`href` → data:-URI) — sie müssen im
  Chiffrat stecken, als eigene Dateien wären sie öffentlich abrufbar
- verschlüsseln und `beratung/<slug>/index.html` schreiben (Rahmen: `shell.html`)
- prüfen, dass alle `data-widget`-Namen existieren

```bash
mkdir -p tools/beratung/src/<slug>/assets            # src/ ist gitignored
cp tools/beratung/template.html tools/beratung/src/<slug>/index.html
# ausfüllen, Fotos/PDFs nach src/<slug>/assets/
node tools/beratung/build.mjs tools/beratung/src/<slug>/index.html --slug <slug>
# → zufälliger Zugangscode in der Ausgabe; beim Aktualisieren --pin <code> angeben
```

`--plain-out <datei>` schreibt zusätzlich den fertigen Klartext (Bilder eingebettet) —
als Sicherung **außerhalb des Repos** aufbewahren; er kann wieder als Quelle dienen.

`--repack <slug>` übernimmt das Chiffrat einer bestehenden Akte unverändert in den
aktuellen `shell.html` (ohne Zugangscode), z. B. nach Änderungen am Rahmen.

Tests: `node --test tools/beratung/*.test.mjs`
