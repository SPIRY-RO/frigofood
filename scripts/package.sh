#!/bin/sh
# Builds exports/frigofood-website.zip and exports/frigofood-branding-kit.zip from the last commit: `npm run package`.
#   classic-hosting/  ready to upload by FTP (Apache/cPanel with PHP), built for CLASSIC_BASE
#   vercel-hosting/   the project, deployed with `npx vercel --prod`
set -e
cd "$(dirname "$0")/.."
CLASSIC_BASE="${CLASSIC_BASE:-https://www.frigofood.ro}"
OUT=exports/stage/frigofood-website
rm -rf exports
mkdir -p "$OUT"

git archive --format=tar --prefix=frigofood-website/vercel-hosting/ HEAD -- . ':(exclude)legacy' ':(exclude).claude' ':(exclude)DEPLOY.md' | tar -x -C exports/stage

SITE_BASE="$CLASSIC_BASE" node build.mjs
cp -R public "$OUT/classic-hosting"
cp -R server/apache/. "$OUT/classic-hosting/"
node build.mjs

cp DEPLOY.md "$OUT/CITESTE-MA.md"
find exports/stage -name '.DS_Store' -delete
(cd exports/stage && zip -qr ../frigofood-website.zip frigofood-website)
git archive --format=zip --prefix=frigofood-branding-kit/ -o exports/frigofood-branding-kit.zip HEAD:brand
rm -rf exports/stage
ls -lh exports
