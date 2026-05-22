/**
 * Lightweight client-side component includes.
 *
 * Usage:
 *   <div data-include="header" data-back-href="/" data-back-label="Startseite"></div>
 *   <div data-include="footer"></div>
 *
 * The fetched HTML may contain {{name}} placeholders which are replaced with
 * the value of the corresponding data-name attribute on the placeholder.
 *
 * Components live under /assets/components/<name>.html and are cached by the
 * browser like any other static asset.
 */
(function () {
  function fill(html, vars) {
    return html.replace(/\{\{([\w-]+)\}\}/g, function (_, key) {
      return vars[key] != null ? vars[key] : '';
    });
  }

  function loadOne(el) {
    var name = el.getAttribute('data-include');
    var vars = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.name.indexOf('data-') === 0 && a.name !== 'data-include') {
        vars[a.name.substring(5)] = a.value;
      }
    }
    return fetch('/assets/components/' + name + '.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        el.outerHTML = fill(html, vars);
      })
      .catch(function (err) {
        console.error('[components] failed to load', name, err);
      });
  }

  function loadAll() {
    var els = document.querySelectorAll('[data-include]');
    for (var i = 0; i < els.length; i++) loadOne(els[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }
})();
