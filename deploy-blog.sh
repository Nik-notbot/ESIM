#!/bin/bash
cd "$(dirname "$0")/blog-src"
npx tsx scripts/generate-posts-json.ts && npx vite build && rm -rf ../blog && cp -r dist ../blog
echo ""
echo "✅ Готово! Теперь запушь:"
echo "   git add -A && git commit -m 'Блог обновлён' && git push"
