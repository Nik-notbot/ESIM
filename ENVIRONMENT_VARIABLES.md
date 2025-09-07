# Переменные окружения для Netlify

Для безопасной работы приложения необходимо настроить следующие переменные окружения в Netlify:

## Обязательные переменные

### Supabase
```
SUPABASE_URL=https://wiwkergsvbgnrdslqkzg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2tlcmdzdmJnbnJkc2xxa3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTA5MjAsImV4cCI6MjA3MjU2NjkyMH0.PmWeSrWMRzlHlFJpwRjlSla3Ra6hWAoCNErMEdEWtEk
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key_здесь
```

### Wata API
```
WATA_API_KEY=ваш_wata_api_key_здесь
WATA_SECRET_KEY=ваш_wata_secret_key_здесь
```

## Как настроить в Netlify

1. Зайдите в панель управления Netlify
2. Выберите ваш сайт
3. Перейдите в **Site settings** → **Environment variables**
4. Добавьте все переменные из списка выше
5. Нажмите **Save**

## Безопасность

- ✅ Все чувствительные данные теперь хранятся в переменных окружения
- ✅ Клиентский код не содержит API ключей
- ✅ Все операции с базой данных выполняются через серверные функции
- ✅ CORS настроен правильно для всех функций

## Проверка

После настройки переменных окружения:
1. Перезапустите сайт в Netlify
2. Проверьте работу страницы оплаты
3. Проверьте получение QR-кодов на странице успеха
4. Проверьте админ панель

Все должно работать без ошибок в консоли браузера.