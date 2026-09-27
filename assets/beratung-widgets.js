// Zentrale Bausteine für alle Beratungsakten (/beratung/<slug>/).
//
// Eine Akte enthält nur Platzhalter, die nach dem Entsperren durch assets/beratung.js
// hier ersetzt werden:
//
//   <div data-widget="akademie"></div>
//   <div data-widget="bcs" data-score="7" data-horse="Name"></div>
//
// data-*-Attribute werden als Parameter übergeben. Änderungen hier wirken sofort in
// allen Akten.
//
// Diese Datei ist öffentlich — hier gehören nur allgemeine Texte hinein, niemals Kundendaten.
(function (root) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const INFO_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  // ── Stammdaten: Zelle „Beraterin“ (im .meta-strip) ──
  function stammdatenBeraterin() {
    return `<div class="meta-cell">
          <div class="meta-cell-label">Beraterin</div>
          <dl>
            <dt>Name</dt>      <dd>Dipl.-Ing. Kristina Heidinger</dd>
            <dt>Betrieb</dt>   <dd>Pferdestärken – Unabhängige Ernährungsberatung für Pferde</dd>
            <dt>Adresse</dt>   <dd>Weiningergasse 3, 3040 Neulengbach</dd>
            <dt>E-Mail</dt>    <dd>beratung@pferdestaerken.at</dd>
            <dt>Website</dt>   <dd>pferdestaerken.at</dd>
          </dl>
        </div>`;
  }

  // ── Body Condition Score (1–9), im .befund-grid ──
  const BCS_SCALE = [
    { c: '#b83030', word: 'Extrem abgemagert', name: 'Extrem abgemagert' },
    { c: '#c05030', word: 'Sehr mager', name: 'Sehr mager' },
    { c: '#c07820', word: 'Mager', name: 'Mager' },
    { c: '#c8a820', word: 'Leicht unter&shy;wichtig', name: 'Leicht untergewichtig' },
    { c: '#4a9060', word: 'Ideal&shy;gewicht', name: 'Idealgewicht' },
    { c: '#c8a820', word: 'Leicht über&shy;wichtig', name: 'Leicht übergewichtig' },
    { c: '#B8832A', word: 'Über&shy;wichtig', name: 'Übergewichtig' },
    { c: '#c05030', word: 'Stark über&shy;gewichtig', name: 'Stark übergewichtig' },
    { c: '#b83030', word: 'Schwer adipös', name: 'Schwer adipös' },
  ];

  function bcs({ score, horse = '' } = {}) {
    const n = Number(score);
    if (!Number.isInteger(n) || n < 1 || n > 9) {
      throw new Error(`bcs: data-score muss 1–9 sein, war ${JSON.stringify(score)}`);
    }
    const active = BCS_SCALE[n - 1];
    const segs = BCS_SCALE.map((s, i) =>
      i === n - 1
        ? `                <div class="bcs-seg active" lang="de"><div class="bcs-arrow">${esc(horse)}</div><div class="bcs-bar" style="--c:${s.c}"></div><div class="bcs-num">${i + 1}</div><div class="bcs-word">${s.word}</div></div>`
        : `                <div class="bcs-seg" lang="de"><div class="bcs-bar" style="--c:${s.c}"></div><div class="bcs-num">${i + 1}</div><div class="bcs-word">${s.word}</div></div>`,
    ).join('\n');
    const mini = BCS_SCALE.map((s, i) =>
      `                  <div class="bcs-mini-seg${i === n - 1 ? ' active' : ''}" style="background:${s.c}"></div>`,
    ).join('\n');
    return `<div class="befund-item" style="grid-column: 1 / -1;">
            <div class="befund-item-label">Body Condition Score (BCS)</div>
            <div class="bcs-wrap">
              <div class="bcs-horse-tag">${esc(horse)} · BCS ${n} – ${active.name}</div>
              <div class="bcs-track">
${segs}
              </div>
              <!-- Mobile: Score-Karte + Mini-Balken -->
              <div class="bcs-mobile">
                <div class="bcs-score-card">
                  <div class="bcs-score-num">${n}</div>
                  <div class="bcs-score-info">
                    <div class="bcs-score-label">Body Condition Score</div>
                    <div class="bcs-score-name">${active.name}</div>
                  </div>
                </div>
                <div class="bcs-mini-bar">
${mini}
                </div>
                <div class="bcs-mini-labels">
                  <span>1 · Abgemagert</span>
                  <span>9 · Adipös</span>
                </div>
              </div>
            </div>
          </div>`;
  }

  // ── Cresty Neck Score: bei Onlineberatung nicht beurteilbar, im .befund-grid ──
  function cnsNichtBeurteilbar() {
    return `<div class="befund-item befund-na" style="grid-column: 1 / -1;">
            <div class="befund-item-label">Cresty Neck Score (CNS)</div>
            <div class="cns-wrap">
              <div class="cns-scale-wrap">
                <div class="cns-horse-tag">Skala 0–5 (Palpation erforderlich)</div>
                <!-- Desktop: 6-segment bar -->
                <div class="cns-track">
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#4a9060"></div><div class="cns-num">0</div><div class="cns-word">Kein Kammfett</div></div>
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#c8a820"></div><div class="cns-num">1</div><div class="cns-word">Minimal</div></div>
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#c8a820"></div><div class="cns-num">2</div><div class="cns-word">Leicht</div></div>
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#B8832A"></div><div class="cns-num">3</div><div class="cns-word">Moderat</div></div>
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#c05030"></div><div class="cns-num">4</div><div class="cns-word">Deutlich</div></div>
                  <div class="cns-seg" lang="de"><div class="cns-bar" style="--c:#b83030"></div><div class="cns-num">5</div><div class="cns-word">Extrem</div></div>
                </div>
                <!-- Mobile: Score-Karte + Mini-Balken -->
                <div class="cns-mobile">
                  <div class="bcs-score-card cns-score-card">
                    <div class="bcs-score-num cns-score-num">–</div>
                    <div class="bcs-score-info">
                      <div class="bcs-score-label">Cresty Neck Score</div>
                      <div class="bcs-score-name">Nicht beurteilbar</div>
                    </div>
                  </div>
                  <div class="bcs-mini-bar">
                    <div class="bcs-mini-seg" style="background:#4a9060"></div>
                    <div class="bcs-mini-seg" style="background:#c8a820"></div>
                    <div class="bcs-mini-seg" style="background:#c8a820"></div>
                    <div class="bcs-mini-seg" style="background:#B8832A"></div>
                    <div class="bcs-mini-seg" style="background:#c05030"></div>
                    <div class="bcs-mini-seg" style="background:#b83030"></div>
                  </div>
                  <div class="bcs-mini-labels">
                    <span>0 · Kein Kammfett</span>
                    <span>5 · Extrem</span>
                  </div>
                </div>
              </div>
              <div class="befund-na-label">
                ${INFO_ICON}
                Bei Onlineberatungen nicht beurteilbar — der CNS erfordert zwingend eine Palpation vor Ort.
              </div>
            </div>
          </div>`;
  }

  // ── Allgemeine Hinweise (unter der Rationsempfehlung) ──
  function allgemeineHinweise() {
    return `<div class="ration-hinweise">
          <div class="ration-hinweise-title">Allgemeine Hinweise</div>
          <ul class="ration-hinweise-list">
            <li>Darüber hinaus sollten keinerlei mineralisierten Futtermittel gegeben werden.</li>
            <li>Futterumstellungen immer kleinschrittig umsetzen.</li>
          </ul>
        </div>`;
  }

  // ── Rechtliche Hinweise / Haftungsausschluss ──
  function rechtlicheHinweise() {
    return `<hr class="report-divider">

      <!-- Haftungsausschluss -->
      <div class="report-section">
        <div class="section-eyebrow">Haftungsausschluss</div>
        <h2>Rechtliche Hinweise</h2>
        <div class="haftung-box">
          <p>Die vorliegenden Empfehlungen wurden von Dipl.-Ing. Kristina Heidinger im Rahmen einer Ernährungsberatung für Pferde (pferdestaerken.at) erstellt. Sie basieren ausschließlich auf den zum Beratungszeitpunkt vorliegenden Angaben der Tierhalterin sowie den direkt erhobenen Befunden. Für die Richtigkeit und Vollständigkeit der mitgeteilten Informationen übernimmt die Beraterin keine Haftung.</p>
          <p>Die Empfehlungen ersetzen keine tierärztliche Diagnose oder Behandlung. Bei Erkrankung, Verschlechterung des Allgemeinbefindens oder Unsicherheit ist unverzüglich ein Tierarzt hinzuzuziehen. Die Umsetzung der Rationsempfehlungen liegt in der alleinigen Verantwortung der Tierhalterin.</p>
          <p>Bei Sportpferden sind sämtliche empfohlenen Futtermittel und Ergänzungen vom Besitzer oder der Besitzerin eigenverantwortlich auf Dopingrelevanz zu überprüfen. pferdestaerken.at übernimmt hierfür keine Haftung.</p>
        </div>
      </div>`;
  }

  // ── Akademie für Angewandtes Pferdewissen ──
  function akademie() {
    return `<div class="akademie-section">
        <div class="section-eyebrow">Akademie für Angewandtes Pferdewissen</div>
        <p class="akademie-intro">Wenn du dein Wissen über Pferdefütterung weiter vertiefen möchtest, findest du hier meine Onlinekurse und E-Books:</p>
        <div class="akademie-cards">
          <a class="akademie-card" href="https://pferdewissen.at/online-kurse/hufe-gesund-fuettern/?utm_source=pferdestaerken&utm_medium=website" target="_blank" rel="noopener">
            <div class="akademie-card-label">Onlinekurs</div>
            <div class="akademie-card-title">Hufe gesund füttern</div>
          </a>
          <a class="akademie-card" href="https://pferdewissen.at/online-kurse/heuanalyse/?utm_source=pferdestaerken&utm_medium=website" target="_blank" rel="noopener">
            <div class="akademie-card-label">Onlinekurs</div>
            <div class="akademie-card-title">Das 1×1 der Heuanalyse</div>
          </a>
          <a class="akademie-card" href="https://pferdewissen.at/online-kurse/e-book-proteinversorgung/?utm_source=pferdestaerken&utm_medium=website" target="_blank" rel="noopener">
            <div class="akademie-card-label">E-Book</div>
            <div class="akademie-card-title">Proteinversorgung beim Pferd</div>
          </a>
        </div>
        <p class="akademie-rabatt">Mit dem Code <strong>BONUS10TINA-H</strong> bekommst du 10 % Rabatt auf alle <a href="https://pferdewissen.at/online-kurse/?utm_source=pferdestaerken&utm_medium=website" target="_blank" rel="noopener">Onlinekurse der Akademie</a>.</p>
      </div>`;
  }

  // ── Beraterin-Karte (Kristina Heidinger) ──
  function beraterin() {
    return `<div class="beraterin-card">
        <div class="beraterin-avatar">K</div>
        <div class="beraterin-info">
          <div class="beraterin-name">Dipl.-Ing. Kristina Heidinger</div>
          <div class="beraterin-detail">
            Ernährungsberatung für Pferde · pferdestaerken.at<br>
            Weiningergasse 3, 3040 Neulengbach<br>
            <a href="mailto:beratung@pferdestaerken.at">beratung@pferdestaerken.at</a>
          </div>
        </div>
      </div>`;
  }

  // ── Lightbox (von assets/beratung.js initialisiert) ──
  function lightbox() {
    return `<div id="lightbox" class="lightbox" role="dialog" aria-modal="true">
    <button class="lightbox-close" aria-label="Schließen">×</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Vorheriges Foto">‹</button>
    <img class="lightbox-img" src="" alt="">
    <button class="lightbox-nav lightbox-next" aria-label="Nächstes Foto">›</button>
    <div class="lightbox-counter"></div>
  </div>`;
  }

  // ── Footer ──
  function footer() {
    return `<footer class="site-footer">
      <span>© ${new Date().getFullYear()} pferdestaerken.at · Dipl.-Ing. Kristina Heidinger</span>
      <div class="footer-links">
        <a href="/impressum/">Impressum</a>
        <a href="/datenschutz/">Datenschutz</a>
      </div>
    </footer>`;
  }

  const WIDGETS = {
    'stammdaten-beraterin': stammdatenBeraterin,
    bcs,
    'cns-nicht-beurteilbar': cnsNichtBeurteilbar,
    'allgemeine-hinweise': allgemeineHinweise,
    'rechtliche-hinweise': rechtlicheHinweise,
    akademie,
    beraterin,
    lightbox,
    footer,
  };

  // Ersetzt alle <… data-widget="name"> in container durch den jeweiligen Baustein.
  function render(container) {
    for (const el of [...container.querySelectorAll('[data-widget]')]) {
      const fn = WIDGETS[el.dataset.widget];
      if (!fn) {
        console.warn('Unbekanntes Widget:', el.dataset.widget);
        continue;
      }
      const args = { ...el.dataset };
      delete args.widget;
      el.outerHTML = fn(args);
    }
  }

  root.BeratungWidgets = { render, widgets: WIDGETS };
})(typeof window !== 'undefined' ? window : globalThis);
