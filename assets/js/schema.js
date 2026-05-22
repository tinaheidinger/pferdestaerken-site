/**
 * Generates JSON-LD structured data for the current page and injects it as a
 * <script type="application/ld+json"> at the end of <head>.
 *
 * Page type is detected via <meta property="og:type">:
 *   - "website"  → ProfessionalService (homepage)
 *   - "article"  → Article  (blog posts)
 *
 * All brand / publisher / author defaults are configured once below.
 *
 * Googlebot renders JS before extracting structured data, so JS-injected
 * JSON-LD is indexable. Adding a new blog post requires no schema work — it
 * is built automatically from existing <meta> tags.
 */
(function () {
  /* ── Brand config (single source of truth) ── */
  var BRAND = {
    name: 'Pferdestärken - Unabhängige Futterberatung für Pferde',
    altName: 'pferdestaerken.at',
    url: 'https://pferdestaerken.at',
    email: 'beratung@pferdestaerken.at',
    logoUrl: 'https://pferdestaerken.at/assets/img/favicon/favicon-512.png',
    description: 'Unabhängige, wissenschaftlich fundierte Futterberatung für Pferde in Österreich.',
    foundingDate: '2021',
    address: {
      addressLocality: 'Neulengbach',
      postalCode: '3040',
      addressCountry: 'AT'
    },
    employee: {
      name: 'Kristina Heidinger',
      honorificPrefix: 'Dipl.-Ing.',
      jobTitle: 'Unabhängige Futterberaterin für Pferde'
    },
    offers: [
      { name: 'Rations-QuickCheck', price: '35' },
      { name: 'Online-Beratung',   price: '180' },
      { name: 'Vor-Ort-Beratung',  price: '230' }
    ],
    socialUrls: [
      'https://www.instagram.com/pferdestaerken_at/',
      'https://www.facebook.com/pferdestaerken.ernaehrungsberatung'
    ]
  };

  /* ── Helpers ── */
  function meta(prop) {
    var el = document.querySelector(
      'meta[property="' + prop + '"], meta[name="' + prop + '"]'
    );
    return el ? el.getAttribute('content') : null;
  }

  function inject(obj) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  /* ── Schema builders ── */
  function professionalService() {
    return {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: BRAND.name,
      alternateName: BRAND.altName,
      url: BRAND.url,
      email: BRAND.email,
      description: BRAND.description,
      foundingDate: BRAND.foundingDate,
      areaServed: { '@type': 'Country', name: 'Österreich' },
      address: Object.assign({ '@type': 'PostalAddress' }, BRAND.address),
      employee: Object.assign(
        { '@type': 'Person', url: BRAND.url },
        BRAND.employee
      ),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Leistungen',
        itemListElement: BRAND.offers.map(function (o) {
          return { '@type': 'Offer', name: o.name, price: o.price, priceCurrency: 'EUR' };
        })
      },
      sameAs: BRAND.socialUrls
    };
  }

  function article() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta('og:title'),
      description: meta('description'),
      image: meta('og:image'),
      datePublished: meta('article:published_time'),
      author: {
        '@type': 'Person',
        name: meta('article:author') || BRAND.employee.name
      },
      publisher: {
        '@type': 'Organization',
        name: 'Pferdestärken',
        logo: { '@type': 'ImageObject', url: BRAND.logoUrl }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': meta('og:url')
      }
    };
  }

  /* ── Dispatch ── */
  var type = meta('og:type');
  var path = location.pathname;
  var isHomepage = path === '/' || path === '/index.html';

  if (type === 'article') {
    inject(article());
  } else if (type === 'website' && isHomepage) {
    inject(professionalService());
  }
})();
