// Zentrale Bausteine für alle Beratungsakten (/beratung/<slug>/).
//
// Eine Akte enthält nur Platzhalter, die nach dem Entsperren durch assets/beratung.js
// hier ersetzt werden:
//
//   <div data-widget="akademie" data-campaign="slug"></div>
//   <div data-widget="bcs" data-score="5" data-horse="Name"></div>
//
// data-*-Attribute werden als Parameter übergeben; der Inhalt des Platzhalters (falls
// vorhanden) als Parameter "content" (z. B. Beschreibung beim BCS, Rabatt-Text bei der
// Akademie). Änderungen hier wirken sofort in allen Akten.
//
// Diese Datei ist öffentlich — hier gehören nur allgemeine Texte hinein, niemals Kundendaten.
(function (root) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const INFO_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  // ── Body Condition Score (Henneke, 1–9) ──
  const BCS_SCALE = [
    { n: 1, word: 'Kachektisch', c: '#c0392b' },
    { n: 2, word: 'Sehr mager', c: '#d9622b' },
    { n: 3, word: 'Mager', c: '#e8a33d' },
    { n: 4, word: 'Mäßig mager', c: '#a9c46c' },
    { n: 5, word: 'Ideal', c: '#2d7a44' },
    { n: 6, word: 'Mäßig fleischig', c: '#a9c46c' },
    { n: 7, word: 'Fleischig', c: '#e8a33d' },
    { n: 8, word: 'Fett', c: '#d9622b' },
    { n: 9, word: 'Adipös', c: '#c0392b' },
  ];

  function bcs({ score, horse = '', content = '' } = {}) {
    const active = BCS_SCALE.find((s) => s.n === Number(score));
    if (!active) throw new Error(`bcs: score muss 1–9 sein, war ${JSON.stringify(score)}`);
    const segs = BCS_SCALE.map(
      (s) => `
            <div class="bcs-seg${s === active ? ' active' : ''}" style="--c:${s.c}">
              ${s === active ? `<span class="bcs-arrow">${esc(horse || 'BCS ' + s.n)}</span>` : ''}
              <div class="bcs-bar"></div>
              <div class="bcs-num">${s.n}</div>
              <div class="bcs-word">${esc(s.word)}</div>
            </div>`,
    ).join('');
    const mini = BCS_SCALE.map(
      (s) => `<div class="bcs-mini-seg${s === active ? ' active' : ''}" style="background:${s.c}"></div>`,
    ).join('');
    return `
        <div class="befund-item befund-full">
          <div class="befund-item-label">Body Condition Score (BCS)</div>
          <div class="befund-score">${active.n} / 9</div>
          <div class="bcs-wrap">
            ${horse ? `<div class="bcs-horse-tag">${esc(horse)}</div>` : ''}
            <div class="bcs-track">${segs}
            </div>
            <div class="bcs-mobile">
              <div class="bcs-score-card">
                <div class="bcs-score-num">${active.n}</div>
                <div class="bcs-score-info">
                  <div class="bcs-score-label">BCS · Skala 1–9</div>
                  <div class="bcs-score-name">${esc(active.word)}</div>
                </div>
              </div>
              <div class="bcs-mini-bar">${mini}</div>
              <div class="bcs-mini-labels"><span>1 · mager</span><span>5 · ideal</span><span>9 · adipös</span></div>
            </div>
          </div>
          ${content ? `<p class="befund-desc" style="margin-top:14px">${content}</p>` : ''}
        </div>`;
  }

  // ── Cresty Neck Score (Carter et al. 2009, 0–5) ──
  const CNS_SCALE = [
    { n: 0, word: 'Kein Kamm', c: '#2d7a44' },
    { n: 1, word: 'Tastbar', c: '#a9c46c' },
    { n: 2, word: 'Sichtbar', c: '#e8c53d' },
    { n: 3, word: 'Ausgeprägt', c: '#e8a33d' },
    { n: 4, word: 'Stark ausgeprägt', c: '#d9622b' },
    { n: 5, word: 'Kippt seitlich', c: '#c0392b' },
  ];

  // CNS bei Onlineberatung: Skala ausgegraut + Hinweis „nicht beurteilbar“.
  function cnsNichtBeurteilbar({
    horse = '',
    reason = 'Im Rahmen einer Onlineberatung nicht beurteilbar – der Cresty Neck Score erfordert ein Abtasten des Mähnenkamms vor Ort.',
  } = {}) {
    const segs = CNS_SCALE.map(
      (s) => `
                <div class="cns-seg" style="--c:${s.c}">
                  <div class="cns-bar"></div>
                  <div class="cns-num">${s.n}</div>
                  <div class="cns-word">${esc(s.word)}</div>
                </div>`,
    ).join('');
    return `
        <div class="befund-item befund-full befund-na">
          <div class="befund-item-label">Cresty Neck Score (CNS)</div>
          <div class="cns-wrap">
            <div class="cns-scale-wrap" aria-hidden="true">
              ${horse ? `<div class="cns-horse-tag">${esc(horse)}</div>` : ''}
              <div class="cns-track">${segs}
              </div>
              <div class="cns-mobile">
                <div class="bcs-score-card cns-score-card">
                  <div class="bcs-score-num cns-score-num">–</div>
                  <div class="bcs-score-info">
                    <div class="bcs-score-label">CNS · Skala 0–5</div>
                    <div class="bcs-score-name">nicht beurteilt</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="befund-na-label">${INFO_ICON}<span>${esc(reason)}</span></div>
          </div>
        </div>`;
  }

  // ── Lightbox (einmal pro Akte, wird von shell.html initialisiert) ──
  function lightbox() {
    return `
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Bildansicht">
      <button class="lightbox-close" aria-label="Schließen">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Vorheriges Bild">&#8249;</button>
      <img class="lightbox-img" alt="">
      <button class="lightbox-nav lightbox-next" aria-label="Nächstes Bild">&#8250;</button>
      <div class="lightbox-counter"></div>
    </div>`;
  }

  // ── Allgemeine Hinweise ──
  function allgemeineHinweise({ eyebrow = 'Hinweise' } = {}) {
    return `
      <section class="report-section">
        <div class="section-eyebrow">${esc(eyebrow)}</div>
        <h2>Allgemeine Hinweise</h2>
        <div class="ration-hinweise">
          <div class="ration-hinweise-title">Für eine erfolgreiche Umsetzung</div>
          <ul class="ration-hinweise-list">
            <li><strong>Futterumstellungen immer schrittweise</strong> über 10 bis 14 Tage vornehmen – neue Futtermittel mit kleinen Mengen beginnen und langsam auf die empfohlene Menge steigern.</li>
            <li><strong>Frisches, sauberes Wasser</strong> muss jederzeit zur freien Verfügung stehen.</li>
            <li><strong>Mineralfutter nicht kombinieren:</strong> Bitte nur das empfohlene Mineralfutter einsetzen und nicht zusätzlich andere Mineral- oder Vitaminprodukte füttern, da sonst Über- oder Fehlversorgungen entstehen können.</li>
            <li><strong>Gewicht und Körperkondition regelmäßig kontrollieren</strong> – z.&nbsp;B. alle 2 bis 4 Wochen mit dem Maßband und Fotos aus immer derselben Perspektive. So lassen sich Veränderungen frühzeitig erkennen und die Ration bei Bedarf anpassen.</li>
            <li><strong>Neue Heucharge = neue Ausgangslage:</strong> Ändert sich das Heu, ändert sich auch die Nährstoffversorgung. Idealerweise wird jede neue Charge analysiert.</li>
            <li><strong>Bei gesundheitlichen Veränderungen</strong> bitte immer zuerst tierärztlichen Rat einholen und mich anschließend informieren, damit die Ration angepasst werden kann.</li>
          </ul>
        </div>
      </section>`;
  }

  // ── Rechtliche Hinweise / Haftungsausschluss ──
  function rechtlicheHinweise({ eyebrow = 'Rechtliches' } = {}) {
    return `
      <section class="report-section">
        <div class="section-eyebrow">${esc(eyebrow)}</div>
        <h2>Rechtliche Hinweise</h2>
        <div class="haftung-box">
          <p>Diese Futterberatung ersetzt keine tierärztliche Untersuchung, Diagnose oder Behandlung. Bei gesundheitlichen Auffälligkeiten ist immer eine Tierärztin bzw. ein Tierarzt hinzuzuziehen. Die Beratung umfasst ausschließlich die Beratung hinsichtlich artgerechter Ernährung im Rahmen des freien Gewerbes – mit Ausnahme der den Tierärzt:innen vorbehaltenen diagnostischen und therapeutischen Tätigkeiten.</p>
          <p>Die Empfehlungen beruhen auf den zur Verfügung gestellten Angaben, Fotos und Unterlagen (z.&nbsp;B. Heuanalysen) zum Zeitpunkt der Beratung. Für die Richtigkeit und Vollständigkeit dieser Angaben kann keine Haftung übernommen werden. Ändern sich Gesundheitszustand, Haltung, Nutzung oder Futtermittel, sollte die Ration neu bewertet werden.</p>
          <p>Die Umsetzung der Empfehlungen erfolgt in der Verantwortung der Pferdehalterin bzw. des Pferdehalters. Nährstoffgehalte von Futtermitteln unterliegen natürlichen Schwankungen; berechnete Werte sind daher als Orientierung zu verstehen.</p>
          <p>Diese Beratungsakte ist ausschließlich für die Auftraggeberin bzw. den Auftraggeber bestimmt. Eine Weitergabe an Dritte – ausgenommen an die betreuende Tierärztin bzw. den betreuenden Tierarzt – ist nur nach Rücksprache gestattet.</p>
        </div>
      </section>`;
  }

  // ── Akademie Pferdewissen ──
  const UTM = 'utm_source=pferdestaerken&utm_medium=beratungsakte';
  const AKADEMIE_KURSE = [
    { label: 'Onlinekurs', title: 'Hufe gesund füttern', path: 'online-kurse/hufe-gesund-fuettern/' },
    { label: 'Onlinekurs', title: 'Das 1×1 der Heuanalyse', path: 'online-kurse/heuanalyse/' },
    { label: 'E-Book', title: 'Proteinversorgung beim Pferd', path: 'online-kurse/e-book-proteinversorgung/' },
  ];

  function akademie({ campaign = '', content = '' } = {}) {
    const utm = campaign ? `${UTM}&utm_campaign=${encodeURIComponent(campaign)}` : UTM;
    const cards = AKADEMIE_KURSE.map(
      (k) => `
          <a class="akademie-card" href="https://pferdewissen.at/${k.path}?${utm}" target="_blank" rel="noopener">
            <div class="akademie-card-label">${esc(k.label)}</div>
            <div class="akademie-card-title">${esc(k.title)}</div>
          </a>`,
    ).join('');
    return `
      <section class="akademie-section">
        <div class="section-eyebrow">Akademie Pferdewissen</div>
        <h2>Wissen vertiefen</h2>
        <p class="akademie-intro">Du möchtest noch tiefer in die Pferdefütterung einsteigen? In meinen Onlinekursen und E-Books erkläre ich die Hintergründe praxisnah und wissenschaftlich fundiert – zum Nachlesen und Nachschauen in deinem eigenen Tempo.</p>
        <div class="akademie-cards">${cards}
        </div>
        <p class="akademie-rabatt">${
          content ||
          `Alle Kurse und E-Books findest du auf <a href="https://pferdewissen.at/?${utm}" target="_blank" rel="noopener">pferdewissen.at</a>.`
        }</p>
      </section>`;
  }

  // ── Beraterin-Karte (Kristina Heidinger) ──
  function beraterin() {
    return `
      <div class="beraterin-card">
        <div class="beraterin-avatar">KH</div>
        <div>
          <div class="beraterin-name">Dipl.-Ing. Kristina Heidinger</div>
          <div class="beraterin-detail">
            Unabhängige Futterberatung für Pferde<br>
            Fragen zur Beratung? Schreib mir gerne: <a href="mailto:beratung@pferdestaerken.at">beratung@pferdestaerken.at</a><br>
            <a href="https://pferdestaerken.at/" target="_blank" rel="noopener">pferdestaerken.at</a>
          </div>
        </div>
      </div>`;
  }

  // ── Footer ──
  function footer({ year = new Date().getFullYear() } = {}) {
    return `
    <footer class="site-footer">
      <div>© ${esc(year)} pferdestaerken.at · Dipl.-Ing. Kristina Heidinger</div>
      <div class="footer-links">
        <a href="/impressum/">Impressum</a>
        <a href="/datenschutz/">Datenschutz</a>
      </div>
    </footer>`;
  }

  const WIDGETS = {
    bcs,
    'cns-nicht-beurteilbar': cnsNichtBeurteilbar,
    lightbox,
    'allgemeine-hinweise': allgemeineHinweise,
    'rechtliche-hinweise': rechtlicheHinweise,
    akademie,
    beraterin,
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
      if (el.innerHTML.trim()) args.content = el.innerHTML.trim();
      el.outerHTML = fn(args);
    }
  }

  root.BeratungWidgets = { render, widgets: WIDGETS };
})(typeof window !== 'undefined' ? window : globalThis);
