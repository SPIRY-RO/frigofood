// Self-check for api/quote.js without sending real mail: `npm run check`.
import assert from 'node:assert/strict';

process.env.QUOTE_DRY_RUN = '1';
const { default: handler } = await import('../api/quote.js');

let ipCounter = 0;
async function call(body, headers = {}) {
  const res = { code: 0, payload: null, status(c) { this.code = c; return this; }, setHeader() { return this; }, json(p) { this.payload = p; return this; } };
  await handler({ method: 'POST', body, headers: { origin: 'https://frigofood.vercel.app', 'x-forwarded-for': `10.0.0.${++ipCounter}`, ...headers } }, res);
  return res;
}

const valid = {
  company: 'Test Lactate SRL', person: 'Ioana Marin', email: 'ioana@example.test', phone: '+40 700 000 000',
  mode: 'FTL', fromCountry: 'Olanda', fromCity: 'Rotterdam', toCountry: 'România', toCity: 'Pantelimon',
  loadDate: '2026-11-20', deliverBy: '2026-11-23', goods: 'Lactate și produse refrigerate', temp: '+2 / +4 °C',
  pallets: '22', weight: '12000', consent: true, startedAt: Date.now() - 60000, lang: 'ro',
};

const ok = await call(valid);
assert.equal(ok.code, 200, JSON.stringify(ok.payload));
assert.equal(ok.payload.preview.to[0].address, 'office@frigofood.ro');
assert.match(ok.payload.preview.subject, /Rotterdam, Olanda → Pantelimon, România/);
assert.match(ok.payload.preview.text, /Numărul paleților: 22/);
assert.equal(ok.payload.preview.replyTo[0].address, 'ioana@example.test');

const missing = await call({ ...valid, weight: '', temp: '' });
assert.equal(missing.code, 400);
assert.deepEqual(missing.payload.fields.sort(), ['temp', 'weight']);

assert.deepEqual((await call({ ...valid, email: 'nu-e-email' })).payload.fields, ['email']);
assert.deepEqual((await call({ ...valid, deliverBy: '2026-11-01' })).payload.fields, ['deliverBy']);
assert.deepEqual((await call({ ...valid, consent: false })).payload.fields, ['consent']);
assert.equal((await call({ ...valid, startedAt: Date.now() })).payload.error, 'too_fast');

const trap = await call({ ...valid, website: 'http://spam.example' });
assert.equal(trap.code, 200);
assert.equal(trap.payload.preview, undefined, 'honeypot must not send');

assert.equal((await call(valid, { origin: 'https://evil.example' })).code, 403);

const injected = await call({ ...valid, fromCity: 'Rotterdam\r\nBcc: x@evil.example' });
assert.ok(!/\n/.test(injected.payload.preview.subject), 'subject must stay on one line');

const sameIp = { 'x-forwarded-for': '10.9.9.9' };
const codes = [];
for (let i = 0; i < 6; i++) codes.push((await call(valid, sameIp)).code);
assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);

console.log('quote-check: all assertions passed');
