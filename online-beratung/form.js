(function () {
  'use strict';

  // Production Turnstile sitekey (Cloudflare dashboard: pferdestaerken-online-beratung
  // widget, scoped to pferdestaerken.at).
  var TURNSTILE_SITE_KEY = '0x4AAAAAAD0fgjcA8S-mCmbt';
  var INTAKE_ENDPOINT = 'https://crm.pferdestaerken.at/api/public/intake';
  var DRAFT_KEY = 'pfs_online_beratung_draft_v1';
  var DRAFT_MAX_AGE_MS = 48 * 60 * 60 * 1000;

  var form = document.getElementById('intake-form');
  var banner = document.getElementById('form-banner');
  var draftNote = document.getElementById('draft-note');
  var submitBtn = document.getElementById('submit-btn');
  var successPanel = document.getElementById('success-panel');
  var turnstileNote = document.getElementById('turnstile-note');

  var formLoadedAt = Date.now();
  var turnstileToken = '';
  var turnstileWidgetId = null;

  // Fields that get autosaved as a draft. Consent checkboxes are
  // deliberately excluded — consent should be actively re-confirmed
  // every time, not silently restored.
  var DRAFT_FIELD_NAMES = [
    'firstName', 'lastName', 'email', 'address',
    'horseName', 'horseBreed', 'horseAge', 'horseHeight', 'horseWeight', 'horseSex',
    'horseKeeping', 'training', 'preExisting',
    'hayKg', 'feed'
  ];

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    // Fallback for older browsers without crypto.randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Deliberately doesn't scroll on its own: the validation-failure caller
  // already focuses/scrolls to the first invalid field, and scrolling both
  // there and to the banner races two smooth-scroll animations against each
  // other with an unpredictable final position.
  function showBanner(kind, message) {
    banner.textContent = message;
    banner.className = 'form-banner visible ' + kind;
  }
  function hideBanner() {
    banner.className = 'form-banner';
    banner.textContent = '';
  }

  /* ---------- Draft persistence ---------- */

  function loadDraft() {
    var raw;
    try { raw = window.localStorage.getItem(DRAFT_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var draft;
    try { draft = JSON.parse(raw); } catch (e) { return null; }
    if (!draft || typeof draft !== 'object') return null;
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
      clearDraft();
      return null;
    }
    return draft;
  }

  function clearDraft() {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }

  function saveDraft() {
    var fields = {};
    DRAFT_FIELD_NAMES.forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      if (el instanceof RadioNodeList) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        fields[name] = checked ? checked.value : '';
      } else {
        fields[name] = el.value;
      }
    });
    var draft = { savedAt: Date.now(), idempotencyKey: idempotencyKey, fields: fields };
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* storage full/unavailable, non-fatal */ }
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }
  var debouncedSave = debounce(saveDraft, 500);

  function restoreDraft(draft) {
    DRAFT_FIELD_NAMES.forEach(function (name) {
      var value = draft.fields[name];
      if (value == null) return;
      var el = form.elements[name];
      if (!el) return;
      if (el instanceof RadioNodeList) {
        var radio = form.querySelector('input[name="' + name + '"][value="' + CSS.escape(value) + '"]');
        if (radio) radio.checked = true;
      } else {
        el.value = value;
      }
    });
    draftNote.className = 'draft-note visible';
  }

  var existingDraft = loadDraft();
  var idempotencyKey = (existingDraft && existingDraft.idempotencyKey) || uuid();
  if (existingDraft) restoreDraft(existingDraft);

  form.addEventListener('input', debouncedSave);
  form.addEventListener('change', debouncedSave);

  /* ---------- Turnstile ---------- */

  window.onTurnstileLoad = function () {
    turnstileWidgetId = window.turnstile.render('#turnstile-widget', {
      sitekey: TURNSTILE_SITE_KEY,
      callback: function (token) { turnstileToken = token; turnstileNote.classList.remove('visible'); },
      'expired-callback': function () { turnstileToken = ''; },
      'error-callback': function () { turnstileToken = ''; turnstileNote.classList.add('visible'); }
    });
  };
  // api.js is loaded with `async defer` and no onload param here, so poll
  // briefly for the global instead of relying on script order.
  (function waitForTurnstile() {
    if (window.turnstile) { window.onTurnstileLoad(); return; }
    setTimeout(waitForTurnstile, 150);
  })();
  setTimeout(function () {
    if (!window.turnstile) turnstileNote.classList.add('visible');
  }, 8000);

  /* ---------- Validation ---------- */

  function setFieldError(el, errId, invalid) {
    var errEl = errId ? document.getElementById(errId) : null;
    if (el) el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    if (errEl) errEl.classList.toggle('visible', !!invalid);
  }

  function validate() {
    var firstInvalid = null;
    var ok = true;

    function check(name, errId, extra) {
      var el = form.elements[name];
      var invalid = false;
      if (el instanceof RadioNodeList) {
        invalid = !form.querySelector('input[name="' + name + '"]:checked');
      } else {
        invalid = !el.value.trim();
        if (!invalid && extra) invalid = !extra(el.value.trim());
      }
      setFieldError(el instanceof RadioNodeList ? null : el, errId, invalid);
      if (invalid) {
        ok = false;
        if (!firstInvalid) firstInvalid = (el instanceof RadioNodeList) ? form.querySelector('input[name="' + name + '"]') : el;
      }
      return !invalid;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    check('firstName', 'err-first-name');
    check('lastName', 'err-last-name');
    check('email', 'err-email', function (v) { return emailPattern.test(v); });
    check('address', 'err-address');
    check('horseName', 'err-horse-name');
    check('horseBreed', 'err-horse-breed');
    check('horseAge', 'err-horse-age');
    check('horseHeight', 'err-horse-height');
    check('horseWeight', 'err-horse-weight');
    check('horseSex', 'err-horse-sex');
    check('horseKeeping', 'err-horse-keeping');
    check('training', 'err-training');
    check('preExisting', 'err-pre-existing');
    check('hayKg', 'err-hay');
    check('feed', 'err-feed');

    var consentOk = form.elements.consentPaid.checked && form.elements.consentPrivacy.checked;
    document.getElementById('err-consent').classList.toggle('visible', !consentOk);
    if (!consentOk) { ok = false; if (!firstInvalid) firstInvalid = form.elements.consentPaid; }

    if (!ok && firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  /* ---------- Submit ---------- */

  function buildPayload() {
    return {
      idempotencyKey: idempotencyKey,
      contact: {
        firstName: form.elements.firstName.value.trim(),
        lastName: form.elements.lastName.value.trim(),
        email: form.elements.email.value.trim(),
        address: form.elements.address.value.trim()
      },
      horse: {
        name: form.elements.horseName.value.trim(),
        breed: form.elements.horseBreed.value.trim(),
        age: form.elements.horseAge.value.trim(),
        height: form.elements.horseHeight.value.trim(),
        weight: form.elements.horseWeight.value.trim(),
        sex: (form.querySelector('input[name="horseSex"]:checked') || {}).value || '',
        keeping: form.elements.horseKeeping.value.trim()
      },
      training: form.elements.training.value.trim(),
      preExisting: form.elements.preExisting.value.trim(),
      hayKg: form.elements.hayKg.value.trim(),
      feed: form.elements.feed.value.trim(),
      consentPaid: form.elements.consentPaid.checked,
      consentPrivacy: form.elements.consentPrivacy.checked,
      meta: {
        website: form.elements.website.value, // honeypot, expected empty
        formLoadedAt: new Date(formLoadedAt).toISOString(),
        turnstileToken: turnstileToken
      }
    };
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideBanner();

    if (!validate()) {
      showBanner('error', 'Bitte überprüfe die markierten Felder.');
      return;
    }

    if (!turnstileToken) {
      showBanner('error', 'Die Sicherheitsprüfung ist noch nicht abgeschlossen. Bitte warte einen Moment und versuche es erneut.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    fetch(INTAKE_ENDPOINT, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
      .then(function (res) {
        if (!res.ok) throw new Error('http_' + res.status);
        clearDraft();
        form.style.display = 'none';
        document.querySelector('.required-legend').style.display = 'none';
        successPanel.classList.add('visible');
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () {
        // Deliberately don't reset the form or the draft here — the
        // whole point is that a retry after a failure costs nothing.
        showBanner('error', 'Das Absenden hat leider nicht geklappt. Deine Eingaben sind nicht verloren — bitte versuche es gleich noch einmal.');
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.turnstile && turnstileWidgetId !== null) {
          window.turnstile.reset(turnstileWidgetId);
          turnstileToken = '';
        }
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Anfrage absenden';
      });
  });
})();
