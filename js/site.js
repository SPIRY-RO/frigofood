/* Frigo Food Distribution: shared header, footer, language, route board and quote form. */

const CONTACT = {
  phone: '+40 757 732 732',
  phoneHref: 'tel:+40757732732',
  email: 'office@frigofood.ro',
  address: 'Șos. Cernica nr. 278, Pantelimon, jud. Ilfov, România',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Șoseaua Cernica 278, Pantelimon, Ilfov'),
};

const t = (ro, en) => `<span lang="ro">${ro}</span><span lang="en">${en}</span>`;
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;

const NAV = [
  ['index.html', 'Acasă', 'Home'],
  ['transport-ftl.html', 'Transport FTL', 'FTL transport'],
  ['grupaj-frigorific.html', 'Grupaj frigorific', 'Refrigerated groupage'],
  ['rute.html', 'Rute', 'Routes'],
  ['despre-noi.html', 'Despre noi', 'About us'],
  ['contact.html', 'Contact', 'Contact'],
];

const currentPage = () => location.pathname.split('/').pop() || 'index.html';

/* ---------- Language ---------- */

function setLang(lang) {
  document.documentElement.lang = lang;
  try { localStorage.setItem('ff-lang', lang); } catch (e) {}
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const title = document.documentElement.dataset[lang === 'en' ? 'titleEn' : 'titleRo'];
  if (title) document.title = title;
  document.querySelectorAll('[data-ro][data-en]').forEach((el) => { el.textContent = el.dataset[lang]; });
  document.querySelectorAll('[data-ph-ro]').forEach((el) => { el.placeholder = lang === 'en' ? el.dataset.phEn : el.dataset.phRo; });
  document.querySelectorAll('[data-aria-ro]').forEach((el) => { el.setAttribute('aria-label', lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaRo); });
}

/* ---------- Header / footer ---------- */

function renderHeader() {
  const page = currentPage();
  const links = NAV.map(([href, ro, en]) =>
    `<li><a href="${href}"${href === page ? ' aria-current="page"' : ''}>${t(ro, en)}</a></li>`).join('');

  document.getElementById('site-header').outerHTML = `
    <a class="skip" href="#main">${t('Sari la conținut', 'Skip to content')}</a>
    <div class="topstrip">
      <div class="wrap">
        <span class="topstrip__note">${t('Transport frigorific internațional · FTL și grupaj', 'International refrigerated transport · FTL and groupage')}</span>
        <span class="topstrip__contacts">
          <a href="${CONTACT.phoneHref}">${icon('phone')}${CONTACT.phone}</a>
          <a href="mailto:${CONTACT.email}">${icon('mail')}${CONTACT.email}</a>
        </span>
      </div>
    </div>
    <header class="header" id="header">
      <div class="wrap">
        <a class="brand" href="index.html" aria-label="Frigo Food Distribution">
          <img src="brand/logo/ffd-logo-horizontal.svg" alt="Frigo Food Distribution" width="220" height="44">
        </a>
        <nav class="nav" id="nav" data-aria-ro="Meniu principal" data-aria-en="Main menu"><ul>${links}</ul></nav>
        <div class="header__actions">
          <div class="lang" role="group" aria-label="Limba / Language">
            <button type="button" data-lang="ro" aria-pressed="true">RO</button>
            <button type="button" data-lang="en" aria-pressed="false">EN</button>
          </div>
          <a class="btn btn--primary" href="contact.html#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav" data-aria-ro="Deschide meniul" data-aria-en="Open menu">${icon('menu')}</button>
        </div>
      </div>
    </header>`;

  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const toggle = header.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => {
    nav.style.setProperty('--nav-top', `${header.getBoundingClientRect().bottom}px`);
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  header.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.height = '1px';
  header.after(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);
}

function renderFooter() {
  const links = NAV.map(([href, ro, en]) => `<li><a href="${href}">${t(ro, en)}</a></li>`).join('');
  document.getElementById('site-footer').outerHTML = `
    <footer class="footer">
      <div class="wrap">
        <div class="footer__grid">
          <div class="footer__brand">
            <img src="brand/logo/ffd-logo-horizontal-white.svg" alt="Frigo Food Distribution" width="260" height="52">
            <p>${t('Organizăm transporturi internaționale de produse alimentare refrigerate și congelate, în regim de camion complet și grupaj.',
                   'We organise international transport of chilled and frozen food, as full truck loads and groupage.')}</p>
          </div>
          <div>
            <h4>${t('Pagini', 'Pages')}</h4>
            <ul>${links}</ul>
          </div>
          <div>
            <h4>${t('Servicii', 'Services')}</h4>
            <ul>
              <li><a href="transport-ftl.html">${t('Camion complet (FTL)', 'Full truck load (FTL)')}</a></li>
              <li><a href="grupaj-frigorific.html">${t('Grupaj frigorific', 'Refrigerated groupage')}</a></li>
              <li><a href="rute.html">${t('Rute operate', 'Lanes we operate')}</a></li>
              <li><a href="contact.html#oferta">${t('Solicită o ofertă', 'Request a quote')}</a></li>
            </ul>
          </div>
          <div>
            <h4>${t('Contact', 'Contact')}</h4>
            <ul>
              <li><a href="${CONTACT.phoneHref}">${CONTACT.phone}</a></li>
              <li><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
              <li><a href="${CONTACT.mapUrl}" target="_blank" rel="noopener">${CONTACT.address}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer__legal">
          <span>© ${new Date().getFullYear()} Frigo Food Distribution SRL</span>
          <span class="footer__ids">
            <span>CUI 41776220</span>
            <span>EUID ROONRC.J2019004582230</span>
            <span>${t('Licență ARR', 'ARR licence')} 0247913</span>
            <a href="confidentialitate.html">${t('Confidențialitate', 'Privacy')}</a>
          </span>
        </div>
      </div>
    </footer>
    <div class="actionbar">
      <a class="btn btn--ghost" href="${CONTACT.phoneHref}">${icon('phone')}${t('Sună', 'Call')}</a>
      <a class="btn btn--primary" href="contact.html#oferta">${t('Solicită o ofertă', 'Request a quote')}</a>
    </div>`;
}

/* ---------- Route board: real map of Europe, lanes of the selected country ---------- */

// lon/lat anchors sit on each country's main freight area. dx/dy/anchor place the label.
const HUBS = {
  UK: { id: '826', ro: 'Marea Britanie', en: 'United Kingdom', lon: -1.5, lat: 52.6, dx: -11, dy: 4, anchor: 'end' },
  ES: { id: '724', ro: 'Spania', en: 'Spain', lon: -3.7, lat: 40.3 },
  NL: { id: '528', ro: 'Olanda', en: 'Netherlands', lon: 5.5, lat: 52.3, dx: -9, dy: -8, anchor: 'end' },
  BE: { id: '056', ro: 'Belgia', en: 'Belgium', lon: 4.6, lat: 50.7, dx: -11, dy: 12, anchor: 'end' },
  DE: { id: '276', ro: 'Germania', en: 'Germany', lon: 10.3, lat: 51.0, dx: 0, dy: 22, anchor: 'middle' },
  DK: { id: '208', ro: 'Danemarca', en: 'Denmark', lon: 9.2, lat: 56.1, dx: -11, dy: 4, anchor: 'end' },
  SE: { id: '752', ro: 'Suedia', en: 'Sweden', lon: 15.0, lat: 59.4 },
  AT: { id: '040', ro: 'Austria', en: 'Austria', lon: 14.4, lat: 47.6, dx: -11, dy: 12, anchor: 'end' },
  CZ: { id: '203', ro: 'Cehia', en: 'Czechia', lon: 15.4, lat: 49.8, dx: 0, dy: -12, anchor: 'middle' },
  SK: { id: '703', ro: 'Slovacia', en: 'Slovakia', lon: 19.4, lat: 48.8, dy: -6 },
  HU: { id: '348', ro: 'Ungaria', en: 'Hungary', lon: 19.3, lat: 47.1, dy: 10 },
  PL: { id: '616', ro: 'Polonia', en: 'Poland', lon: 19.3, lat: 52.1 },
  RO: { id: '642', ro: 'România', en: 'Romania', lon: 24.9, lat: 45.9 },
  BG: { id: '100', ro: 'Bulgaria', en: 'Bulgaria', lon: 25.3, lat: 42.7 },
};
const WEST = ['UK', 'ES', 'NL', 'BE', 'DE', 'DK', 'SE'];
const EAST = ['AT', 'CZ', 'SK', 'HU', 'PL', 'RO', 'BG'];
// Keep this list to the lanes actually operated. groupage: 'request' = availability confirmed per request.
const LANES = WEST.flatMap((a) => EAST.map((b) => ({ a, b, ftl: true, groupage: 'request' })));

const MAP_W = 760;
const MAP_H = 600;
let mapLibs;
const loadMapLibs = () => (mapLibs ??= Promise.all([
  import('https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm'),
  import('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm'),
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
]));

async function drawMap(svg) {
  const [geo, topo, world] = await loadMapLibs();
  const projection = geo.geoConicConformal().rotate([-12, 0]).parallels([40, 58])
    .fitExtent([[28, 28], [MAP_W - 28, MAP_H - 28]], { type: 'MultiPoint', coordinates: [[-9.5, 36.5], [29, 36.5], [-8, 60.5], [27, 60.5]] });
  projection.clipExtent([[0, 0], [MAP_W, MAP_H]]);
  const path = geo.geoPath(projection);
  const hubById = Object.fromEntries(Object.entries(HUBS).map(([k, h]) => [h.id, k]));
  const land = topo.feature(world, world.objects.countries).features
    .filter((f) => { const [lon, lat] = geo.geoCentroid(f); return f.id === '643' || (lon > -25 && lon < 50 && lat > 30 && lat < 75); })
    .map((f) => {
      const d = path(f);
      if (!d) return '';
      const hub = hubById[f.id];
      return `<path class="country${hub ? ' country--served' : ''}"${hub ? ` data-hub="${hub}"` : ''} d="${d}"/>`;
    }).join('');
  const hubs = Object.entries(HUBS).map(([k, h]) => {
    const [x, y] = projection([h.lon, h.lat]);
    h.x = x; h.y = y;
    const tx = x + (h.dx ?? 11), ty = y + (h.dy ?? 4), anchor = h.anchor || 'start';
    return `<g class="hub" data-hub="${k}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>
      <text lang="ro" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${h.ro}</text>
      <text lang="en" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${h.en}</text></g>`;
  }).join('');
  svg.innerHTML = `<title>Hartă rute / Route map</title><g class="land">${land}</g><g class="arcs"></g><g class="hubs">${hubs}</g>`;
}

// Labels that would run past the map edge flip to the other side of their dot.
function keepLabelsInside(svg) {
  svg.querySelectorAll('.hub text').forEach((text) => {
    const h = HUBS[text.parentNode.dataset.hub];
    text.setAttribute('text-anchor', h.anchor || 'start');
    text.setAttribute('x', (h.x + (h.dx ?? 11)).toFixed(1));
    if (getComputedStyle(text).display === 'none') return;
    const box = text.getBBox();
    if (box.x + box.width > MAP_W - 6) { text.setAttribute('text-anchor', 'end'); text.setAttribute('x', (h.x - 11).toFixed(1)); }
    else if (box.x < 6) { text.setAttribute('text-anchor', 'start'); text.setAttribute('x', (h.x + 11).toFixed(1)); }
  });
}

function arcPath(p, q) {
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
  const dx = q.x - p.x, dy = q.y - p.y, bend = 0.2;
  const sign = dx >= 0 ? -1 : 1;
  return `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${(mx + sign * dy * bend).toFixed(1)},${(my - sign * dx * bend).toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
}

function renderRouteBoard(root) {
  const chips = (keys) => keys.map((k) =>
    `<button type="button" data-hub="${k}" aria-pressed="false" data-ro="${HUBS[k].ro}" data-en="${HUBS[k].en}">${HUBS[k].ro}</button>`).join('');

  root.innerHTML = `
    <div class="routes">
      <div class="routes__map">
        <svg viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true"></svg>
        <p class="routes__status">${t('Se încarcă harta...', 'Loading the map...')}</p>
        <div class="routes__legend">
          <span><i></i>${t('Rute FTL ale țării alese', 'FTL lanes of the selected country')}</span>
          <span><i class="is-dashed"></i>${t('Grupaj: confirmat la cerere', 'Groupage: confirmed on request')}</span>
        </div>
      </div>
      <div class="routes__panel">
        <h3>${t('Alege țara de încărcare sau de livrare', 'Pick a loading or delivery country')}</h3>
        <div class="routes__group"><p>${t('Vest și Nord', 'West and North')}</p><div class="routes__pick">${chips(WEST)}</div></div>
        <div class="routes__group"><p>${t('Centru și Est', 'Central and East')}</p><div class="routes__pick">${chips(EAST)}</div></div>
        <p class="lanes__title" aria-live="polite"></p>
        <ul class="lanes"></ul>
        <div class="routes__cta"><a class="btn btn--light" href="contact.html#oferta">${t('Solicită o ofertă', 'Request a quote')}</a></div>
      </div>
    </div>`;

  const svg = root.querySelector('svg');
  const status = root.querySelector('.routes__status');
  const list = root.querySelector('.lanes');
  const title = root.querySelector('.lanes__title');
  let current = root.dataset.routeBoard || 'RO';
  let mapReady = false;

  const select = (hub) => {
    current = hub;
    const mine = LANES.filter((l) => l.a === hub || l.b === hub);
    const others = mine.map((l) => (l.a === hub ? l.b : l.a));
    const linked = new Set(others);
    root.querySelectorAll('.routes__pick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hub === hub)));
    title.innerHTML = t(`${mine.length} legături din și spre ${HUBS[hub].ro}`, `${mine.length} lanes to and from ${HUBS[hub].en}`);
    list.innerHTML = others.map((other, i) => {
      const l = mine[i];
      return `<li><span class="lanes__name">${t(`${HUBS[hub].ro} ⇄ ${HUBS[other].ro}`, `${HUBS[hub].en} ⇄ ${HUBS[other].en}`)}</span>
        <span class="lanes__modes">${l.ftl ? '<span class="tag tag--ftl">FTL</span>' : ''}${l.groupage ? `<span class="tag tag--grp">${t('Grupaj la cerere', 'Groupage on request')}</span>` : ''}</span></li>`;
    }).join('');
    if (!mapReady) return;
    svg.querySelectorAll('[data-hub]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.hub === hub);
      el.classList.toggle('is-linked', linked.has(el.dataset.hub));
    });
    svg.querySelector('.arcs').innerHTML = others.map((o, i) =>
      `<path class="arc" pathLength="1" style="animation-delay:${i * 70}ms" d="${arcPath(HUBS[hub], HUBS[o])}"/>`).join('');
    const hubs = svg.querySelector('.hubs');
    hubs.append(...[...hubs.children].filter((g) => g.classList.contains('is-linked') || g.classList.contains('is-active')));
    keepLabelsInside(svg);
  };

  root.addEventListener('click', (e) => {
    const hit = e.target.closest('[data-hub]');
    if (hit) select(hit.dataset.hub);
  });

  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    drawMap(svg).then(() => { mapReady = true; status.remove(); select(current); })
      .catch(() => { status.innerHTML = t('Harta nu s-a putut încărca. Rutele sunt listate alături.', 'The map could not load. The lanes are listed alongside.'); });
  }, { rootMargin: '400px' }).observe(root);

  select(current);
}

/* ---------- Trailer diagram: top view of a 13.6 m semitrailer, 33 EUR pallet places ---------- */

const TRAILER_LOADS = {
  ftl: [33],
  groupage: [14, 8, 5],
};

function renderTrailer(root) {
  const kind = root.dataset.trailer === 'groupage' ? 'groupage' : 'ftl';
  const cells = [];
  TRAILER_LOADS[kind].forEach((n, load) => { for (let i = 0; i < n; i++) cells.push(`<span class="trailer__pallet trailer__pallet--${load + 1}"></span>`); });
  while (cells.length < 33) cells.push('<span class="trailer__pallet trailer__pallet--free"></span>');
  root.classList.add('trailer', `trailer--${kind}`);
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', kind === 'ftl'
    ? 'Semiremorcă cu toate cele 33 de locuri de palet ocupate de o singură încărcătură / Trailer with all 33 pallet places taken by one load'
    : 'Semiremorcă cu trei încărcături compatibile și locuri libere / Trailer with three compatible loads and free places');
  root.innerHTML = `<div class="trailer__box">${cells.join('')}</div><div class="trailer__cab"></div>`;
}

/* ---------- Quote form ---------- */

const GOODS = [
  ['Carne și produse din carne', 'Meat and meat products'],
  ['Pește și fructe de mare', 'Fish and seafood'],
  ['Fructe și legume', 'Fruit and vegetables'],
  ['Lactate', 'Dairy'],
  ['Alte produse alimentare refrigerate', 'Other chilled food'],
  ['Alte produse alimentare congelate', 'Other frozen food'],
];

const field = (name, ro, en, { type = 'text', required = false, full = false, phRo = '', phEn = '', hintRo = '', hintEn = '', attrs = '' } = {}) => `
  <div class="field${full ? ' field--full' : ''}">
    <label for="q-${name}">${t(ro, en)}${hintRo ? ` <span class="hint">${t(hintRo, hintEn)}</span>` : ''}</label>
    <input id="q-${name}" name="${name}" type="${type}"${required ? ' required' : ''}${phRo ? ` placeholder="${phRo}" data-ph-ro="${phRo}" data-ph-en="${phEn}"` : ''} ${attrs}>
  </div>`;

function renderQuoteForm(root) {
  const mode = root.dataset.quoteForm || 'ftl';
  const goods = GOODS.map(([ro, en]) => `<option value="${ro}" data-ro="${ro}" data-en="${en}">${ro}</option>`).join('');
  root.innerHTML = `
    <form class="quote" novalidate>
      <h2>${t('Solicită o ofertă', 'Request a quote')}</h2>
      <p class="quote__intro">${t('Completează detaliile cursei și îți trimitem oferta. Cu cât știm mai multe despre marfă, cu atât oferta este mai exactă.',
        'Tell us about the shipment and we will send you a quote. The more we know about the goods, the more accurate the quote.')}</p>
      <div class="quote__cols">
        <div>
          <fieldset>
            <legend>${t('Tip transport', 'Transport type')}</legend>
            <div class="modes">
              <label class="mode"><input type="radio" name="mode" value="FTL"${mode !== 'groupage' ? ' checked' : ''}>
                <span class="mode__box">${t('Camion complet (FTL)', 'Full truck load (FTL)')}<small>${t('Camion dedicat încărcăturii tale', 'A truck dedicated to your load')}</small></span></label>
              <label class="mode"><input type="radio" name="mode" value="Grupaj"${mode === 'groupage' ? ' checked' : ''}>
                <span class="mode__box">${t('Grupaj frigorific', 'Refrigerated groupage')}<small>${t('Cantități mai mici, marfă compatibilă', 'Smaller loads, compatible goods')}</small></span></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>${t('Despre cursă', 'About the shipment')}</legend>
            <div class="fields">
              ${field('from', 'Încărcare: localitate și țară', 'Loading: town and country', { required: true, phRo: 'ex. Rotterdam, Olanda', phEn: 'e.g. Rotterdam, Netherlands' })}
              ${field('to', 'Descărcare: localitate și țară', 'Delivery: town and country', { required: true, phRo: 'ex. București, România', phEn: 'e.g. Bucharest, Romania' })}
              ${field('loadDate', 'Data încărcării', 'Loading date', { type: 'date', required: true })}
              ${field('deliverBy', 'Termen de livrare', 'Deliver by', { type: 'date' })}
              <div class="field">
                <label for="q-goods">${t('Tipul mărfii', 'Type of goods')}</label>
                <select id="q-goods" name="goods" required>
                  <option value="" data-ro="Alege" data-en="Choose">Alege</option>${goods}
                </select>
              </div>
              ${field('temp', 'Temperatura solicitată', 'Required temperature', { required: true, phRo: 'ex. +2 / +4 °C', phEn: 'e.g. +2 / +4 °C' })}
              ${field('pallets', 'Număr de paleți', 'Number of pallets', { type: 'number', required: true, attrs: 'min="1" inputmode="numeric"' })}
              ${field('palletSize', 'Dimensiuni paleți', 'Pallet size', { phRo: 'ex. 120×80 cm, h 1,6 m', phEn: 'e.g. 120×80 cm, h 1.6 m' })}
              ${field('weight', 'Greutate totală (kg)', 'Total weight (kg)', { type: 'number', attrs: 'min="1" inputmode="numeric"' })}
            </div>
          </fieldset>
        </div>
        <div>
          <fieldset>
            <legend>${t('Date de contact', 'Contact details')}</legend>
            <div class="fields">
              ${field('company', 'Firma', 'Company', { required: true, full: true, attrs: 'autocomplete="organization"' })}
              ${field('person', 'Persoana de contact', 'Contact person', { required: true, full: true, attrs: 'autocomplete="name"' })}
              ${field('email', 'Email', 'Email', { type: 'email', required: true, full: true, attrs: 'autocomplete="email"' })}
              ${field('phone', 'Telefon', 'Phone', { type: 'tel', required: true, full: true, attrs: 'autocomplete="tel"' })}
              <div class="field field--full">
                <label for="q-notes">${t('Observații', 'Notes')}</label>
                <textarea id="q-notes" name="notes" data-ph-ro="Ambalare, documente însoțitoare, cerințe de încărcare..." data-ph-en="Packaging, accompanying documents, loading requirements..." placeholder="Ambalare, documente însoțitoare, cerințe de încărcare..."></textarea>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
      <label class="consent"><input type="checkbox" name="consent" required>
        <span>${t('Sunt de acord ca Frigo Food Distribution să folosească aceste date pentru a-mi trimite oferta. <a href="confidentialitate.html">Cum folosim datele</a>.',
          'I agree that Frigo Food Distribution may use these details to send me a quote. <a href="confidentialitate.html">How we use data</a>.')}</span></label>
      <div class="quote__submit">
        <button class="btn btn--primary" type="submit">${icon('send')}${t('Trimite cererea', 'Send request')}</button>
        <p>${t('Se deschide emailul tău cu cererea completată, gata de trimis. Ai un document? Atașează-l în acel email.',
          'Your email app opens with the request filled in, ready to send. Have a document? Attach it to that email.')}</p>
      </div>
      <div class="quote__done" role="status">
        <h3>${t('Cererea este pregătită în emailul tău', 'Your request is ready in your email app')}</h3>
        <p>${t(`Trimite emailul ca să primești oferta. Folosești email în browser? Copiază cererea și trimite-o la ${CONTACT.email}, sau sună la <a href="${CONTACT.phoneHref}">${CONTACT.phone}</a>.`,
          `Send the email to receive your quote. Using webmail? Copy the request and send it to ${CONTACT.email}, or call <a href="${CONTACT.phoneHref}">${CONTACT.phone}</a>.`)}</p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" data-copy>${icon('copy')}<span data-copy-label>${t('Copiază cererea', 'Copy the request')}</span></button>
          <a class="btn btn--ghost" data-reopen href="mailto:${CONTACT.email}">${icon('mail')}${t('Deschide emailul din nou', 'Open the email again')}</a>
        </div>
      </div>
    </form>`;

  const form = root.querySelector('form');
  const loadDate = form.elements.loadDate;
  const deliverBy = form.elements.deliverBy;
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  loadDate.min = today;
  deliverBy.min = today;
  let request = '';

  const errorText = (el) => {
    const v = el.validity;
    if (v.valueMissing) {
      if (el.type === 'checkbox') return t('Bifează acordul ca să îți putem trimite oferta.', 'Tick the box so we can send you the quote.');
      if (el.tagName === 'SELECT') return t('Alege tipul mărfii.', 'Choose the type of goods.');
      return t('Completează acest câmp.', 'Fill in this field.');
    }
    if (v.typeMismatch) return t('Scrie o adresă de email validă, de forma nume@firma.ro.', 'Enter a valid email address, like name@company.com.');
    if (v.customError) return t('Termenul de livrare trebuie să fie după data încărcării.', 'The delivery deadline must be on or after the loading date.');
    if (v.rangeUnderflow) return el.type === 'date' ? t('Alege data de azi sau una ulterioară.', 'Pick today or a later date.') : t('Scrie cel puțin 1.', 'Enter at least 1.');
    return t('Verifică acest câmp.', 'Check this field.');
  };
  const clearError = (el) => {
    el.removeAttribute('aria-invalid');
    document.getElementById(`err-${el.name}`)?.remove();
  };
  const showError = (el) => {
    clearError(el);
    const p = document.createElement('p');
    p.className = 'field__error';
    p.id = `err-${el.name}`;
    p.innerHTML = errorText(el);
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', p.id);
    const box = el.closest('.field');
    if (box) box.append(p); else el.closest('.consent').after(p);
  };
  form.addEventListener('input', (e) => { if (e.target.validity?.valid) clearError(e.target); });
  form.addEventListener('change', (e) => { if (e.target.validity?.valid) clearError(e.target); });

  form.querySelector('[data-copy]').addEventListener('click', async (e) => {
    const label = e.currentTarget.querySelector('[data-copy-label]');
    try {
      await navigator.clipboard.writeText(request);
      label.innerHTML = t('Copiat', 'Copied');
    } catch {
      label.innerHTML = t('Copierea nu a mers. Selectează textul din email.', 'Copy failed. Select the text in the email.');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    deliverBy.setCustomValidity(deliverBy.value && loadDate.value && deliverBy.value < loadDate.value ? 'before-load' : '');
    const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
    form.querySelectorAll('[aria-invalid]').forEach(clearError);
    if (invalid.length) {
      invalid.forEach(showError);
      invalid[0].focus();
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    // ponytail: mailto hand-off, no backend. Upgrade to an /api/quote function with an email provider to accept attachments and log requests.
    const lines = [
      `Tip transport: ${d.mode}`,
      `Încărcare: ${d.from}`,
      `Descărcare: ${d.to}`,
      `Data încărcării: ${d.loadDate}`,
      `Termen de livrare: ${d.deliverBy || '-'}`,
      `Marfă: ${d.goods}`,
      `Temperatura: ${d.temp}`,
      `Paleți: ${d.pallets} (${d.palletSize || 'dimensiuni nespecificate'})`,
      `Greutate: ${d.weight ? d.weight + ' kg' : '-'}`,
      '',
      `Firma: ${d.company}`,
      `Persoana de contact: ${d.person}`,
      `Email: ${d.email}`,
      `Telefon: ${d.phone}`,
      '',
      `Observații: ${d.notes || '-'}`,
      '',
      `Limba clientului: ${document.documentElement.lang.toUpperCase()}`,
    ];
    const subject = `Cerere ofertă ${d.mode}: ${d.from} → ${d.to} (${d.loadDate})`;
    const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    request = `${subject}\n\n${lines.join('\n')}`;
    form.querySelector('[data-reopen]').href = mailto;
    form.querySelector('[data-copy-label]').innerHTML = t('Copiază cererea', 'Copy the request');
    const done = form.querySelector('.quote__done');
    done.classList.add('is-visible');
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
    done.scrollIntoView({ block: 'nearest' });
    location.href = mailto;
  });
}

/* ---------- Boot ---------- */

renderHeader();
renderFooter();
document.querySelectorAll('[data-trailer]').forEach(renderTrailer);
document.querySelectorAll('[data-route-board]').forEach(renderRouteBoard);
document.querySelectorAll('[data-quote-form]').forEach(renderQuoteForm);
setLang(document.documentElement.lang === 'en' ? 'en' : 'ro');
if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
