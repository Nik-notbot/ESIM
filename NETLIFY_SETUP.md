# Настройка для Netlify

## 1. Настройка CORS в Supabase

1. Зайдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Settings → API**
4. В разделе **CORS Settings** добавьте:
   - Ваш домен Netlify: `https://ваш-сайт.netlify.app`
   - Или кастомный домен, если настроен: `https://ваш-домен.com`

## 2. Настройка политик безопасности (RLS)

Выполните в SQL Editor Supabase:

```sql
-- Разрешаем анонимным пользователям создавать заказы
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT 
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    TO anon
    USING (true);

-- Разрешаем просмотр тарифов всем
ALTER TABLE esim_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON esim_plans;
CREATE POLICY "Anyone can view plans" ON esim_plans
    FOR SELECT
    TO anon
    USING (true);

-- Разрешаем проверку доступности QR-кодов
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can check QR availability" ON qr_codes;
CREATE POLICY "Anon can check QR availability" ON qr_codes
    FOR SELECT
    TO anon
    USING (is_used = false);

-- Payment history - только для service role
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
```

## 3. Проверка работы

После настройки CORS:
1. Откройте ваш сайт на Netlify
2. Откройте консоль браузера (F12)
3. Попробуйте сделать тестовый заказ
4. Проверьте ошибки в консоли

## 4. Настройка переменных окружения в Netlify (опционально)

Если нужно скрыть ключи API:

1. В Netlify Dashboard → Site settings → Environment variables
2. Добавьте переменные:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `WATA_API_KEY`

Но для статического сайта это не поможет скрыть ключи от клиента.

## 5. Webhook для Netlify Functions

Если хотите использовать Netlify Functions для webhook:

1. Создайте папку `netlify/functions/` в корне проекта
2. Переместите туда обработчик webhook
3. URL webhook будет: `https://ваш-сайт.netlify.app/.netlify/functions/webhook`

## Важно!

- Анонимный ключ Supabase безопасно использовать на клиенте
- API ключ Wata тоже можно использовать на клиенте для создания платежей
- Service Role Key НИКОГДА не должен быть в клиентском коде!