/**
 * GA4 event tracking for CTAs.
 *
 * Any element with `data-ga-cta="<name>"` (and optionally `data-ga-value="<eur>"`)
 * will fire a "generate_lead" event on click. This is the GA4-recommended event
 * for lead capture; it carries a currency + value so GA can aggregate lead value
 * automatically and lets the user filter by CTA name in funnel reports.
 *
 * No-op if gtag isn't loaded (i.e. user declined cookies). Uses event delegation
 * so we don't need to attach listeners per button — adding a new tagged button
 * anywhere on the site works automatically.
 */
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ga-cta]');
    if (!el) return;
    if (typeof window.gtag !== 'function') return; // GA not (yet) loaded

    var name = el.getAttribute('data-ga-cta');
    var value = parseFloat(el.getAttribute('data-ga-value'));

    var params = { cta_name: name };
    if (!isNaN(value)) {
      params.currency = 'EUR';
      params.value = value;
    }
    window.gtag('event', 'generate_lead', params);
  });
})();
