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

  /* ── Styles ── */
  function injectStyles() {
    var css = [
      '@keyframes pfs-fade{to{opacity:1;}}',
      '@keyframes pfs-pop{from{opacity:0;transform:translate(-50%,-50%) scale(0.96);}to{opacity:1;transform:translate(-50%,-50%) scale(1);}}',

      /* Backdrop: just dim, no blur */
      '#pfs-cookie-backdrop{position:fixed;inset:0;z-index:9998;',
      'background:rgba(20,14,8,0.5);',
      'opacity:0;animation:pfs-fade 220ms ease-out forwards;}',

      /* Modal: centered popup */
      '#pfs-cookie{position:fixed;top:50%;left:50%;z-index:9999;',
      'transform:translate(-50%,-50%);',
      'background:#fff;padding:36px 36px 28px;border-radius:10px;',
      'width:calc(100% - 40px);max-width:420px;',
      'box-shadow:0 20px 60px rgba(0,0,0,0.35);',
      'font-family:"Plus Jakarta Sans",sans-serif;',
      'animation:pfs-pop 240ms cubic-bezier(0.2,0.8,0.2,1) forwards;',
      'text-align:center;}',

      '#pfs-cookie h2{font-family:"Lora",serif;font-size:1.4rem;',
      'font-weight:700;color:#2E2620;margin:0 0 10px;}',

      '#pfs-cookie p{font-size:0.9rem;line-height:1.55;',
      'color:#6B5744;margin:0 0 24px;}',
      '#pfs-cookie p a{color:#B8832A;text-underline-offset:3px;}',

      /* Primary CTA: full-width, prominent */
      '#pfs-accept{display:block;width:100%;',
      'background:#B8832A;color:#fff;border:none;',
      'padding:14px 24px;border-radius:5px;',
      'font-family:inherit;font-size:0.95rem;font-weight:700;',
      'cursor:pointer;transition:background 0.2s,transform 0.1s;',
      'box-shadow:0 4px 14px rgba(184,131,42,0.35);',
      'letter-spacing:0.01em;}',
      '#pfs-accept:hover{background:#D4A44C;}',
      '#pfs-accept:active{transform:translateY(1px);}',

      /* Secondary: subtle text link */
      '#pfs-decline{display:block;margin:14px auto 0;',
      'background:none;border:none;',
      'color:#7A6B5E;font-family:inherit;font-size:0.825rem;',
      'cursor:pointer;text-decoration:underline;',
      'text-underline-offset:3px;}',
      '#pfs-decline:hover{color:#2E2620;}',

      '@media(max-width:640px){',
      '#pfs-cookie{padding:30px 24px 24px;}',
      '#pfs-cookie h2{font-size:1.25rem;}}'
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

  /* ── Banner ── */
  function showBanner() {
    injectStyles();

    var backdrop = document.createElement('div');
    backdrop.id = 'pfs-cookie-backdrop';
    document.body.appendChild(backdrop);

    var div = document.createElement('div');
    div.id = 'pfs-cookie';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-labelledby', 'pfs-cookie-title');
    div.innerHTML =
      '<h2 id="pfs-cookie-title">Cookies</h2>' +
      '<p>Diese Website verwendet Cookies. Details in der ' +
      '<a href="' + datenschutzUrl() + '">Datenschutzerklärung</a>.</p>' +
      '<button id="pfs-accept">Akzeptieren</button>' +
      '<button id="pfs-decline">Ablehnen</button>';
    document.body.appendChild(div);

    function dismiss() { div.remove(); backdrop.remove(); }

    document.getElementById('pfs-accept').addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'yes', 365);
      dismiss();
      loadGA();
    });

    document.getElementById('pfs-decline').addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'no', 365);
      dismiss();
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
