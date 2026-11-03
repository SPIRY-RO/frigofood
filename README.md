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
- **Company and contact data:** `data/site.json` → `contact`. `phones` is a list; every number appears in the top strip, mobile menu, mobile "Sună" button, footer, CTA band, contact page, privacy page and structured data. Pages can print the list with `<!--ff:phones-->` (links) or `<!--ff:phones-text-->` (plain text).
- **Domain:** `data/site.json` → `base`. Switch to `https://www.frigofood.ro` once the domain points to Vercel (canonical tags, hreflang and sitemap follow).
- **Photos:** Unsplash stand-ins; replace with real company photos when available.

## Quote form and email

The form (`js/site.js` → `renderQuoteForm`) posts JSON to `/api/quote`. `api/quote.js` validates it, applies spam protection (hidden trap field, minimum fill time, origin check, per-IP rate limit) and emails it to the office with the client as reply-to, so "Reply" in the mailbox answers the client.

### Turning email on (5 minutes)

1. In Vercel: Project `frigofood` → Settings → Environment Variables, add the values from [`.env.example`](.env.example) for **Production**. The mailbox `office@frigofood.ro` is on the cPanel server of Comtel Networks:

   | Variable | Value |
   |---|---|
   | `SMTP_HOST` | `mail.frigofood.ro` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `office@frigofood.ro` |
   | `SMTP_PASS` | the mailbox password (cPanel → Email Accounts) |
   | `QUOTE_TO` | optional; recipients, comma-separated; default `office@frigofood.ro` |
   | `QUOTE_FROM` | optional; sender, must be a mailbox on the same server; default `SMTP_USER` |

2. Redeploy (`vercel --prod`, or Deployments → Redeploy). Environment changes only apply to new deployments.
3. Open `https://<domain>/api/quote` in a browser. It answers `"mail":"configured"` when the variables are present, and otherwise lists the `missing` ones. It also shows the host, port and user it uses (never the password).

`SMTP_HOST`, `SMTP_PORT` and `SMTP_USER` are already set in Production; only `SMTP_PASS` remains.
4. Send one test request from the contact page and check that it arrives.

Until then the function answers 503 and the form offers a pre-filled email plus the phone numbers, so no request is lost.

**Another mail provider:** any SMTP service works with the same four variables, for example Google Workspace (`smtp.gmail.com`, 465, app password), Microsoft 365 (`smtp.office365.com`, 587) or Resend (`smtp.resend.com`, 465, user `resend`, password = API key).

**Troubleshooting:** the Vercel function log (Project → Logs, filter `/api/quote`) shows `quote mail failed` with the SMTP error code. `EAUTH` means wrong user or password; `ETIMEDOUT` or `ECONNREFUSED` means wrong host or port.

### Changing the form

- **Fields:** a field exists in two places, the markup in `renderQuoteForm` (`js/site.js`) and the `FIELDS` list in `api/quote.js` (label in the email, required, max length, type). Add or remove it in both. `npm run check` tests the function without sending mail.
- **Texts:** all form labels, errors and the thank-you message are in `renderQuoteForm`, in both languages (`t('ro', 'en')`).
- **Spam limits:** `MIN_FILL_MS` (minimum time on the form) and `rateLimited()` (5 requests per IP per 10 minutes) in `api/quote.js`.
- **Domains:** the site's own domain is always accepted. `ALLOWED_HOSTS` only matters for posting from another domain.

## Brand

`brand/` holds the brand pack: logos, `tokens.css`, email signature, business card, letterhead, social images, truck livery and the guidelines page (`/brand/`).

The old frozen-products site is kept in `legacy/` and is not deployed.
