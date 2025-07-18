# eSIM Shop - Full Stack Application

Полноценное приложение для продажи eSIM с интеграцией Supabase и Morune API.

## 🚀 Технологии

- **Backend**: Node.js, Express, Supabase
- **Frontend**: React, React Router, React Hook Form
- **Database**: PostgreSQL (через Supabase)
- **Payment**: Morune API

## 📋 Предварительные требования

- Node.js (v14+)
- Аккаунт Supabase
- API ключ Morune
- PostgreSQL database (через Supabase)

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone <your-repo-url>
cd esim-shop
```

### 2. Настройка базы данных Supabase

1. Создайте новый проект в [Supabase](https://supabase.com)
2. Перейдите в SQL Editor
3. Выполните SQL из файла `database/supabase_schema.sql`
4. Загрузите ваши QR-коды и обновите URLs в таблице

### 3. Настройка Backend

```bash
cd backend
npm install
```

Создайте файл `.env` на основе `.env.example`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Morune API Configuration
MORUNE_API_KEY=your_morune_api_key_here
MORUNE_API_URL=https://api.morune.com/e/new

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Webhook Configuration (optional)
WEBHOOK_SECRET=your_webhook_secret_from_morune
```

### 4. Настройка Frontend

```bash
cd ../frontend
npm install
```

### 5. Запуск приложения

В двух отдельных терминалах:

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## 📱 Workflow приложения

1. **Пользователь** заполняет форму с email и телефоном
2. **Frontend** отправляет данные на backend
3. **Backend**:
   - Резервирует свободный QR-код
   - Создает invoice через Morune API
   - Возвращает URL для оплаты
4. **Пользователь** перенаправляется на страницу оплаты Morune
5. **Morune** отправляет webhook после оплаты
6. **Backend** обновляет статус QR-кода
7. **Пользователь** видит QR-код на странице успеха

## 🔧 API Endpoints

### Backend Endpoints

- `POST /api/create-invoice` - Создание счета
  ```json
  {
    "email": "user@example.com",
    "phone": "+79991234567",
    "plan": "start" // или "premium"
  }
  ```

- `POST /api/morune-webhook` - Webhook для Morune (автоматический)

- `GET /api/get-qr?email=...&phone=...` - Получение QR-кода

## 🔐 Безопасность

- Используйте HTTPS в production
- Храните API ключи в переменных окружения
- Настройте CORS правильно
- Используйте webhook signature verification
- Включите Row Level Security в Supabase

## 📝 Настройка Morune

1. Зарегистрируйтесь в [Morune](https://morune.com)
2. Получите API ключ
3. Настройте webhook URL: `https://your-domain.com/api/morune-webhook`
4. Сохраните webhook secret (если предоставлен)

## 🚀 Deployment

### Backend (Heroku/Railway/Render)

1. Создайте новое приложение
2. Добавьте переменные окружения
3. Deploy через Git

### Frontend (Vercel/Netlify)

1. Build production версию:
   ```bash
   npm run build
   ```
2. Deploy папку `build`

### Важные настройки для production:

- Обновите `FRONTEND_URL` и `BACKEND_URL` в `.env`
- Настройте SSL сертификаты
- Обновите CORS origins
- Настройте правильные webhook URLs в Morune

## 🐛 Troubleshooting

### Ошибка "No available eSIM codes"
- Проверьте, есть ли записи с `status = false` в таблице
- Убедитесь, что QR URLs корректные

### Webhook не работает
- Проверьте, доступен ли ваш backend извне
- Проверьте логи webhook в Morune dashboard
- Убедитесь, что URL правильный

### CORS ошибки
- Проверьте FRONTEND_URL в backend `.env`
- Убедитесь, что proxy настроен в frontend `package.json`

## 📞 Поддержка

При возникновении вопросов:
- Документация Supabase: https://supabase.com/docs
- Документация Morune: https://docs.morune.com
- React документация: https://react.dev

## 📄 Лицензия

MIT License