// Builds public/: one Romanian and one English copy of every page from the bilingual sources.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { geoConicConformal, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const SITE = JSON.parse(readFileSync('data/site.json', 'utf8'));
const { pages: PAGES, contact: C, routes: ROUTES } = SITE;
// SITE_BASE overrides the address for one build (the classic-hosting copy is built for www.frigofood.ro).
const BASE = process.env.SITE_BASE || SITE.base;
const OUT = 'public';
const LANGS = ['ro', 'en'];
// CSS and JS are cached for an hour (vercel.json); the version makes each deploy fetch fresh copies.
const V = createHash('sha1').update(['css/site.css', 'js/site.js', 'data/site.json', 'package-lock.json'].map((f) => readFileSync(f)).join('')).digest('hex').slice(0, 8);

const url = (page, lang) => {
  const file = lang === 'en' ? PAGES[page] : page;
  const dir = lang === 'en' ? '/en/' : '/';
  return file === 'index.html' ? dir : dir + file;
};
const tr = (lang) => (ro, en) => (lang === 'en' ? en : ro);
const tel = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
const bi = (ro, en) => `<span lang="ro">${ro}</span><span lang="en">${en}</span>`;
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const join = (items, lang, or = false) => (items.length < 2 ? items.join('')
  : `${items.slice(0, -1).join(', ')} ${or ? (lang === 'en' ? 'or' : 'sau') : (lang === 'en' ? 'and' : 'și')} ${items.at(-1)}`);
const theEn = (c) => (/^(Netherlands|United Kingdom)$/.test(c.en) ? `the ${c.en}` : c.en);
const cities = (c, lang) => c.cities.map((x) => x.split('|')[lang === 'en' ? x.split('|').length - 1 : 0]);
const FAQ = JSON.parse(readFileSync('data/faq.json', 'utf8'));

// One page per route, generated from data/site.json and registered like the hand-written pages.
const ROUTE_PAGES = {};
for (const c of ROUTES.countries) {
  const file = `transport-frigorific-${slug(c.ro)}-romania.html`;
  PAGES[file] = `refrigerated-transport-${slug(c.en)}-romania.html`;
  ROUTE_PAGES[file] = c;
  c.file = file;
}
for (const c of ROUTES.countries) c.page = { ro: url(c.file, 'ro'), en: url(c.file, 'en') };
const phoneLinks = (cls = '') => C.phones.map((p) => `<a${cls ? ` class="${cls}"` : ''} href="${tel(p)}">${p}</a>`).join('');

/* ---------- Language stripping: drop every element marked with the other language ---------- */

function stripLang(html, drop) {
  const open = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\slang="${drop}"[^>]*>`, 'g');
  let out = '';
  let from = 0;
  let m;
  while ((m = open.exec(html))) {
    if (m[1].toLowerCase() === 'html') continue;
    const tag = m[1];
    const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
    tags.lastIndex = m.index + m[0].length;
    let depth = 1;
    let end = -1;
    let mm;
    while ((mm = tags.exec(html))) {
      if (mm[0].endsWith('/>')) continue;
      depth += mm[1] ? -1 : 1;
      if (!depth) { end = mm.index + mm[0].length; break; }
    }
    if (end < 0) throw new Error(`Unbalanced <${tag} lang="${drop}"> near: ${html.slice(m.index, m.index + 80)}`);
    out += html.slice(from, m.index);
    from = end;
    open.lastIndex = end;
  }
  return out + html.slice(from);
}

/* ---------- Icons (Lucide, ISC licence), inlined so no icon script ships ---------- */

const iconCache = {};
function iconSvg(name) {
  if (!iconCache[name]) {
    const file = require.resolve(`lucide-static/icons/${name}.svg`);
    iconCache[name] = readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/stroke-width="2"/, 'stroke-width="1.75"')
      .replace('<svg', '<svg aria-hidden="true" focusable="false"')
      .trim();
  }
  return iconCache[name];
}
const icon = (name) => `<i data-lucide="${name}"></i>`;
const inlineIcons = (html) => html.replace(/<i data-lucide="([\w-]+)"[^>]*><\/i>/g, (_, n) => iconSvg(n));

/* ---------- Shared chrome ---------- */

const NAV = [
  ['index.html', 'Acasă', 'Home'],
  ['transport-ftl.html', 'Transport FTL', 'FTL transport'],
  ['grupaj-frigorific.html', 'Grupaj frigorific', 'Groupage'],
  ['rute.html', 'Rute', 'Routes'],
  ['despre-noi.html', 'Despre noi', 'About us'],
  ['contact.html', 'Contact', 'Contact'],
];

function header(lang, page) {
  const t = tr(lang);
  const current = ROUTE_PAGES[page] ? 'rute.html' : page;
  const links = NAV.map(([p, ro, en]) => `<li><a href="${url(p, lang)}"${p === current ? ' aria-current="page"' : ''}>${t(ro, en)}</a></li>`).join('');
  const switchTo = (l, label, name) =>
    `<a href="${url(page, l)}" hreflang="${l}" lang="${l}" data-lang-link${l === lang ? ' aria-current="true"' : ''} aria-label="${name}">${label}</a>`;
  return `
  <a class="skip" href="#main">${t('Sari la conținut', 'Skip to content')}</a>
  <div class="topstrip">
    <div class="wrap">
      <span class="topstrip__note">${t('Casă de expediții pentru transport frigorific internațional', 'Refrigerated freight forwarding across Europe')}</span>
      <span class="topstrip__contacts">
        <span class="topstrip__phones">${icon('phone')}${phoneLinks()}</span>
        <a class="topstrip__mail" href="mailto:${C.email}">${icon('mail')}${C.email}</a>
      </span>
    </div>
  </div>
  <header class="header" id="header">
    <div class="wrap">
      <a class="brand" href="${url('index.html', lang)}" aria-label="Frigo Food Distribution">
        <img src="/brand/logo/ffd-logo-horizontal.svg" alt="Frigo Food Distribution" width="220" height="44">
      </a>
      <nav class="nav" id="nav" aria-label="${t('Meniu principal', 'Main menu')}"><ul>${links}</ul>
        <div class="nav__contact">
          <a class="btn btn--primary" href="${url('contact.html', lang)}#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
          <p class="nav__label">${t('Sună-ne', 'Call us')}</p>
          <div class="nav__phones">${C.phones.map((p) => `<a href="${tel(p)}">${icon('phone')}${p}</a>`).join('')}</div>
          <a class="nav__mail" href="mailto:${C.email}">${icon('mail')}${C.email}</a>
        </div>
      </nav>
      <div class="header__actions">
        <div class="lang" role="group" aria-label="${t('Limba', 'Language')}">
          ${switchTo('ro', 'RO', 'Română')}${switchTo('en', 'EN', 'English')}
        </div>
        <a class="btn btn--primary" href="${url('contact.html', lang)}#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="${t('Deschide meniul', 'Open menu')}">${icon('menu')}</button>
      </div>
    </div>
  </header>`;
}

function footer(lang) {
  const t = tr(lang);
  const links = NAV.map(([p, ro, en]) => `<li><a href="${url(p, lang)}">${t(ro, en)}</a></li>`).join('');
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="/brand/logo/ffd-logo-horizontal-white.svg" alt="Frigo Food Distribution" width="260" height="52" loading="lazy">
          <p>${t('Casă de expediții specializată în transporturi internaționale cu temperatură controlată, FTL și grupaj, pentru industria alimentară.',
                 'Freight forwarder specialising in international temperature-controlled transport, FTL and groupage, for the food industry.')}</p>
        </div>
        <div>
          <h4>${t('Pagini', 'Pages')}</h4>
          <ul>${links}</ul>
        </div>
        <div>
          <h4>${t('Servicii', 'Services')}</h4>
          <ul>
            <li><a href="${url('transport-ftl.html', lang)}">${t('Transport frigorific FTL', 'Refrigerated FTL transport')}</a></li>
            <li><a href="${url('grupaj-frigorific.html', lang)}">${t('Grupaj frigorific', 'Refrigerated groupage')}</a></li>
            <li><a href="${url('rute.html', lang)}">${t('Rute internaționale', 'International routes')}</a></li>
            <li><a href="${url('contact.html', lang)}#oferta">${t('Solicită o ofertă', 'Request a quote')}</a></li>
          </ul>
        </div>
        <div>
          <h4>${C.company}</h4>
          <ul>
            ${C.phones.map((p) => `<li><a href="${tel(p)}">${p}</a></li>`).join('')}
            <li><a href="mailto:${C.email}">${C.email}</a></li>
            <li><a href="${C.mapUrl}" target="_blank" rel="noopener">${C.street}, ${C.city}, ${t(C.county.ro, C.county.en)}, ${t(C.country.ro, C.country.en)}</a></li>
            <li><a href="${url('contact.html', lang)}">${t('Pagina de contact', 'Contact page')}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__legal">
        <span>© ${new Date().getFullYear()} ${C.company}</span>
        <span class="footer__ids">
          <span>CUI ${C.cui}</span>
          <span>EUID ${C.euid}</span>
          <span>${t('Sediu', 'Registered office')}: ${C.street}, ${C.city}, ${t(C.county.ro, C.county.en)}</span>
          <a href="${url('confidentialitate.html', lang)}">${t('Politica de confidențialitate', 'Privacy policy')}</a>
          <a href="${url('confidentialitate.html', lang)}#cookies">${t('Politica privind cookie-urile', 'Cookie policy')}</a>
        </span>
      </div>
    </div>
  </footer>
  <div class="actionbar">
    <details class="callsheet">
      <summary class="btn btn--ghost">${icon('phone')}${t('Sună', 'Call')}</summary>
      <div class="callsheet__list">
        <p>${t('Alege numărul', 'Choose a number')}</p>
        ${C.phones.map((p) => `<a href="${tel(p)}">${icon('phone')}${p}</a>`).join('')}
      </div>
    </details>
    <a class="btn btn--primary" href="${url('contact.html', lang)}#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
  </div>`;
}

function cta(lang) {
  const t = tr(lang);
  return `
    <section class="section">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>${t('Ai nevoie de un partener pentru transporturile frigorifice internaționale?', 'Looking for a partner for international refrigerated transport?')}</h2>
            <p>${t('Indiferent dacă ai nevoie de un camion complet sau dorești să verifici posibilitatea unui transport în regim de grupaj, echipa Frigo Food Distribution poate analiza cerințele tale și identifica o soluție logistică potrivită.',
                   'Whether you need a full truck or want to check whether a groupage shipment is possible, the Frigo Food Distribution team can review your requirements and find the right logistics solution.')}</p>
            <ul class="cta-band__contact">
              <li><strong>${C.company}</strong></li>
              <li>${icon('mail')}<a href="mailto:${C.email}">${C.email}</a></li>
              <li>${icon('phone')}<span class="cta-band__phones">${phoneLinks()}</span></li>
              <li>${icon('map-pin')}${t('Pantelimon, județul Ilfov, România', 'Pantelimon, Ilfov County, Romania')}</li>
            </ul>
          </div>
          <div class="cta-band__actions">
            <a class="btn btn--light" href="${url('contact.html', lang)}#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
            <a class="btn btn--ghost" href="${url('contact.html', lang)}">${t('Contactează-ne', 'Contact us')}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function routeList(lang) {
  const t = tr(lang);
  const H = ROUTES.hub;
  const q = (from, to) => `${url('contact.html', lang)}?from=${from}&amp;to=${to}#oferta`;
  return `<div class="route-list">${ROUTES.countries.map((c) => `
    <article class="route-item">
      <h3><a href="${c.page[lang]}">${t(`Transport frigorific ${c.ro} ⇄ România`, `Refrigerated transport ${c.en} ⇄ Romania`)}</a></h3>
      <ul>
        <li>${icon('arrow-down-right')}${t('Import', 'Import')}: ${c[lang]} → ${H[lang]}</li>
        <li>${icon('arrow-up-right')}${t('Export', 'Export')}: ${H[lang]} → ${c[lang]}</li>
      </ul>
      <p class="route-item__modes">${c.onRequest
        ? `<span class="tag tag--req">${t('La cerere', 'On request')}</span>`
        : `<span class="tag tag--ftl">FTL</span><span class="tag tag--req">${t('Grupaj la cerere', 'Groupage on request')}</span>`}</p>
      <div class="route-item__actions">
        <a href="${q(c.code, H.code)}">${t('Ofertă import', 'Import quote')}</a>
        <a href="${q(H.code, c.code)}">${t('Ofertă export', 'Export quote')}</a>
      </div>
    </article>`).join('')}
  </div>`;
}

function headExtras(lang, page, title, desc, indexable) {
  const abs = (l) => BASE + url(page, l);
  const ff = {
    v: V,
    lang,
    page,
    pages: Object.fromEntries(Object.keys(PAGES).map((p) => [p, { ro: url(p, 'ro'), en: url(p, 'en') }])),
    routes: ROUTES,
    contact: { company: C.company, phones: C.phones.map((p) => ({ label: p, href: tel(p) })), email: C.email },
  };
  const seo = indexable ? `
  <link rel="canonical" href="${abs(lang)}">
  <link rel="alternate" hreflang="ro" href="${abs('ro')}">
  <link rel="alternate" hreflang="en" href="${abs('en')}">
  <link rel="alternate" hreflang="x-default" href="${abs('ro')}">` : '';
  return `
  <meta name="theme-color" content="#061e3c">
  <link rel="icon" href="/brand/logo/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/brand/logo/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">${seo}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Frigo Food Distribution">
  <meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'ro_RO'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${abs(lang)}">
  <meta property="og:image" content="${BASE}/brand/social/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://images.unsplash.com">
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">
  <script>window.FF=${JSON.stringify(ff)}</script>
  <script src="/js/icons.js?v=${V}" defer></script>
  <script src="/js/site.js?v=${V}" defer></script>`;
}

/* ---------- FAQ, structured data and route pages (for search engines and AI assistants) ---------- */

const ld = (data, lang) => `<script type="application/ld+json"${lang ? ` lang="${lang}"` : ''}>${JSON.stringify(data)}</script>`;
const ORG_ID = `${BASE}/#organization`;

function fill(text, lang, c) {
  const all = ROUTES.countries.map((x) => (lang === 'en' ? theEn(x) : x.ro));
  return text
    .replace(/\{countries\}/g, join(all, lang))
    .replace(/\{availability\}/g, c ? FAQ.availability[c.onRequest ? 'onRequest' : 'standard'][lang] : '')
    .replace(/\{cities\}/g, c ? join(cities(c, lang), lang, true) : '')
    .replace(/\{countryIn\}/g, c ? theEn(c) : '')
    .replace(/\{country\}/g, c ? c.ro : '');
}

// Visible questions and the matching FAQPage data come from the same text, as search engines require.
function faqSection(items, c) {
  const qa = (lang) => items.map((i) => ({ q: fill(i.q[lang], lang, c), a: fill(i.a[lang], lang, c) }));
  const list = (lang) => qa(lang).map(({ q, a }) => `<details class="faq__item"><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('');
  const data = (lang) => ({ '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: qa(lang).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  return `
    <section class="section" id="intrebari">
      <div class="wrap faq">
        <div class="faq__head">
          <h2>${bi('Întrebări frecvente', 'Frequently asked questions')}</h2>
          <p>${bi(`Nu găsești răspunsul? Scrie-ne la <a href="mailto:${C.email}">${C.email}</a> sau sună la ${C.phones[0]}.`,
                  `Can't find your answer? Email <a href="mailto:${C.email}">${C.email}</a> or call ${C.phones[0]}.`)}</p>
        </div>
        <div class="faq__list"><div lang="ro">${list('ro')}</div><div lang="en">${list('en')}</div></div>
      </div>
    </section>
    ${ld(data('ro'), 'ro')}${ld(data('en'), 'en')}`;
}

function orgData(lang) {
  const t = tr(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Frigo Food Distribution',
    legalName: C.company,
    alternateName: 'Frigo Food',
    url: `${BASE}${url('index.html', lang)}`,
    logo: `${BASE}/brand/logo/ffd-logo-horizontal.png`,
    image: `${BASE}/brand/social/og-image.png`,
    description: t('Casă de expediții din Pantelimon, Ilfov, care organizează transport rutier internațional cu temperatură controlată (FTL și grupaj) pentru produse alimentare refrigerate și congelate, între România și Europa, prin transportatori parteneri.',
                   'Freight forwarder in Pantelimon, Ilfov, Romania, organising international temperature-controlled road transport (FTL and groupage) for chilled and frozen food between Romania and Europe, through partner carriers.'),
    foundingDate: C.founded,
    vatID: C.cui,
    identifier: C.euid,
    email: C.email,
    telephone: C.phones.map((p) => p.replace(/\s/g, '')),
    address: { '@type': 'PostalAddress', streetAddress: 'Șoseaua Cernica nr. 278', addressLocality: C.city, addressRegion: 'Ilfov', addressCountry: 'RO' },
    contactPoint: C.phones.map((p) => ({ '@type': 'ContactPoint', contactType: 'sales', telephone: p.replace(/\s/g, ''), email: C.email, availableLanguage: ['ro', 'en'] })),
    areaServed: [ROUTES.hub, ...ROUTES.countries].map((x) => ({ '@type': 'Country', name: x.en })),
    knowsAbout: ['refrigerated transport', 'temperature-controlled road freight', 'FTL', 'refrigerated groupage', 'food logistics', 'transport frigorific', 'grupaj frigorific'],
    makesOffer: [['transport-ftl.html', t('Transport frigorific FTL', 'Refrigerated FTL transport')], ['grupaj-frigorific.html', t('Grupaj frigorific', 'Refrigerated groupage')]]
      .map(([p, name]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, url: `${BASE}${url(p, lang)}` } })),
  };
}

function routeSource(c) {
  const H = ROUTES.hub;
  const q = (from, to) => `contact.html?from=${from}&amp;to=${to}#oferta`;
  const cRo = join(cities(c, 'ro'), 'ro', true);
  const cEn = join(cities(c, 'en'), 'en', true);
  const modes = c.onRequest
    ? bi('Rută organizată la cerere, după verificarea posibilității și a condițiilor', 'Route organised on request, once feasibility and terms are checked')
    : bi('Camion complet (FTL), dedicat încărcăturii tale; grupaj la cerere', 'Full truck load (FTL) dedicated to your load; groupage on request');
  const checklist = `
          <ul class="checklist">
            <li>${icon('truck')}${modes}</li>
            <li>${icon('thermometer-snowflake')}${bi('Regim refrigerat sau congelat, la temperatura stabilită pentru marfă', 'Chilled or frozen, at the temperature agreed for the goods')}</li>
            <li>${icon('calendar-clock')}${bi('Planificare după sloturile de încărcare și descărcare', 'Planned around loading and unloading slots')}</li>
            <li>${icon('shield-check')}${bi('Transportatori parteneri verificați înainte de atribuirea comenzii', 'Partner carriers checked before the order is assigned')}</li>
          </ul>`;
  const graph = (lang) => {
    const t = tr(lang);
    const name = t(`Transport frigorific ${c.ro} ⇄ România`, `Refrigerated transport ${c.en} ⇄ Romania`);
    return { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Service', name, serviceType: t('Transport rutier frigorific internațional', 'International refrigerated road transport'),
        description: t(`Import și export de produse alimentare refrigerate și congelate între ${c.ro} și România.`, `Imports and exports of chilled and frozen food between ${theEn(c)} and Romania.`),
        provider: { '@id': ORG_ID, '@type': 'Organization', name: 'Frigo Food Distribution' },
        areaServed: [{ '@type': 'Country', name: c.en }, { '@type': 'Country', name: 'Romania' }],
        url: `${BASE}${c.page[lang]}` },
      { '@type': 'BreadcrumbList', itemListElement: [
        [t('Acasă', 'Home'), url('index.html', lang)], [t('Rute', 'Routes'), url('rute.html', lang)], [name, c.page[lang]],
      ].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${BASE}${u}` })) },
    ] };
  };
  const others = ROUTES.countries.filter((x) => x !== c)
    .map((x) => `<li><a href="${x.file}">${bi(`${x.ro} ⇄ România`, `${x.en} ⇄ Romania`)}${icon('arrow-right')}</a></li>`).join('');
  return `<!doctype html>
<html lang="ro" data-title-en="Refrigerated transport ${c.en} ⇄ Romania, import and export | Frigo Food Distribution" data-desc-en="Refrigerated road transport between ${theEn(c)} and Romania for chilled and frozen food: imports and exports, ${c.onRequest ? 'on request' : 'FTL, with groupage on request'}, through partner carriers. Request a quote.">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Transport frigorific ${c.ro} ⇄ România, import și export | Frigo Food Distribution</title>
  <meta name="description" content="Transport frigorific între ${c.ro} și România pentru produse alimentare refrigerate și congelate: import și export, ${c.onRequest ? 'la cerere' : 'FTL, cu grupaj la cerere'}, prin transportatori parteneri. Cere o ofertă.">
  <!--ff:head-->
  <link rel="stylesheet" href="/css/site.css">
  ${ld(graph('ro'), 'ro')}${ld(graph('en'), 'en')}
</head>
<body>
  <div id="site-header"></div>

  <main id="main">
    <section class="page-hero">
      <div class="wrap">
        <p class="crumbs"><a href="index.html">${bi('Acasă', 'Home')}</a> / <a href="rute.html">${bi('Rute', 'Routes')}</a> / ${bi(c.ro, c.en)}</p>
        <h1>${bi(`Transport frigorific ${c.ro} ⇄ România`, `Refrigerated transport ${c.en} ⇄ Romania`)}</h1>
        <p class="lead">${bi(`Organizăm transport rutier cu temperatură controlată între ${c.ro} și România, în ambele sensuri, pentru produse alimentare refrigerate și congelate. Lucrăm cu transportatori parteneri, iar disponibilitatea se confirmă pentru fiecare dată și tip de marfă.`,
                              `We organise temperature-controlled road transport between ${theEn(c)} and Romania, in both directions, for chilled and frozen food. We work with partner carriers, and availability is confirmed for each date and type of goods.`)}</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${q(c.code, H.code)}">${bi(`Ofertă import ${c.ro} → România`, `Import quote ${c.en} → Romania`)}</a>
          <a class="btn btn--ghost" href="${q(H.code, c.code)}">${bi(`Ofertă export România → ${c.ro}`, `Export quote Romania → ${c.en}`)}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap route-dirs">
        <article class="panel">
          <h2>${bi(`Import: ${c.ro} → România`, `Import: ${c.en} → Romania`)}</h2>
          <p>${bi(`Pentru importatori și distribuitori care aduc marfă din ${c.ro}: încărcare la furnizor, de exemplu în zona ${cRo}, și livrare la depozitul sau clientul tău din România.`,
                  `For importers and distributors bringing goods from ${theEn(c)}: loading at the supplier, for example around ${cEn}, and delivery to your warehouse or customer in Romania.`)}</p>
          ${checklist}
          <a class="btn btn--primary" href="${q(c.code, H.code)}">${bi('Solicită ofertă de import', 'Request an import quote')}</a>
        </article>
        <article class="panel">
          <h2>${bi(`Export: România → ${c.ro}`, `Export: Romania → ${c.en}`)}</h2>
          <p>${bi(`Pentru producători și exportatori din România care livrează în ${c.ro}: încărcare la adresa ta din România și livrare la clientul tău, de exemplu în zona ${cRo}.`,
                  `For Romanian producers and exporters delivering to ${theEn(c)}: loading at your address in Romania and delivery to your customer, for example around ${cEn}.`)}</p>
          ${checklist}
          <a class="btn btn--primary" href="${q(H.code, c.code)}">${bi('Solicită ofertă de export', 'Request an export quote')}</a>
        </article>
      </div>
    </section>

    <section class="section section--navy">
      <div class="wrap">
        <div class="section-head">
          <h2>${bi(`Ruta ${c.ro} ⇄ România pe hartă`, `The ${c.en} ⇄ Romania route on the map`)}</h2>
          <p>${bi('Alege sensul transportului sau altă țară pentru a compara rutele.', 'Pick the direction or another country to compare routes.')}</p>
        </div>
        <div data-route-board="${c.code}"></div>
      </div>
    </section>

    <section class="section section--ice">
      <div class="wrap">
        <div class="section-head">
          <h2>${bi(`Ce transportăm pe ruta ${c.ro} ⇄ România`, `What we move between ${theEn(c)} and Romania`)}</h2>
          <p>${bi('Temperatura și condițiile de transport se stabilesc pentru fiecare încărcătură, în funcție de specificațiile produsului.', 'The temperature and transport conditions are set for each load, according to the product specifications.')}</p>
        </div>
        <ul class="checklist checklist--cols">
          <li>${icon('check')}${bi('Carne și produse din carne, proaspete sau congelate', 'Meat and meat products, fresh or frozen')}</li>
          <li>${icon('check')}${bi('Pește și fructe de mare', 'Fish and seafood')}</li>
          <li>${icon('check')}${bi('Fructe și legume', 'Fruit and vegetables')}</li>
          <li>${icon('check')}${bi('Lactate și produse refrigerate', 'Dairy and chilled products')}</li>
          <li>${icon('check')}${bi('Cartofi și produse de panificație congelate', 'Frozen potato and bakery products')}</li>
          <li>${icon('check')}${bi('Alte produse alimentare cu temperatură controlată', 'Other temperature-controlled food')}</li>
        </ul>
      </div>
    </section>

    ${faqSection(FAQ.route, c)}

    <section class="section section--ice">
      <div class="wrap">
        <div class="section-head">
          <h2>${bi('Alte rute de transport frigorific', 'Other refrigerated transport routes')}</h2>
        </div>
        <ul class="route-links">${others}</ul>
      </div>
    </section>

    <!--ff:cta-->
  </main>

  <div id="site-footer"></div>
</body>
</html>
`;
}

/* ---------- Pages ---------- */

const attr = (html, name) => (html.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

function buildPage(page, lang) {
  // Phone placeholders go first: they may sit inside the title, description or JSON-LD.
  let html = (ROUTE_PAGES[page] ? routeSource(ROUTE_PAGES[page]) : readFileSync(page, 'utf8'))
    .replace('<!--ff:faq-->', () => faqSection(FAQ.general))
    .replace('<!--ff:org-->', () => ld(orgData('ro'), 'ro') + ld(orgData('en'), 'en'))
    .replace(/<!--ff:base-->/g, BASE)
    .replace(/<!--ff:phones-->/g, phoneLinks())
    .replace(/<!--ff:phones-text-->/g, C.phones.join(', '))
    .replace(/"<!--ff:phones-json-->"/g, JSON.stringify(C.phones.map((p) => p.replace(/\s/g, ''))));
  const titleEn = attr(html, 'data-title-en');
  const descEn = attr(html, 'data-desc-en');
  html = html.replace(/\s(data-title-en|data-desc-en)="[^"]*"/g, '');
  html = stripLang(html, lang === 'en' ? 'ro' : 'en');
  // data-alt-ro / data-alt-en pairs become one attribute (label maps to aria-label).
  html = html.replace(/\sdata-([a-z]+)-ro="([^"]*)"\s+data-\1-en="([^"]*)"/g,
    (_, name, ro, en) => ` ${name === 'label' ? 'aria-label' : name}="${lang === 'en' ? en : ro}"`);
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  if (lang === 'en') {
    if (!titleEn || !descEn) throw new Error(`${page}: missing data-title-en / data-desc-en`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleEn}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${descEn}">`);
  }
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
  const indexable = !/name="robots" content="noindex"/.test(html);
  html = html
    .replace('<!--ff:head-->', headExtras(lang, page, title, desc, indexable && page !== '404.html'))
    .replace('<div id="site-header"></div>', header(lang, page))
    .replace('<div id="site-footer"></div>', footer(lang))
    .replace(/<!--ff:cta-->/g, cta(lang))
    .replace('<div class="route-list" data-route-list></div>', routeList(lang))
    .replace('href="/css/site.css"', `href="/css/site.css?v=${V}"`)
    // Only bare source links (href="contact.html"); the header's language switch already holds final /... URLs.
    .replace(/href="([a-z0-9-]+\.html)([?#][^"]*)?"/g, (m, p, rest = '') => (PAGES[p] ? `href="${url(p, lang)}${rest}"` : m));
  return inlineIcons(html);
}

/* ---------- Map: Europe pre-projected once, served as a small script ---------- */

const MAP_W = 760;
const MAP_H = 600;
function buildMap() {
  const world = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
  const projection = geoConicConformal().rotate([-12, 0]).parallels([40, 58])
    .fitExtent([[28, 28], [MAP_W - 28, MAP_H - 28]], { type: 'MultiPoint', coordinates: [[-9.5, 36.5], [29, 36.5], [-8, 60.5], [27, 60.5]] });
  projection.clipExtent([[0, 0], [MAP_W, MAP_H]]);
  const path = geoPath(projection).digits(1);
  const all = [ROUTES.hub, ...ROUTES.countries];
  const byId = Object.fromEntries(all.map((c) => [c.id, c.code]));
  const land = feature(world, world.objects.countries).features.map((f) => {
    const d = path(f);
    if (!d) return '';
    const code = byId[f.id];
    const cls = code === ROUTES.hub.code ? 'country country--hub' : code ? 'country country--served' : 'country';
    return `<path class="${cls}"${code ? ` data-hub="${code}"` : ''} d="${d}"/>`;
  }).join('');
  const points = Object.fromEntries(all.map((c) => [c.code, projection([c.lon, c.lat]).map((v) => +v.toFixed(1))]));
  return `window.FF_MAP=${JSON.stringify({ w: MAP_W, h: MAP_H, land, points })};\n`;
}

/* ---------- Run ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/en`, { recursive: true });
cpSync('css', `${OUT}/css`, { recursive: true });
cpSync('js', `${OUT}/js`, { recursive: true });
cpSync('brand', `${OUT}/brand`, { recursive: true, filter: (src) => !src.includes('brand/source') });
cpSync('brand/logo/favicon.ico', `${OUT}/favicon.ico`);
writeFileSync(`${OUT}/site.webmanifest`, JSON.stringify({
  name: 'Frigo Food Distribution', short_name: 'Frigo Food', start_url: '/', display: 'browser',
  background_color: '#ffffff', theme_color: '#061e3c',
  icons: [{ src: '/brand/logo/favicon.svg', sizes: 'any', type: 'image/svg+xml' }, { src: '/brand/logo/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
}));

for (const page of Object.keys(PAGES)) {
  if (!ROUTE_PAGES[page] && !existsSync(page)) throw new Error(`Missing source page ${page}`);
  for (const lang of LANGS) {
    writeFileSync(lang === 'en' ? `${OUT}/en/${PAGES[page]}` : `${OUT}/${page}`, buildPage(page, lang));
  }
}

const jsIcons = [...readFileSync('js/site.js', 'utf8').matchAll(/icon\('([\w-]+)'\)/g)].map((m) => m[1]);
writeFileSync(`${OUT}/js/icons.js`, `window.FF_ICONS=${JSON.stringify(Object.fromEntries([...new Set(jsIcons)].map((n) => [n, iconSvg(n)])))};\n`);
writeFileSync(`${OUT}/js/europe-map.js`, buildMap());

const listed = Object.keys(PAGES).filter((p) => p !== '404.html');
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${listed.flatMap((p) => LANGS.map((l) => `  <url><loc>${BASE}${url(p, l)}</loc>${LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${BASE}${url(p, a)}"/>`).join('')}</url>`)).join('\n')}
</urlset>
`);
// AI search and assistant crawlers are named explicitly: a bot that matches its own group ignores the * group.
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Bingbot', 'DuckAssistBot', 'meta-externalagent', 'MistralAI-User', 'CCBot'];
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /brand/\n\n${AI_BOTS.map((b) => `User-agent: ${b}`).join('\n')}\nAllow: /\nDisallow: /brand/\n\nSitemap: ${BASE}/sitemap.xml\n`);

// llms.txt: a plain summary of the company and every page, for AI assistants (https://llmstxt.org).
const link = (p, lang, title) => `- [${title}](${BASE}${url(p, lang)})`;
const faqText = (lang) => FAQ.general.map((i) => `**${fill(i.q[lang], lang)}**\n${fill(i.a[lang], lang)}`).join('\n\n');
writeFileSync(`${OUT}/llms.txt`, `# Frigo Food Distribution

> ${orgData('en').description}

- Legal name: ${C.company}, VAT ID ${C.cui}, EUID ${C.euid}, registered in ${C.founded}
- Address: ${C.street}, ${C.city}, ${C.county.en}, Romania
- Phone: ${C.phones.join(', ')}
- Email: ${C.email}
- Services: refrigerated FTL transport (a dedicated trailer, up to 33 EUR pallets) and refrigerated groupage (on request), chilled or frozen, for the food industry
- Routes: Romania to and from ${join(ROUTES.countries.map((c) => theEn(c) + (c.onRequest ? ' (on request)' : '')), 'en')}; imports and exports
- Goods: meat, fish and seafood, fruit and vegetables, dairy, frozen potato and bakery products, other temperature-controlled food
- How it works: a freight forwarder, not a carrier. Transport runs with vetted partner carriers; availability is confirmed for each route, date and type of goods. Transit times and temperatures are agreed per shipment, not published.
- Quotes: ${BASE}${url('contact.html', 'en')}#oferta (form), or email and phone above. Languages: Romanian and English.

## Pages (English)
${link('index.html', 'en', 'Home')}
${link('transport-ftl.html', 'en', 'Refrigerated FTL transport')}
${link('grupaj-frigorific.html', 'en', 'Refrigerated groupage')}
${link('rute.html', 'en', 'All routes')}
${link('despre-noi.html', 'en', 'About us')}
${link('contact.html', 'en', 'Contact and quote request')}

## Routes (English)
${ROUTES.countries.map((c) => link(c.file, 'en', `Refrigerated transport ${c.en} ⇄ Romania`)).join('\n')}

## Pagini în limba română
${link('index.html', 'ro', 'Acasă')}
${link('transport-ftl.html', 'ro', 'Transport frigorific FTL')}
${link('grupaj-frigorific.html', 'ro', 'Grupaj frigorific')}
${link('rute.html', 'ro', 'Rute')}
${link('contact.html', 'ro', 'Contact și cerere de ofertă')}
${ROUTES.countries.map((c) => link(c.file, 'ro', `Transport frigorific ${c.ro} ⇄ România`)).join('\n')}

## FAQ
${faqText('en')}
`);
writeFileSync(`${OUT}/${SITE.indexNowKey}.txt`, SITE.indexNowKey);
console.log(`Built ${listed.length + 1} pages x ${LANGS.length} languages into ${OUT}/`);
