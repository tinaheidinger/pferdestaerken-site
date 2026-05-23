/**
 * Auto-populates the homepage blog grid (#latest-posts) with the most recent
 * posts from /blog/. Reads the blog index page once, takes the first 8
 * <a class="index-card"> elements (already in newest-first order), and
 * rewrites them into the homepage's .b-card markup.
 *
 * The pre-rendered HTML inside #latest-posts stays as a fallback for crawlers
 * that don't run JS and as a fast first paint while the fetch is in flight.
 */
(function () {
  var grid = document.getElementById('latest-posts');
  if (!grid) return;

  var MAX = 8;

  fetch('/blog/')
    .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var cards = doc.querySelectorAll('.index-card');
      if (!cards.length) return;

      var out = '';
      for (var i = 0; i < Math.min(cards.length, MAX); i++) {
        var c = cards[i];
        var href  = c.getAttribute('href');               // e.g. "heuanalyse-oesterreich"
        var pic   = c.querySelector('picture');
        var tag   = c.querySelector('.index-card-tag');
        var title = c.querySelector('h2');
        if (!pic || !tag || !title || !href) continue;

        // Rewrite relative image paths from blog-context to homepage-context
        // and swap the image class so the homepage CSS applies.
        var picHTML = pic.outerHTML
          .replace(/srcset="img\//g, 'srcset="blog/img/')
          .replace(/src="img\//g,   'src="blog/img/')
          .replace(/class="index-card-img"/g, 'class="b-img"');

        out +=
          '<a href="blog/' + href + '" class="b-card">' +
            picHTML +
            '<div class="b-body">' +
              '<div class="b-tag">' + tag.textContent + '</div>' +
              '<h3>' + title.textContent + '</h3>' +
            '</div>' +
          '</a>';
      }
      if (out) grid.innerHTML = out;
    })
    .catch(function (err) {
      console.error('[latest-posts] failed to refresh:', err);
      // Fallback: leave the pre-rendered HTML in place
    });
})();
