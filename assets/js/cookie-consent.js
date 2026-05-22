(function () {
  var COOKIE_NAME = 'pfs_consent';
  var GA_ID = 'G-CPEQ87L4XC';

  /* ── Helpers ── */
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m[2] : null;
  }

  function setCookie(name, value, days) {
    var exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + ';expires=' + exp + ';path=/;SameSite=Lax';
  }

  /* ── Load GA ── */
  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  /* ── Banner ── */
  function injectStyles() {
    var css = [
      '#pfs-cookie{position:fixed;bottom:0;left:0;right:0;z-index:9999;',
      'background:#2E2620;padding:20px 40px;',
      'box-shadow:0 -2px 20px rgba(0,0,0,0.18);',
      'font-family:"Plus Jakarta Sans",sans-serif;}',

      '#pfs-cookie-inner{max-width:860px;margin:0 auto;',
      'display:flex;align-items:center;gap:32px;}',

      '#pfs-cookie p{font-size:0.875rem;line-height:1.6;',
      'color:rgba(253,250,246,0.82);margin:0;flex:1;}',
      '#pfs-cookie p a{color:#D4A44C;text-underline-offset:3px;}',
      '#pfs-cookie strong{color:#FDFAF6;}',

      '#pfs-cookie-btns{display:flex;gap:10px;flex-shrink:0;}',

      '#pfs-accept{background:#B8832A;color:#fff;border:none;',
      'padding:10px 22px;border-radius:4px;',
      'font-family:inherit;font-size:0.875rem;font-weight:700;',
      'cursor:pointer;transition:background 0.2s;}',
      '#pfs-accept:hover{background:#D4A44C;}',

      '#pfs-decline{background:transparent;',
      'color:rgba(253,250,246,0.65);',
      'border:1px solid rgba(253,250,246,0.22);',
      'padding:10px 22px;border-radius:4px;',
      'font-family:inherit;font-size:0.875rem;font-weight:600;',
      'cursor:pointer;transition:all 0.2s;}',
      '#pfs-decline:hover{color:#FDFAF6;border-color:rgba(253,250,246,0.5);}',

      '@media(max-width:640px){',
      '#pfs-cookie{padding:20px;}',
      '#pfs-cookie-inner{flex-direction:column;align-items:flex-start;gap:16px;}',
      '#pfs-cookie-btns{width:100%;}',
      '#pfs-accept,#pfs-decline{flex:1;text-align:center;}}'
    ].join('');

    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  function datenschutzUrl() {
    return window.location.pathname.indexOf('/blog/') !== -1
      ? '../datenschutz.html'
      : 'datenschutz.html';
  }

  function showBanner() {
    injectStyles();
    var div = document.createElement('div');
    div.id = 'pfs-cookie';
    div.innerHTML =
      '<div id="pfs-cookie-inner">' +
        '<p>Diese Website verwendet Cookies. Mehr dazu in der ' +
        '<a href="' + datenschutzUrl() + '">Datenschutzerklärung</a>.</p>' +
        '<div id="pfs-cookie-btns">' +
          '<button id="pfs-accept">Akzeptieren</button>' +
          '<button id="pfs-decline">Ablehnen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);

    document.getElementById('pfs-accept').addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'yes', 365);
      div.remove();
      loadGA();
    });

    document.getElementById('pfs-decline').addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'no', 365);
      div.remove();
    });
  }

  /* ── Init ── */
  var consent = getCookie(COOKIE_NAME);
  if (consent === 'yes') {
    loadGA();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
