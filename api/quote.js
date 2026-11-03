// Receives the quote form and emails it to the office.
// Configure in Vercel: SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS, optional QUOTE_TO / QUOTE_FROM.
import nodemailer from 'nodemailer';

const FIELDS = {
  company: { label: 'Compania', required: true, max: 200 },
  person: { label: 'Persoana de contact', required: true, max: 200 },
  email: { label: 'E-mail', required: true, max: 200, kind: 'email' },
  phone: { label: 'Telefon', required: true, max: 40, kind: 'phone' },
  mode: { label: 'Tipul transportului', required: true, oneOf: ['FTL', 'Grupaj'] },
  fromCountry: { label: 'Țara de încărcare', required: true, max: 80 },
  fromCity: { label: 'Localitatea de încărcare', required: true, max: 120 },
  fromPostcode: { label: 'Cod poștal încărcare', max: 20 },
  toCountry: { label: 'Țara de descărcare', required: true, max: 80 },
  toCity: { label: 'Localitatea de descărcare', required: true, max: 120 },
  toPostcode: { label: 'Cod poștal descărcare', max: 20 },
  loadDate: { label: 'Data estimată a încărcării', required: true, kind: 'date' },
  deliverBy: { label: 'Data dorită a livrării', kind: 'date' },
  goods: { label: 'Tipul mărfii', required: true, max: 120 },
  temp: { label: 'Temperatura de transport solicitată', required: true, max: 60 },
  pallets: { label: 'Numărul paleților', required: true, kind: 'int', min: 1, maxValue: 1000 },
  palletSize: { label: 'Dimensiunile paleților', max: 120 },
  weight: { label: 'Greutatea totală (kg)', required: true, kind: 'number', min: 1, maxValue: 100000 },
  special: { label: 'Cerințe speciale', max: 1500 },
  notes: { label: 'Observații', max: 3000 },
};

const ALLOWED_HOSTS = [/^(www\.)?frigofood\.ro$/, /^frigofood[a-z0-9-]*\.vercel\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];
const MIN_FILL_MS = 4000;

// ponytail: per-instance memory, resets on cold start. Move to a shared store (e.g. Upstash) if spam gets through.
const hits = new Map();
function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
const oneLine = (v) => v.replace(/[\r\n]+/g, ' ');
const esc = (v) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function validate(body) {
  const data = {};
  const invalid = [];
  for (const [name, f] of Object.entries(FIELDS)) {
    let v = clean(body[name]);
    if (name !== 'special' && name !== 'notes') v = oneLine(v);
    data[name] = v;
    if (!v) { if (f.required) invalid.push(name); continue; }
    if (f.max && v.length > f.max) invalid.push(name);
    else if (f.oneOf && !f.oneOf.includes(v)) invalid.push(name);
    else if (f.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) invalid.push(name);
    else if (f.kind === 'phone' && !/^[+()\d\s./-]{6,40}$/.test(v)) invalid.push(name);
    else if (f.kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) invalid.push(name);
    else if (f.kind === 'int' && !(/^\d+$/.test(v) && +v >= f.min && +v <= f.maxValue)) invalid.push(name);
    else if (f.kind === 'number' && !(/^\d+([.,]\d+)?$/.test(v) && +v.replace(',', '.') >= f.min && +v.replace(',', '.') <= f.maxValue)) invalid.push(name);
  }
  if (data.loadDate && data.deliverBy && data.deliverBy < data.loadDate) invalid.push('deliverBy');
  if (body.consent !== true && body.consent !== 'on') invalid.push('consent');
  return { data, invalid: [...new Set(invalid)] };
}

export function composeEmail(d, lang) {
  const subject = oneLine(`Cerere ofertă ${d.mode}: ${d.fromCity}, ${d.fromCountry} → ${d.toCity}, ${d.toCountry} (${d.loadDate})`).slice(0, 250);
  const rows = Object.entries(FIELDS).map(([name, f]) => [f.label, d[name] || '-']);
  rows.push(['Limba formularului', lang === 'en' ? 'EN' : 'RO']);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6" style="border-collapse:collapse;font:14px Arial,sans-serif">${rows
    .map(([k, v]) => `<tr><td style="color:#4b5a6e;border-bottom:1px solid #e3e8ef">${esc(k)}</td><td style="border-bottom:1px solid #e3e8ef"><b>${esc(v).replace(/\n/g, '<br>')}</b></td></tr>`)
    .join('')}</table>`;
  return { subject, text, html };
}

function transport() {
  if (process.env.QUOTE_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const { SMTP_HOST, SMTP_PORT = '465', SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({ host: SMTP_HOST, port: +SMTP_PORT, secure: +SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'method' });

  const origin = req.headers.origin || req.headers.referer || '';
  let host = '';
  try { host = origin ? new URL(origin).host : ''; } catch { host = ''; }
  if (host && !ALLOWED_HOSTS.some((re) => re.test(host))) return res.status(403).json({ error: 'origin' });

  const body = req.body && typeof req.body === 'object' ? req.body : (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })();

  // Spam traps: a hidden field people never fill, and a minimum time on the form.
  if (clean(body.website)) return res.status(200).json({ ok: true });
  const started = Number(body.startedAt);
  if (!started || Date.now() - started < MIN_FILL_MS) return res.status(400).json({ error: 'too_fast' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const { data, invalid } = validate(body);
  if (invalid.length) return res.status(400).json({ error: 'invalid', fields: invalid });

  const mailer = transport();
  if (!mailer) return res.status(503).json({ error: 'not_configured' });

  const { subject, text, html } = composeEmail(data, body.lang);
  const from = process.env.QUOTE_FROM || process.env.SMTP_USER || 'office@frigofood.ro';
  try {
    const info = await mailer.sendMail({
      from: `"Formular frigofood.ro" <${from}>`,
      to: process.env.QUOTE_TO || 'office@frigofood.ro',
      replyTo: `"${oneLine(data.person).replace(/"/g, '')}" <${data.email}>`,
      subject,
      text,
      html,
    });
    return res.status(200).json(process.env.QUOTE_DRY_RUN === '1' ? { ok: true, preview: JSON.parse(info.message) } : { ok: true });
  } catch (err) {
    console.error('quote mail failed', err?.code || err?.message);
    return res.status(502).json({ error: 'send_failed' });
  }
}
