/* Frigo Food Distribution: shared header, footer, language, route board and quote form. */

const CONTACT = {
  phone: '+40 757 732 732',
  phoneHref: 'tel:+40757732732',
  email: 'office@frigofood.ro',
  address: 'Șos. Cernica nr. 96, Pantelimon, jud. Ilfov, România',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Șoseaua Cernica 96, Pantelimon, Ilfov'),
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

/* ---------- Route board ---------- */

const HUBS = {
  UK: { ro: 'Marea Britanie', en: 'United Kingdom', lat: 51.5, lon: -0.6 },
  NL: { ro: 'Olanda', en: 'Netherlands', lat: 52.2, lon: 5.3 },
  BE: { ro: 'Belgia', en: 'Belgium', lat: 50.6, lon: 4.5 },
  DE: { ro: 'Germania', en: 'Germany', lat: 51.0, lon: 10.4 },
  PL: { ro: 'Polonia', en: 'Poland', lat: 52.1, lon: 19.4 },
  HU: { ro: 'Ungaria', en: 'Hungary', lat: 47.2, lon: 19.4 },
  RO: { ro: 'România', en: 'Romania', lat: 45.9, lon: 25.0 },
  BG: { ro: 'Bulgaria', en: 'Bulgaria', lat: 42.7, lon: 25.4 },
};
const WEST = ['UK', 'NL', 'BE', 'DE'];
const EAST = ['PL', 'HU', 'RO', 'BG'];
// Keep this list to the lanes actually operated. groupage: 'request' = availability confirmed per request.
const LANES = WEST.flatMap((a) => EAST.map((b) => ({ a, b, ftl: true, groupage: 'request' })));

const project = ({ lat, lon }) => ({ x: Math.round((lon + 3) * 23.6 + 20), y: Math.round((55 - lat) * 36) });

function renderRouteBoard(root) {
  const pts = Object.fromEntries(Object.entries(HUBS).map(([k, h]) => [k, project(h)]));
  const lines = LANES.map(({ a, b }) => {
    const p = pts[a], q = pts[b];
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - Math.hypot(q.x - p.x, q.y - p.y) * 0.18;
    return `<path class="lane-line" data-a="${a}" data-b="${b}" d="M${p.x},${p.y} Q${mx},${my} ${q.x},${q.y}"/>`;
  }).join('');
  const labelLeft = new Set(['UK', 'BE']);
  const nodes = Object.entries(pts).map(([k, p]) => {
    const left = labelLeft.has(k);
    return `<g class="map-node" data-hub="${k}" tabindex="0" role="button">
        <circle class="halo" cx="${p.x}" cy="${p.y}" r="14" fill="transparent"/>
        <circle class="dot" cx="${p.x}" cy="${p.y}" r="6.5"/>
        <text x="${p.x + (left ? -14 : 14)}" y="${p.y + 5}" text-anchor="${left ? 'end' : 'start'}">${k}</text>
      </g>`;
  }).join('');
  const buttons = [...WEST, ...EAST].map((k) =>
    `<button type="button" data-hub="${k}" aria-pressed="false" data-ro="${HUBS[k].ro}" data-en="${HUBS[k].en}">${HUBS[k].ro}</button>`).join('');

  root.innerHTML = `
    <div class="routes">
      <div class="routes__map">
        <svg viewBox="20 64 720 420" role="img" aria-labelledby="map-title">
          <title id="map-title">Rute între Europa de Vest și Europa Centrală și de Est / Lanes between Western and Central-Eastern Europe</title>
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="#1e3d66"/></pattern>
          </defs>
          <rect x="20" y="64" width="720" height="420" fill="url(#grid)"/>
          ${lines}${nodes}
        </svg>
        <div class="routes__legend">
          <span><i></i>${t('Rute FTL', 'FTL lanes')}</span>
          <span><i class="is-dashed"></i>${t('Grupaj: disponibilitate confirmată la cerere', 'Groupage: availability confirmed on request')}</span>
        </div>
      </div>
      <div class="routes__panel">
        <h3>${t('Alege țara de încărcare sau de livrare', 'Pick a loading or delivery country')}</h3>
        <p>${t('Legăm Europa de Vest de Europa Centrală și de Est, în ambele sensuri.', 'We connect Western Europe with Central and Eastern Europe, in both directions.')}</p>
        <div class="routes__pick">${buttons}</div>
        <ul class="lanes" aria-live="polite"></ul>
        <div class="routes__cta"><a class="btn btn--light" href="contact.html#oferta">${t('Solicită o ofertă', 'Request a quote')}</a></div>
      </div>
    </div>`;

  const list = root.querySelector('.lanes');
  const select = (hub) => {
    const mine = LANES.filter((l) => l.a === hub || l.b === hub);
    const linked = new Set(mine.flatMap((l) => [l.a, l.b]));
    root.querySelectorAll('.lane-line').forEach((el) => el.classList.toggle('is-on', el.dataset.a === hub || el.dataset.b === hub));
    root.querySelectorAll('.map-node').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.hub === hub);
      el.classList.toggle('is-linked', el.dataset.hub !== hub && linked.has(el.dataset.hub));
    });
    root.querySelectorAll('.routes__pick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hub === hub)));
    list.innerHTML = mine.map((l) => {
      const other = l.a === hub ? l.b : l.a;
      return `<li><span class="lanes__name">${t(`${HUBS[hub].ro} ⇄ ${HUBS[other].ro}`, `${HUBS[hub].en} ⇄ ${HUBS[other].en}`)}</span>
        <span class="lanes__modes">${l.ftl ? '<span class="tag tag--ftl">FTL</span>' : ''}${l.groupage ? `<span class="tag tag--grp">${t('Grupaj la cerere', 'Groupage on request')}</span>` : ''}</span></li>`;
    }).join('');
  };
  root.addEventListener('click', (e) => {
    const hit = e.target.closest('[data-hub]');
    if (hit) select(hit.dataset.hub);
  });
  root.addEventListener('keydown', (e) => {
    const hit = e.target.closest('.map-node');
    if (hit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(hit.dataset.hub); }
  });
  select(root.dataset.routeBoard || 'RO');
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
              ${field('pallets', 'Număr de paleți', 'Number of pallets', { type: 'number', required: true, attrs: 'min="1" max="66" inputmode="numeric"' })}
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
        <p>${t(`Trimite emailul ca să primești oferta. Nu s-a deschis aplicația de email? Scrie-ne la <a href="mailto:${CONTACT.email}">${CONTACT.email}</a> sau sună la <a href="${CONTACT.phoneHref}">${CONTACT.phone}</a>.`,
          `Send the email to receive your quote. Email app did not open? Write to <a href="mailto:${CONTACT.email}">${CONTACT.email}</a> or call <a href="${CONTACT.phoneHref}">${CONTACT.phone}</a>.`)}</p>
      </div>
    </form>`;

  const form = root.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
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
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.querySelector('.quote__done').classList.add('is-visible');
  });
}

/* ---------- Boot ---------- */

renderHeader();
renderFooter();
document.querySelectorAll('[data-route-board]').forEach(renderRouteBoard);
document.querySelectorAll('[data-quote-form]').forEach(renderQuoteForm);
setLang(document.documentElement.lang === 'en' ? 'en' : 'ro');
if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
