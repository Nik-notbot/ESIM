# Полное руководство по настройке eSIM Store с новым Supabase

## 📋 Что нужно сделать:

1. **Создать новый проект Supabase**
2. **Настроить таблицы и безопасность**
3. **Обновить код сайта**
4. **Настроить вебхук в Wata**
5. **Загрузить QR-коды**
6. **Протестировать систему**

---

## 1️⃣ Создание проекта Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект (название: `esim-store`)
3. Сохраните пароль базы данных!
4. Дождитесь создания (~2 минуты)

## 2️⃣ Настройка базы данных

### Скопируйте ваши ключи:
1. Settings → API
2. Сохраните:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` 
   - **service_role**: `eyJhbGc...` (для вебхука)

### Создайте таблицы:
1. SQL Editor → New query
2. Вставьте и выполните весь SQL из файла `SUPABASE_NEW_PROJECT_SETUP.md` (шаг 3)

### Настройте CORS:
1. Authentication → URL Configuration
2. Site URL: `https://heyesim.me`
3. Redirect URLs:
   - `https://heyesim.me`
   - `http://localhost:*`
   - `https://*.netlify.app`

## 3️⃣ Обновление кода сайта

### Обновите файлы с вашими ключами:

1. **payment-supabase-new.js** (строки 3-4):
```javascript
const SUPABASE_URL = 'https://ВАШИ-ДАННЫЕ.supabase.co';
const SUPABASE_ANON_KEY = 'ВАШ-ANON-KEY';
```

2. **success-new.html** (строки ~150-151):
```javascript
const SUPABASE_URL = 'https://ВАШИ-ДАННЫЕ.supabase.co';
const SUPABASE_ANON_KEY = 'ВАШ-ANON-KEY';
```

3. **admin-qr-upload.html** (строки ~296-297):
```javascript
const SUPABASE_URL = 'https://ВАШИ-ДАННЫЕ.supabase.co';
const SUPABASE_ANON_KEY = 'ВАШ-ANON-KEY';
```

4. **netlify/functions/wata-webhook.js** (строки 6-7):
```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ВАШИ-ДАННЫЕ.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'ВАШ-SERVICE-KEY';
```

### Обновите payment.html:
```html
<!-- Закомментируйте старый скрипт -->
<!-- <script src="payment-simple.js"></script> -->

<!-- Добавьте новый -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="payment-supabase-new.js"></script>
```

## 4️⃣ Настройка Netlify

### Добавьте переменные окружения:
1. Netlify Dashboard → Site settings → Environment variables
2. Добавьте:
   - `SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `SUPABASE_SERVICE_KEY` = `eyJhbGc...` (service_role key!)

### Проверьте деплой:
1. Дождитесь завершения деплоя
2. Проверьте, что функции работают:
   - `/.netlify/functions/wata-proxy`
   - `/.netlify/functions/wata-webhook`

## 5️⃣ Настройка вебхука в Wata

1. Войдите в личный кабинет Wata
2. Найдите настройки вебхуков
3. Добавьте URL: `https://heyesim.me/.netlify/functions/wata-webhook`
4. Выберите события: Payment Success, Payment Failed

## 6️⃣ Загрузка QR-кодов

1. Откройте `https://heyesim.me/admin-qr-upload.html`
2. Добавьте QR-коды для каждого тарифа:
   - Стандарт (план 1) - минимум 5-10 штук
   - Премиум (план 2) - минимум 5-10 штук

### Пример URL для QR-кодов:
```
https://i.ibb.co/TxNLKx3x/qr-001.png
https://i.ibb.co/ABC123/qr-002.png
https://i.ibb.co/DEF456/qr-003.png
```

## 7️⃣ Тестирование

### Проверьте каждый этап:

1. **Главная страница** → Нажмите "Купить"
2. **Страница оплаты** → Введите email и телефон
3. **Оплата** → Оплатите тестовую сумму (100₽)
4. **Страница успеха** → Должен появиться QR-код

### Проверьте в Supabase:
- Table Editor → orders (новый заказ)
- Table Editor → qr_codes (QR помечен как использованный)

## 🚨 Частые проблемы:

### "Failed to fetch" на payment.html
- Проверьте SUPABASE_URL и ANON_KEY
- Проверьте CORS настройки в Supabase

### QR-код не появляется
- Проверьте, есть ли доступные QR в базе
- Проверьте консоль браузера (F12)

### Вебхук не работает
- Проверьте переменные окружения в Netlify
- Проверьте логи функции в Netlify

## 📞 Поддержка

Если что-то не работает:
1. Проверьте консоль браузера (F12)
2. Проверьте логи Netlify Functions
3. Проверьте логи в Supabase Dashboard

---

**После выполнения всех шагов ваш магазин eSIM будет полностью готов к работе!** 🎉