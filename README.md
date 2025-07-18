# eSIM Shop - Netlify Deployment

Полноценное приложение для продажи eSIM, оптимизированное для развертывания на Netlify с использованием Netlify Functions, React и Supabase.

## 🚀 Технологии

- **Frontend**: React, React Router, React Hook Form
- **Backend**: Netlify Functions (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Payment**: Morune API
- **Hosting**: Netlify

## 📋 Особенности Netlify версии

- **Serverless архитектура**: Использует Netlify Functions вместо Express сервера
- **Автоматический CI/CD**: Push в репозиторий автоматически деплоит изменения
- **Встроенная поддержка переменных окружения**: Через Netlify Dashboard
- **Автоматический HTTPS**: SSL сертификаты от Netlify

## 🛠️ Локальная установка

### 1. Клонирование и установка зависимостей

```bash
git clone <your-repo-url>
cd esim-netlify
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```env
# React App Environment Variables
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Netlify Functions Environment Variables (для локальной разработки)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MORUNE_API_KEY=your_morune_api_key
MORUNE_API_URL=https://api.morune.com/e/new
WEBHOOK_SECRET=your_webhook_secret
```

### 3. Настройка базы данных Supabase

1. Создайте проект в [Supabase](https://supabase.com)
2. Выполните SQL скрипт:

```sql
-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    qr_url TEXT NOT NULL,
    status BOOLEAN DEFAULT FALSE,
    email TEXT,
    phone TEXT,
    invoice_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_email_phone ON qr_codes(email, phone);

-- Insert sample QR codes
INSERT INTO qr_codes (qr_url) VALUES
    ('https://your-storage.com/qr-codes/esim-001.png'),
    ('https://your-storage.com/qr-codes/esim-002.png'),
    ('https://your-storage.com/qr-codes/esim-003.png');
```

### 4. Локальная разработка

```bash
# Установите Netlify CLI глобально
npm install -g netlify-cli

# Запустите локальный сервер с функциями
netlify dev
```

Приложение будет доступно по адресу: http://localhost:8888

## 🚀 Развертывание на Netlify

### Способ 1: Через GitHub (Рекомендуется)

1. **Push код в GitHub репозиторий**

2. **Войдите в Netlify Dashboard**
   - Перейдите на [app.netlify.com](https://app.netlify.com)
   - Нажмите "New site from Git"

3. **Подключите репозиторий**
   - Выберите GitHub
   - Авторизуйтесь и выберите ваш репозиторий

4. **Настройте build параметры**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions` (автоматически определится)

5. **Добавьте переменные окружения**
   В разделе "Environment variables" добавьте:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `MORUNE_API_KEY`
   - `MORUNE_API_URL`
   - `WEBHOOK_SECRET`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### Способ 2: Через Netlify CLI

```bash
# Войдите в Netlify
netlify login

# Создайте новый сайт
netlify init

# Деплой
netlify deploy --prod
```

## 📝 Настройка Morune

После развертывания настройте webhook в Morune Dashboard:

1. Webhook URL: `https://your-site.netlify.app/.netlify/functions/morune-webhook`
2. Сохраните webhook secret в переменных окружения Netlify

## 🔧 Структура проекта

```
esim-netlify/
├── netlify/
│   └── functions/          # Serverless функции
│       ├── create-invoice.js
│       ├── morune-webhook.js
│       └── get-qr.js
├── public/                 # Статические файлы
│   └── index.html
├── src/                    # React приложение
│   ├── components/
│   │   ├── CheckoutForm.js
│   │   ├── CheckoutForm.css
│   │   ├── SuccessPage.js
│   │   └── SuccessPage.css
│   ├── App.js
│   ├── App.css
│   └── index.js
├── netlify.toml           # Конфигурация Netlify
├── package.json
└── README.md
```

## 🔐 Безопасность

- Все API ключи хранятся в переменных окружения Netlify
- Service key Supabase используется только в serverless функциях
- Webhook подпись проверяется для безопасности
- HTTPS включен автоматически

## 🐛 Отладка

### Просмотр логов функций

1. В Netlify Dashboard: Functions → View logs
2. Локально: логи выводятся в консоль

### Частые проблемы

**Ошибка "No available eSIM codes"**
- Проверьте наличие записей с `status = false` в Supabase
- Убедитесь, что QR URLs корректные

**Webhook не работает**
- Проверьте URL в Morune Dashboard
- Проверьте логи функции `morune-webhook`

**CORS ошибки**
- Netlify Functions автоматически обрабатывают CORS
- Проверьте, что используете правильные URL

## 📊 Мониторинг

Netlify предоставляет встроенный мониторинг:
- Analytics для трафика
- Function logs для отладки
- Build logs для деплоя

## 🔄 Обновления

Для обновления сайта просто сделайте push в GitHub:

```bash
git add .
git commit -m "Update description"
git push
```

Netlify автоматически соберет и развернет новую версию.

## 📞 Поддержка

- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)

## 📄 Лицензия

MIT License