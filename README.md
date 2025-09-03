# eSIM Store - Интеграция с платежной системой

## Описание
Веб-сайт для продажи eSIM карт с интеграцией платежной системы WATA и базой данных Supabase.

## Функциональность
1. **Выбор тарифа** - Пользователь выбирает тариф и нажимает "Купить"
2. **Страница оплаты** - Заполнение контактных данных и переход к оплате
3. **Обработка платежа** - Создание записи в БД и перенаправление на платежную систему
4. **Успешная оплата** - Отображение QR-кода для активации eSIM
5. **Webhook** - Автоматическое обновление статуса платежа

## Структура файлов

### Основные файлы
- `index.html` - Главная страница с тарифами
- `payment.html` - Страница оформления заказа
- `success.html` - Страница успешной оплаты с QR-кодом
- `fail.html` - Страница неудачной оплаты
- `config.js` - Конфигурация (API ключи, URL-адреса)

### JavaScript файлы
- `script.js` - Основная логика сайта и интеграция с кнопками покупки
- `payment.js` - Логика страницы оплаты
- `success.js` - Логика страницы успеха и отображения QR-кода
- `api/webhook.js` - Серверный обработчик webhook

### База данных
- `database/schema.sql` - SQL схема для Supabase

## Настройка

### 1. Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com)
2. Выполните SQL из файла `database/schema.sql` в SQL редакторе Supabase
3. Скопируйте URL и ключи из настроек проекта

### 2. Настройка config.js

Откройте файл `config.js` и замените следующие значения:

```javascript
supabase: {
    url: 'YOUR_SUPABASE_URL', // Ваш URL Supabase
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // Анонимный ключ
    serviceKey: 'YOUR_SUPABASE_SERVICE_KEY' // Сервисный ключ (для webhook)
},

wata: {
    webhookSecret: 'YOUR_WEBHOOK_SECRET' // Секрет для проверки webhook
}
```

### 3. Добавление QR-кодов

В файле `config.js` добавьте ссылки на ваши QR-коды:

```javascript
qrCodes: [
    'https://ibb.co/TxNLKx3x',
    'https://ibb.co/xxxxxx',
    // Добавьте больше QR кодов
]
```

### 4. Настройка Webhook

1. Разместите файл `api/webhook.js` на вашем сервере
2. Установите зависимости:
   ```bash
   npm install express @supabase/supabase-js
   ```
3. Настройте URL webhook в платежной системе WATA

### 5. Настройка платежной системы WATA

1. В личном кабинете WATA настройте:
   - Success URL: `https://yourdomain.com/success.html`
   - Fail URL: `https://yourdomain.com/fail.html`
   - Webhook URL: `https://yourdomain.com/api/webhook`

## Таблицы базы данных

### plans - Тарифные планы
- `id` - UUID
- `name` - Название тарифа
- `data_amount` - Объем данных в ГБ
- `price_rub` - Цена в рублях
- `description` - Описание
- `is_popular` - Популярный тариф

### customers - Покупатели
- `id` - UUID
- `email` - Email (опционально)
- `phone` - Телефон (опционально)
- `telegram_username` - Telegram username (опционально)

### orders - Заказы
- `id` - UUID
- `customer_id` - ID покупателя
- `plan_id` - ID тарифа
- `payment_id` - ID платежа от WATA
- `amount` - Сумма
- `status` - Статус (pending, processing, paid, failed, cancelled)
- `payment_url` - Ссылка на оплату
- `qr_code_url` - Ссылка на QR код

### qr_codes - QR коды
- `id` - UUID
- `order_id` - ID заказа
- `qr_url` - Ссылка на изображение QR кода
- `is_used` - Использован ли код

## Процесс оплаты

1. Пользователь выбирает тариф на главной странице
2. Переходит на `payment.html` с параметрами тарифа
3. Заполняет контактные данные (опционально)
4. Система создает заказ в БД и получает ссылку на оплату от WATA
5. Пользователь перенаправляется на страницу оплаты WATA
6. После оплаты:
   - Успех → `success.html` с QR-кодом
   - Неудача → `fail.html` с возможностью повторить
7. Webhook обновляет статус заказа в БД

## Безопасность

- Используйте HTTPS для всех страниц
- Храните сервисный ключ Supabase только на сервере
- Проверяйте подпись webhook запросов
- Используйте Row Level Security (RLS) в Supabase

## Поддержка

Telegram: [@HEYKYCSTORE](https://t.me/HEYKYCSTORE)