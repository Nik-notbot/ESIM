# HEY, BLOG!

Минималистичный блог на Markdown.

## Запуск

```bash
npm install
npx convex dev      # терминал 1
npm run dev         # терминал 2
```

## Статьи

Создавай `.md` файлы в `content/blog/`, затем `npm run sync`.

## Админка

Зайди на `/admin` и введи пароль для доступа к Copy Page.

**Смени пароль** в `src/context/AdminContext.tsx`:
```tsx
const ADMIN_PASSWORD = "твой_новый_пароль";
```
