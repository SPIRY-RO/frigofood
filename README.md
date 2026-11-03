# Frigo Food Distribution

Website for Frigo Food Distribution SRL: international refrigerated transport, full truck load (FTL) and groupage, for the food industry. Static HTML/CSS/JS, bilingual RO/EN, deployed on Vercel (project `frigofood`, team `spiry-research`).

## Pages

| File | Page |
|---|---|
| `index.html` | Acasă |
| `transport-ftl.html` | Transport FTL, with quote form |
| `grupaj-frigorific.html` | Grupaj frigorific, with quote form |
| `rute.html` | Rute (interactive lane board) |
| `despre-noi.html` | Despre noi, company and licence data |
| `contact.html` | Contact and quote form |
| `404.html` | Not-found page |
| `confidentialitate.html` | Privacy notice for the quote form |

Shared pieces live in `js/site.js` (header, footer, language switch, route board, quote form) and `css/site.css`. Every visible text exists in both languages as `<span lang="ro">` / `<span lang="en">`; CSS hides the inactive one.

## Common edits

- **Countries and lanes:** edit `HUBS`, `WEST`, `EAST` and `LANES` in `js/site.js`. Today: West and North (UK, ES, NL, BE, DE, DK, SE) ⇄ Central and East (AT, CZ, SK, HU, PL, RO, BG). Keep only lanes actually operated; `groupage: 'request'` shows "Grupaj la cerere". Each hub needs its ISO numeric `id` so the map can highlight the country.
- **Map:** real country shapes from `world-atlas` (Natural Earth 1:50m) drawn with `d3-geo`, both loaded from jsDelivr only when the map scrolls into view.
- **Contact data:** `CONTACT` in `js/site.js`, plus the hard-coded phone in the CTA bands and `contact.html`.
- **Photos:** pages use Unsplash stand-ins. Replace with real company photos (hero, loading, trailers, team) when available.

## Quote form

The form validates in the browser and opens the visitor's email app with a pre-filled request to office@frigofood.ro. No backend, no stored data. To accept attachments or log requests, add a serverless `/api/quote` function with an email provider.

## Brand

`brand/` holds the brand pack: logo SVG/PNG variants, `tokens.css`, email signature, business card, letterhead, social images, truck livery and the guidelines page at `brand/index.html`.

## Run locally

```bash
python3 -m http.server 8800
```

The old frozen-products site is kept in `legacy/` (excluded from deploys by `.vercelignore`).
