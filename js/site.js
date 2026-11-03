/* Frigo Food Distribution: header behaviour, trailer diagram, route map and quote form.
   Pages are built per language (build.mjs), which injects window.FF. */

const FF = window.FF;
const LANG = FF.lang;
const t = (ro, en) => (LANG === 'en' ? en : ro);
const icon = (name) => (window.FF_ICONS && window.FF_ICONS[name]) || '';
const pageUrl = (page) => FF.pages[page][LANG];
const C = FF.contact;
const HUB = FF.routes.hub;
const COUNTRIES = FF.routes.countries;
const ALL = [HUB, ...COUNTRIES];
const byCode = Object.fromEntries(ALL.map((c) => [c.code, c]));
const nameOf = (code) => (byCode[code] ? byCode[code][LANG] : '');

/* ---------- Header ---------- */

function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const nav = document.getElementById('nav');
  const toggle = header.querySelector('.menu-toggle');
  const setMenu = (open) => {
    nav.style.setProperty('--nav-top', `${header.getBoundingClientRect().bottom}px`);
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('Închide meniul', 'Close menu') : t('Deschide meniul', 'Open menu'));
    toggle.innerHTML = open ? icon('x') : icon('menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  // Links to a section of the same page would otherwise leave the menu covering it.
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Mobile "Call" button: a list of numbers that closes on outside tap or Escape.
  const sheet = document.querySelector('.callsheet');
  document.addEventListener('click', (e) => { if (sheet?.open && !sheet.contains(e.target)) sheet.open = false; });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    if (sheet?.open) { sheet.open = false; sheet.querySelector('summary').focus(); }
  });
  // Switching language keeps the page, the query (route prefill) and the anchor.
  header.querySelectorAll('[data-lang-link]').forEach((a) => {
    a.href = a.getAttribute('href') + location.search + location.hash;
  });
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.height = '1px';
  header.after(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);
}

/* ---------- Trailer diagram: top view of a 13.6 m semitrailer, 33 EUR pallet places ---------- */

const TRAILER_LOADS = { ftl: [33], groupage: [14, 8, 5] };

function renderTrailer(root) {
  const kind = root.dataset.trailer === 'groupage' ? 'groupage' : 'ftl';
  const cells = [];
  TRAILER_LOADS[kind].forEach((n, load) => { for (let i = 0; i < n; i++) cells.push(`<span class="trailer__pallet trailer__pallet--${load + 1}"></span>`); });
  while (cells.length < 33) cells.push('<span class="trailer__pallet trailer__pallet--free"></span>');
  root.classList.add('trailer', `trailer--${kind}`);
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', kind === 'ftl'
    ? t('Semiremorcă cu toate cele 33 de locuri de palet ocupate de o singură încărcătură', 'Trailer with all 33 pallet places taken by one load')
    : t('Semiremorcă cu trei încărcături compatibile și locuri libere', 'Trailer with three compatible loads and free places'));
  root.innerHTML = `<div class="trailer__box">${cells.join('')}</div><div class="trailer__cab"></div>`;
}

/* ---------- Route map: Romania and the selected country ---------- */

let mapPromise;
const loadMap = () => (mapPromise ??= new Promise((resolve, reject) => {
  if (window.FF_MAP) return resolve(window.FF_MAP);
  const s = document.createElement('script');
  s.src = '/js/europe-map.js';
  s.onload = () => resolve(window.FF_MAP);
  s.onerror = reject;
  document.head.append(s);
}));

function arcPath([x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const k = dx >= 0 ? 0.22 : -0.22;
  return `M${x1},${y1} Q${(mx + dy * k).toFixed(1)},${(my - dx * k).toFixed(1)} ${x2},${y2}`;
}

// Labels that would run past the map edge flip to the other side of their dot.
function keepLabelsInside(svg, w) {
  svg.querySelectorAll('.hub').forEach((g) => {
    const c = byCode[g.dataset.hub];
    const text = g.querySelector('text');
    const [x] = window.FF_MAP.points[g.dataset.hub];
    text.setAttribute('text-anchor', c.anchor || 'start');
    text.setAttribute('x', (x + (c.dx ?? 11)).toFixed(1));
    if (getComputedStyle(text).display === 'none') return;
    const box = text.getBBox();
    if (box.x + box.width > w - 6) { text.setAttribute('text-anchor', 'end'); text.setAttribute('x', (x - 11).toFixed(1)); }
    else if (box.x < 6) { text.setAttribute('text-anchor', 'start'); text.setAttribute('x', (x + 11).toFixed(1)); }
  });
}

function routeModes(c) {
  return c.onRequest
    ? `<span class="tag tag--grp">${t('La cerere', 'On request')}</span>`
    : `<span class="tag tag--ftl">FTL</span><span class="tag tag--grp">${t('Grupaj la cerere', 'Groupage on request')}</span>`;
}

const quoteHref = (from, to) => `${pageUrl('contact.html')}?from=${from}&to=${to}#oferta`;

function renderRouteBoard(root) {
  const chips = COUNTRIES.map((c) =>
    `<button type="button" data-hub="${c.code}" aria-pressed="false">${c[LANG]}${c.onRequest ? ` <small>${t('la cerere', 'on request')}</small>` : ''}</button>`).join('');
  root.innerHTML = `
    <div class="routes">
      <div class="routes__map">
        <svg viewBox="0 0 760 600" aria-hidden="true"></svg>
        <p class="routes__status">${t('Se încarcă harta...', 'Loading the map...')}</p>
        <p class="routes__legend">${icon('info')}${t('Harta arată legăturile posibile, nu curse regulate. Disponibilitatea se confirmă pentru fiecare rută, dată și tip de marfă.',
          'The map shows possible connections, not scheduled departures. Availability is confirmed for each route, date and type of goods.')}</p>
      </div>
      <div class="routes__panel">
        <h3>${t('Alege țara partener', 'Choose the partner country')}</h3>
        <div class="routes__pick">${chips}</div>
        <div class="route-card" aria-live="polite"></div>
      </div>
    </div>`;

  const svg = root.querySelector('svg');
  const card = root.querySelector('.route-card');
  const status = root.querySelector('.routes__status');
  let current = root.dataset.routeBoard || COUNTRIES[0].code;
  let direction = 'import';
  let mapReady = false;

  const drawArc = () => {
    if (!mapReady) return;
    const P = window.FF_MAP.points;
    const [from, to] = direction === 'import' ? [current, HUB.code] : [HUB.code, current];
    svg.querySelector('.arcs').innerHTML = `<path class="arc" pathLength="1" marker-end="url(#ff-arrow)" d="${arcPath(P[from], P[to])}"/>`;
  };

  const renderCard = () => {
    const c = byCode[current];
    const [from, to] = direction === 'import' ? [c.code, HUB.code] : [HUB.code, c.code];
    card.innerHTML = `
      <h4 class="route-card__title">${c[LANG]} ⇄ ${HUB[LANG]}</h4>
      <ul class="lanes">
        <li><span class="lanes__name">${t('Import', 'Import')}: ${c[LANG]} → ${HUB[LANG]}</span><span class="lanes__modes">${routeModes(c)}</span></li>
        <li><span class="lanes__name">${t('Export', 'Export')}: ${HUB[LANG]} → ${c[LANG]}</span><span class="lanes__modes">${routeModes(c)}</span></li>
      </ul>
      <div class="route-card__dir" role="group" aria-label="${t('Sensul transportului', 'Direction')}">
        <button type="button" data-dir="import" aria-pressed="${direction === 'import'}">${t('Spre România', 'To Romania')}</button>
        <button type="button" data-dir="export" aria-pressed="${direction === 'export'}">${t('Din România', 'From Romania')}</button>
      </div>
      <a class="btn btn--light" href="${quoteHref(from, to)}">${t('Solicită ofertă pentru această rută', 'Request a quote for this route')}</a>`;
  };

  const select = (code) => {
    current = code;
    root.querySelectorAll('.routes__pick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hub === code)));
    renderCard();
    if (!mapReady) return;
    svg.querySelectorAll('[data-hub]').forEach((el) => el.classList.toggle('is-active', el.dataset.hub === code));
    const hubs = svg.querySelector('.hubs');
    hubs.append(...[...hubs.children].filter((g) => g.classList.contains('is-active') || g.dataset.hub === HUB.code));
    drawArc();
    keepLabelsInside(svg, window.FF_MAP.w);
  };

  root.addEventListener('click', (e) => {
    const dir = e.target.closest('[data-dir]');
    if (dir) { direction = dir.dataset.dir; renderCard(); drawArc(); return; }
    const hit = e.target.closest('[data-hub]');
    if (hit && hit.dataset.hub !== HUB.code) select(hit.dataset.hub);
  });

  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    loadMap().then((M) => {
      const hubs = ALL.map((c) => {
        const [x, y] = M.points[c.code];
        return `<g class="hub${c.code === HUB.code ? ' hub--home' : ''}" data-hub="${c.code}"><circle cx="${x}" cy="${y}" r="${c.code === HUB.code ? 6 : 4.5}"/><text x="${x + (c.dx ?? 11)}" y="${y + (c.dy ?? 4)}">${c[LANG]}</text></g>`;
      }).join('');
      svg.innerHTML = `<defs><marker id="ff-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="#fff"/></marker></defs>
        <g class="land">${M.land}</g><g class="arcs"></g><g class="hubs">${hubs}</g>`;
      mapReady = true;
      status.remove();
      select(current);
    }).catch(() => { status.textContent = t('Harta nu s-a putut încărca. Alege țara din listă.', 'The map could not load. Pick the country from the list.'); });
  }, { rootMargin: '400px' }).observe(root);

  select(current);
}

/* ---------- Quote form ---------- */

const GOODS = [
  ['Carne și produse din carne, proaspete sau congelate', 'Meat and meat products, fresh or frozen'],
  ['Pește și fructe de mare', 'Fish and seafood'],
  ['Fructe și legume', 'Fruit and vegetables'],
  ['Lactate și produse refrigerate', 'Dairy and chilled products'],
  ['Cartofi și produse de panificație congelate', 'Frozen potato and bakery products'],
  ['Alte produse alimentare cu temperatură controlată', 'Other temperature-controlled food'],
];

const field = (name, label, { type = 'text', required = false, full = false, ph = '', attrs = '' } = {}) => `
  <div class="field${full ? ' field--full' : ''}">
    <label for="q-${name}">${label}${required ? '' : ` <span class="hint">${t('(opțional)', '(optional)')}</span>`}</label>
    <input id="q-${name}" name="${name}" type="${type}"${required ? ' required' : ''}${ph ? ` placeholder="${ph}"` : ''} ${attrs}>
  </div>`;

function renderQuoteForm(root) {
  const params = new URLSearchParams(location.search);
  const tip = params.get('tip') || root.dataset.quoteForm || 'ftl';
  const goods = GOODS.map(([ro, en]) => `<option value="${ro}">${t(ro, en)}</option>`).join('');
  const countryList = ALL.map((c) => `<option value="${c[LANG]}"></option>`).join('');
  root.innerHTML = `
    <form class="quote" novalidate>
      <div class="quote__body">
        <h2>${t('Solicită o ofertă de transport frigorific', 'Request a refrigerated transport quote')}</h2>
        <p class="quote__intro">${t('Completează detaliile transportului, iar echipa Frigo Food Distribution va analiza solicitarea și va reveni cu o propunere, în funcție de disponibilitatea și condițiile cursei.',
          'Fill in the shipment details and the Frigo Food Distribution team will review your request and come back with a proposal, based on availability and the conditions of the trip.')}</p>
        <datalist id="ff-countries">${countryList}</datalist>
        <div class="quote__cols">
          <div>
            <fieldset>
              <legend>${t('Tipul transportului', 'Transport type')}</legend>
              <div class="modes">
                <label class="mode"><input type="radio" name="mode" value="FTL"${tip !== 'grupaj' && tip !== 'groupage' ? ' checked' : ''}>
                  <span class="mode__box">${t('Camion complet (FTL)', 'Full truck load (FTL)')}<small>${t('Camion dedicat încărcăturii tale', 'A truck dedicated to your load')}</small></span></label>
                <label class="mode"><input type="radio" name="mode" value="Grupaj"${tip === 'grupaj' || tip === 'groupage' ? ' checked' : ''}>
                  <span class="mode__box">${t('Grupaj frigorific', 'Refrigerated groupage')}<small>${t('Cantități mai mici, marfă compatibilă', 'Smaller loads, compatible goods')}</small></span></label>
              </div>
            </fieldset>
            <fieldset>
              <legend>${t('Încărcare', 'Loading')}</legend>
              <div class="fields fields--3">
                ${field('fromCountry', t('Țara', 'Country'), { required: true, attrs: 'list="ff-countries" autocomplete="off"' })}
                ${field('fromCity', t('Localitatea', 'Town or city'), { required: true })}
                ${field('fromPostcode', t('Cod poștal', 'Postcode'))}
              </div>
            </fieldset>
            <fieldset>
              <legend>${t('Descărcare', 'Delivery')}</legend>
              <div class="fields fields--3">
                ${field('toCountry', t('Țara', 'Country'), { required: true, attrs: 'list="ff-countries" autocomplete="off"' })}
                ${field('toCity', t('Localitatea', 'Town or city'), { required: true })}
                ${field('toPostcode', t('Cod poștal', 'Postcode'))}
              </div>
            </fieldset>
            <fieldset>
              <legend>${t('Marfa și programul', 'Goods and schedule')}</legend>
              <div class="fields">
                ${field('loadDate', t('Data estimată a încărcării', 'Estimated loading date'), { type: 'date', required: true })}
                ${field('deliverBy', t('Data dorită a livrării', 'Preferred delivery date'), { type: 'date' })}
                <div class="field field--full">
                  <label for="q-goods">${t('Tipul mărfii', 'Type of goods')}</label>
                  <select id="q-goods" name="goods" required>
                    <option value="">${t('Alege', 'Choose')}</option>${goods}
                  </select>
                </div>
                ${field('temp', t('Temperatura de transport solicitată', 'Required transport temperature'), { required: true, ph: t('ex. +2 / +4 °C sau -18 °C', 'e.g. +2 / +4 °C or -18 °C') })}
                ${field('pallets', t('Numărul paleților', 'Number of pallets'), { type: 'number', required: true, attrs: 'min="1" inputmode="numeric"' })}
                ${field('weight', t('Greutatea totală (kg)', 'Total weight (kg)'), { type: 'number', required: true, attrs: 'min="1" inputmode="decimal"' })}
                ${field('palletSize', t('Dimensiunile paleților', 'Pallet dimensions'), { ph: t('ex. 120×80 cm, h 1,6 m', 'e.g. 120×80 cm, h 1.6 m') })}
              </div>
            </fieldset>
          </div>
          <div>
            <fieldset>
              <legend>${t('Date de contact', 'Contact details')}</legend>
              <div class="fields">
                ${field('company', t('Compania', 'Company'), { required: true, full: true, attrs: 'autocomplete="organization"' })}
                ${field('person', t('Persoana de contact', 'Contact person'), { required: true, full: true, attrs: 'autocomplete="name"' })}
                ${field('email', t('E-mail', 'Email'), { type: 'email', required: true, full: true, attrs: 'autocomplete="email"' })}
                ${field('phone', t('Telefon', 'Phone'), { type: 'tel', required: true, full: true, attrs: 'autocomplete="tel"' })}
              </div>
            </fieldset>
            <fieldset>
              <legend>${t('Detalii suplimentare', 'Additional details')}</legend>
              <div class="fields">
                <div class="field field--full">
                  <label for="q-special">${t('Cerințe speciale', 'Special requirements')} <span class="hint">${t('(opțional)', '(optional)')}</span></label>
                  <textarea id="q-special" name="special" rows="3" placeholder="${t('ex. programare la rampă, ADR, marfă fragilă', 'e.g. dock booking, fragile goods, loading equipment')}"></textarea>
                </div>
                <div class="field field--full">
                  <label for="q-notes">${t('Observații', 'Notes')} <span class="hint">${t('(opțional)', '(optional)')}</span></label>
                  <textarea id="q-notes" name="notes" rows="3"></textarea>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="field--trap" aria-hidden="true">
          <label for="q-website">Website</label>
          <input id="q-website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        <label class="consent"><input type="checkbox" name="consent" required>
          <span>${t(`Am citit <a href="${pageUrl('confidentialitate.html')}">informarea privind prelucrarea datelor personale</a> și sunt de acord ca Frigo Food Distribution să folosească aceste date pentru a răspunde solicitării.`,
            `I have read the <a href="${pageUrl('confidentialitate.html')}">personal data notice</a> and agree that Frigo Food Distribution may use these details to answer my request.`)}</span></label>
        <div class="quote__submit">
          <button class="btn btn--primary" type="submit">${icon('send')}<span>${t('Trimite solicitarea', 'Send request')}</span></button>
          <p>${t('Câmpurile fără mențiunea „opțional” sunt obligatorii.', 'Fields not marked optional are required.')}</p>
        </div>
        <div class="quote__alert" role="alert" hidden></div>
      </div>
      <div class="quote__done" role="status" tabindex="-1" hidden>
        ${icon('circle-check')}
        <h3>${t('Mulțumim!', 'Thank you!')}</h3>
        <p>${t('Solicitarea ta a fost transmisă către Frigo Food Distribution. Vom analiza detaliile și vom reveni la datele de contact indicate.',
          'Your request has been sent to Frigo Food Distribution. We will review the details and get back to you using the contact details you provided.')}</p>
        <button class="btn btn--ghost" type="button" data-again>${t('Trimite o altă solicitare', 'Send another request')}</button>
      </div>
    </form>`;

  const form = root.querySelector('form');
  const els = form.elements;
  const startedAt = Date.now();
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  els.loadDate.min = today;
  els.deliverBy.min = today;
  if (byCode[params.get('from')]) els.fromCountry.value = nameOf(params.get('from'));
  if (byCode[params.get('to')]) els.toCountry.value = nameOf(params.get('to'));
  if (location.hash === '#oferta') requestAnimationFrame(() => document.getElementById('oferta')?.scrollIntoView());

  const errorText = (el) => {
    const v = el.validity;
    if (v.valueMissing) {
      if (el.type === 'checkbox') return t('Bifează acordul ca să putem răspunde solicitării.', 'Tick the box so we can answer your request.');
      if (el.tagName === 'SELECT') return t('Alege tipul mărfii.', 'Choose the type of goods.');
      return t('Completează acest câmp.', 'Fill in this field.');
    }
    if (v.typeMismatch) return t('Scrie o adresă de e-mail validă, de forma nume@firma.ro.', 'Enter a valid email address, like name@company.com.');
    if (v.customError) return el.validationMessage === 'before-load'
      ? t('Data livrării trebuie să fie după data încărcării.', 'The delivery date must be on or after the loading date.')
      : t('Verifică acest câmp.', 'Check this field.');
    if (v.rangeUnderflow) return el.type === 'date' ? t('Alege data de azi sau una ulterioară.', 'Pick today or a later date.') : t('Scrie cel puțin 1.', 'Enter at least 1.');
    return t('Verifică acest câmp.', 'Check this field.');
  };
  const clearError = (el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    document.getElementById(`err-${el.name}`)?.remove();
  };
  const showError = (el) => {
    clearError(el);
    const p = document.createElement('p');
    p.className = 'field__error';
    p.id = `err-${el.name}`;
    p.textContent = errorText(el);
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', p.id);
    const box = el.closest('.field');
    if (box) box.append(p); else el.closest('.consent').after(p);
  };
  form.addEventListener('input', (e) => { if (e.target.validity?.valid && !e.target.validationMessage) clearError(e.target); });
  form.addEventListener('change', (e) => { if (e.target.validity?.valid) clearError(e.target); });

  const alertBox = form.querySelector('.quote__alert');
  const showAlert = (html) => { alertBox.innerHTML = html; alertBox.hidden = false; };
  const mailtoFor = (d) => {
    const body = Object.entries(d).filter(([k]) => !['website', 'consent', 'startedAt', 'lang'].includes(k)).map(([k, v]) => `${k}: ${v}`).join('\n');
    return `mailto:${C.email}?subject=${encodeURIComponent(`Cerere ofertă ${d.mode}: ${d.fromCity} → ${d.toCity}`)}&body=${encodeURIComponent(body)}`;
  };

  form.querySelector('[data-again]').addEventListener('click', () => renderQuoteForm(root));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.hidden = true;
    els.deliverBy.setCustomValidity(els.deliverBy.value && els.loadDate.value && els.deliverBy.value < els.loadDate.value ? 'before-load' : '');
    form.querySelectorAll('[aria-invalid]').forEach(clearError);
    const invalid = [...els].filter((el) => el.willValidate && !el.checkValidity());
    if (invalid.length) { invalid.forEach(showError); invalid[0].focus(); return; }

    const d = Object.fromEntries(new FormData(form));
    d.consent = els.consent.checked;
    d.startedAt = startedAt;
    d.lang = LANG;
    const button = form.querySelector('[type="submit"]');
    const label = button.querySelector('span');
    button.disabled = true;
    label.textContent = t('Se trimite...', 'Sending...');
    try {
      const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        form.querySelector('.quote__body').hidden = true;
        const done = form.querySelector('.quote__done');
        done.hidden = false;
        done.scrollIntoView({ block: 'center' });
        done.focus({ preventScroll: true });
        return;
      }
      if (out.error === 'invalid' && Array.isArray(out.fields)) {
        const bad = out.fields.map((n) => els[n]).filter(Boolean);
        bad.forEach((el) => { el.setCustomValidity('server'); showError(el); el.setCustomValidity(''); });
        bad[0]?.focus();
      } else if (out.error === 'too_fast') {
        showAlert(t('Formularul a fost trimis prea repede. Verifică datele și apasă din nou pe „Trimite solicitarea”.', 'The form was sent too quickly. Check the details and press "Send request" again.'));
      } else if (out.error === 'rate_limited') {
        const phones = C.phones.map((p) => `<a href="${p.href}">${p.label}</a>`).join(', ');
        showAlert(t(`Am primit deja mai multe solicitări de la tine. Încearcă din nou peste câteva minute sau sună la ${phones}.`,
          `We have already received several requests from you. Try again in a few minutes or call ${phones}.`));
      } else {
        throw new Error(out.error || res.status);
      }
    } catch {
      showAlert(`${t('Solicitarea nu a putut fi trimisă automat. Trimite-o prin e-mail sau sună-ne.', 'The request could not be sent automatically. Send it by email or call us.')}
        <span class="btn-row"><a class="btn btn--primary" href="${mailtoFor(d)}">${icon('mail')}${t('Trimite prin e-mail', 'Send by email')}</a>
        ${C.phones.map((p) => `<a class="btn btn--ghost" href="${p.href}">${icon('phone')}${p.label}</a>`).join('')}</span>`);
    } finally {
      button.disabled = false;
      label.textContent = t('Trimite solicitarea', 'Send request');
    }
  });
}

/* ---------- Boot ---------- */

initHeader();
document.querySelectorAll('[data-trailer]').forEach(renderTrailer);
document.querySelectorAll('[data-route-board]').forEach(renderRouteBoard);
document.querySelectorAll('[data-quote-form]').forEach(renderQuoteForm);
