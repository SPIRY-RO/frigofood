// Builds public/: one Romanian and one English copy of every page from the bilingual sources.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { geoConicConformal, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const SITE = JSON.parse(readFileSync('data/site.json', 'utf8'));
const { base: BASE, pages: PAGES, contact: C, routes: ROUTES } = SITE;
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
  const links = NAV.map(([p, ro, en]) => `<li><a href="${url(p, lang)}"${p === page ? ' aria-current="page"' : ''}>${t(ro, en)}</a></li>`).join('');
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
      <h3>${t(`Transport frigorific ${c.ro} ⇄ România`, `Refrigerated transport ${c.en} ⇄ Romania`)}</h3>
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

/* ---------- Pages ---------- */

const attr = (html, name) => (html.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

function buildPage(page, lang) {
  // Phone placeholders go first: they may sit inside the title, description or JSON-LD.
  let html = readFileSync(page, 'utf8')
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
    .replace(/href="\/?([a-z0-9-]+\.html)([?#][^"]*)?"/g, (m, p, rest = '') => (PAGES[p] ? `href="${url(p, lang)}${rest}"` : m));
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
  if (!existsSync(page)) throw new Error(`Missing source page ${page}`);
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
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /brand/\n\nSitemap: ${BASE}/sitemap.xml\n`);
console.log(`Built ${listed.length + 1} pages x ${LANGS.length} languages into ${OUT}/`);
