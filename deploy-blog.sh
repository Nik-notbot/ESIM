#!/bin/bash
cd "$(dirname "$0")"
cd blog-src && npx tsx scripts/generate-posts-json.ts && npx vite build && rm -rf ../blog && cp -r dist ../blog && cd ..
git add -A && git commit -m "Блог обновлён" && git push
echo ""
echo "✅ Готово! Блог задеплоен."
