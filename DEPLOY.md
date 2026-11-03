# Deploy the Frigo Food website

Requires Node.js 18 or newer.

## Vercel (recommended, the quote form sends email)

1. `npm install`
2. `npx vercel --prod` (or vercel.com → New Project → import this folder; build settings come from `vercel.json`)
3. Vercel → Project → Settings → Environment Variables (Production):
   - `SMTP_HOST` = `mail.frigofood.ro`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = `office@frigofood.ro`
   - `SMTP_PASS` = the mailbox password
4. Redeploy. Open `/api/quote`: it should say `"mail":"configured"`.

## Any other static host (no email; the form offers email and phone instead)

1. `npm install && npm run build`
2. Upload the contents of the `public/` folder.

More details (editing content, routes, FAQ, SEO): `README.md`.
