# Frigo Food: cum se publică site-ul / how to deploy

Arhiva are două foldere. Alege-l pe cel potrivit pentru hosting.

| Folder | Pentru | Ce faci |
|---|---|---|
| `classic-hosting/` | hosting clasic: cPanel, Apache cu PHP (de exemplu hostingul actual frigofood.ro) | copy-paste prin FTP |
| `vercel-hosting/` | Vercel | `npm install`, apoi `npx vercel --prod` |

## classic-hosting (FTP)

1. Fă o copie de siguranță a fișierelor vechi din `public_html`, apoi șterge-le.
2. Copiază **tot conținutul** folderului `classic-hosting/` în `public_html`, inclusiv fișierul ascuns `.htaccess` (în FileZilla: Server → Force showing hidden files).
3. Deschide `https://www.frigofood.ro/api/quote`. Trebuie să apară `"mail":"php_mail"`.
4. Trimite o cerere de test din pagina de contact și verifică dacă a ajuns în office@frigofood.ro.

Formularul trimite e-mailul prin serverul de mail al hostingului (PHP `mail()`), fără parolă. Destinatarul se schimbă în `api/quote.php`, rândul `$TO`. Site-ul este construit pentru adresa `https://www.frigofood.ro`, iar `frigofood.ro` redirecționează automat acolo.

## vercel-hosting

```bash
cd vercel-hosting
npm install
npx vercel --prod
```

Apoi în Vercel → Project → Settings → Environment Variables (Production): `SMTP_HOST` = `mail.frigofood.ro`, `SMTP_PORT` = `465`, `SMTP_USER` = `office@frigofood.ro`, `SMTP_PASS` = parola căsuței de e-mail. Fă redeploy. `/api/quote` trebuie să arate `"mail":"configured"`.

Modificările de conținut se fac în `vercel-hosting/` (vezi `README.md`). `npm run package` reface ambele foldere.

---

## English

The archive has two folders; pick the one that matches the hosting.

**`classic-hosting/`** (cPanel, Apache with PHP): back up and remove the old files in `public_html`, then upload **everything** inside `classic-hosting/` by FTP, including the hidden `.htaccess`. Check that `https://www.frigofood.ro/api/quote` shows `"mail":"php_mail"`, then send one test request from the contact page. The form emails through the hosting's own mail server with PHP `mail()`, so no password is stored; change the recipient in `api/quote.php` (`$TO`). The pages are built for `https://www.frigofood.ro`; `frigofood.ro` redirects there. For another domain, run `CLASSIC_BASE=https://other.domain npm run package` in `vercel-hosting/`. On Nginx, serve the folder as static files and route `/api/quote` to `api/quote.php` through PHP-FPM.

**`vercel-hosting/`**: `npm install`, `npx vercel --prod`, then add the four `SMTP_*` variables above in Vercel (Production) and redeploy. `/api/quote` should show `"mail":"configured"`.

Content is edited in `vercel-hosting/` (see its `README.md`); `npm run package` rebuilds both folders.
