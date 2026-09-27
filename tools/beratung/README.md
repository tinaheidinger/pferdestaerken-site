# Beratungsakten

Verschlüsselte Kundenseiten unter `/beratung/<slug>/`. Die Seite enthält nur das
AES-256-GCM-Chiffrat; entschlüsselt wird im Browser mit einem 4-stelligen Zugangscode.

**Dieses Repo ist öffentlich — Kundendaten niemals im Klartext committen**, auch nicht
in Commit-Nachrichten oder PR-Beschreibungen. Nur Slug verwenden.

## Dateien

| Datei | Inhalt |
|---|---|
| `shell.html` | Rahmen mit Code-Eingabe und Entschlüsselung (`__SLUG__`, `__ENCRYPTED_PAYLOAD__`) |
| `widgets.mjs` | Zentrale Bausteine: BCS, CNS (nicht beurteilbar), Unterlagen, Allgemeine Hinweise, Rechtliche Hinweise, Akademie, Beraterin, Footer, Lightbox |
| `template.html` | Vorlage für eine neue Akte (ohne Kundendaten) |
| `build.mjs` | Baut und verschlüsselt eine Akte |
| `src/<slug>/` | Klartext-Quelle der Akte — **gitignored**, nur lokal |

## Neue Akte anlegen

```bash
mkdir -p tools/beratung/src/<slug>/assets
cp tools/beratung/template.html tools/beratung/src/<slug>/index.html
# ausfüllen, Fotos/PDFs nach src/<slug>/assets/
node tools/beratung/build.mjs tools/beratung/src/<slug>/index.html --slug <slug>
# → beratung/<slug>/index.html + zufälliger Zugangscode in der Ausgabe
```

Beim Aktualisieren einer bestehenden Akte den bisherigen Code mit `--pin 1234` angeben.
Mit `--plain-out <datei>` wird zusätzlich der fertige Klartext (alle Bilder eingebettet)
geschrieben — als Sicherung außerhalb des Repos aufbewahren; er kann selbst wieder als
Quelle für `build.mjs` dienen.

## Bausteine einbinden

```html
<!-- @widget bcs {"score": 5, "horse": "Name"} -->
<!-- @widget cns-nicht-beurteilbar {"horse": "Name"} -->
<!-- @widget unterlagen {"items": [{"label": "Heuanalyse – PDF", "href": "@file:assets/heu.pdf", "download": "Heuanalyse.pdf"}]} -->
<!-- @widget allgemeine-hinweise {"eyebrow": "07 · Hinweise"} -->
<!-- @widget rechtliche-hinweise {"eyebrow": "08 · Rechtliches"} -->
<!-- @widget akademie {"campaign": "<slug>"} -->
<!-- @widget beraterin -->
<!-- @widget footer -->
<!-- @widget lightbox -->
```

`"@file:pfad"` in `src`/`href` wird beim Build als data:-URI eingebettet (Pfad relativ zur Quelle).
Änderungen an einem Baustein wirken sich auf jede Akte aus, die danach neu gebaut wird.

Tests: `node --test tools/beratung/*.test.mjs`
