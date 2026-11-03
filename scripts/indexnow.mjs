// Tells Bing (which ChatGPT search uses), Yandex, Seznam and Naver that the pages in the sitemap changed: `npm run indexnow`.
// Run after a production deploy. The key file is published by build.mjs at /<indexNowKey>.txt.
import { readFileSync } from 'node:fs';

const { base, indexNowKey: key } = JSON.parse(readFileSync('data/site.json', 'utf8'));
const urlList = [...readFileSync('public/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList }),
});
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
if (res.status >= 400) process.exit(1);
