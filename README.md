# Frigo Food Distribution

Website for Frigo Food Distribution SRL, a freight forwarder for international temperature-controlled road transport (FTL and groupage) for the food industry. Static pages in Romanian and English, plus one serverless function for the quote form. Deployed on Vercel (team `spiry-research`, project `frigofood`).

## How it is built

Each page is written once at the repo root with both languages side by side (`<span lang="ro">` / `<span lang="en">`). `build.mjs` turns every source into two single-language pages in `public/`:

| Source | Romanian URL | English URL |
|---|---|---|
| `index.html` | `/` | `/en/` |
| `transport-ftl.html` | `/transport-ftl.html` | `/en/ftl-transport.html` |
| `grupaj-frigorific.html` | `/grupaj-frigorific.html` | `/en/refrigerated-groupage.html` |
| `rute.html` | `/rute.html` | `/en/routes.html` |
| `despre-noi.html` | `/despre-noi.html` | `/en/about-us.html` |
| `contact.html` | `/contact.html` | `/en/contact.html` |
| `confidentialitate.html` | `/confidentialitate.html` | `/en/privacy.html` |
| `404.html` | `/404.html` | `/en/404.html` |

The build also renders the header, footer and final call-to-action, inlines the Lucide icons that are used, pre-projects the Europe route map (`public/js/europe-map.js`), and writes `sitemap.xml` (with `hreflang` alternates) and `robots.txt`. English titles and descriptions come from `data-title-en` / `data-desc-en` on each source's `<html>` tag.

```bash
npm install
npm run build
python3 -m http.server 8800 -d public
```

## Common edits

- **Routes:** `data/site.json` → `routes.countries`. Each country needs its ISO numeric `id` (for the map) and map coordinates. `onRequest: true` shows "La cerere".
- **Company and contact data:** `data/site.json` → `contact` (used by header, footer, CTA and form).
- **Domain:** `data/site.json` → `base`. Switch to `https://www.frigofood.ro` once the domain points to Vercel (canonical tags, hreflang and sitemap follow).
- **Photos:** Unsplash stand-ins; replace with real company photos when available.

## Quote form and email

`api/quote.js` validates the request, applies spam protection (hidden trap field, minimum fill time, origin check, per-IP rate limit) and emails it to office@frigofood.ro with the client as reply-to. Set these environment variables in Vercel (Project → Settings → Environment Variables):

| Variable | Example |
|---|---|
| `SMTP_HOST` | mail server of the frigofood.ro mailbox |
| `SMTP_PORT` | `465` (SSL) or `587` (STARTTLS) |
| `SMTP_USER` | `office@frigofood.ro` |
| `SMTP_PASS` | mailbox password |
| `QUOTE_TO` | optional, defaults to `office@frigofood.ro` |

Without them the function answers 503 and the form offers a pre-filled email instead. `npm run check` tests the function without sending mail.

## Brand

`brand/` holds the brand pack: logos, `tokens.css`, email signature, business card, letterhead, social images, truck livery and the guidelines page (`/brand/`).

The old frozen-products site is kept in `legacy/` and is not deployed.
