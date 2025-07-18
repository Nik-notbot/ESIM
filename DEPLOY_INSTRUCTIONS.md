# Инструкция по развертыванию на Netlify

## 1. Подготовка базы данных Supabase

Выполните следующий SQL скрипт в Supabase SQL Editor:

```sql
-- Добавляем недостающие столбцы в таблицу qr_codes
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Переименовываем столбцы
ALTER TABLE qr_codes 
RENAME COLUMN emal TO email;

ALTER TABLE qr_codes 
RENAME COLUMN "Status" TO status;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_email_phone ON qr_codes(email, phone);
CREATE INDEX IF NOT EXISTS idx_qr_codes_invoice_id ON qr_codes(invoice_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at 
BEFORE UPDATE ON qr_codes
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

## 2. Получение Service Key из Supabase

1. Зайдите в настройки проекта Supabase
2. Перейдите в раздел API
3. Найдите `service_role key` (НЕ anon key!)
4. Скопируйте его для использования в Netlify

## 3. Развертывание на Netlify

### Через GitHub:

1. **Push код в GitHub репозиторий**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Создайте новый сайт в Netlify**
   - Зайдите на [app.netlify.com](https://app.netlify.com)
   - Нажмите "Add new site" → "Import an existing project"
   - Выберите GitHub и авторизуйтесь
   - Выберите ваш репозиторий

3. **Настройте build параметры**
   - Build command: `npm run build`
   - Publish directory: `build`

4. **ВАЖНО! Добавьте переменные окружения в Netlify:**

   Перейдите в Site settings → Environment variables и добавьте:

   ```
   SUPABASE_URL = https://nwcleyhnbzxetcqtlim.supabase.co
   SUPABASE_SERVICE_KEY = [ваш service_role key из Supabase]
   MORUNE_API_KEY = [секретный ключ из скриншота]
   MORUNE_ADDITIONAL_KEY = [дополнительный ключ из скриншота]
   MORUNE_API_URL = https://api.morune.com/e/new
   REACT_APP_SUPABASE_URL = https://nwcleyhnbzxetcqtlim.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODEzODUsImV4cCI6MjA2Mjk1NzM4NX0.3ss3IMHLlhipHY1u8610mCX6TBG4e3doZULjvoQ1Ijg
   ```

5. **Deploy**
   - Нажмите "Deploy site"
   - Дождитесь завершения сборки

## 4. Настройка Morune

После успешного деплоя:

1. Скопируйте URL вашего сайта (например: `https://amazing-site-123.netlify.app`)

2. В настройках Morune установите Callback URL:
   ```
   https://amazing-site-123.netlify.app/.netlify/functions/morune-webhook
   ```

## 5. Добавление QR кодов

В таблице `qr_codes` добавьте ваши QR коды:

```sql
INSERT INTO qr_codes (qr_url, name_user, status) VALUES
('https://ваш-url/qr1.png', 'User 1', false),
('https://ваш-url/qr2.png', 'User 2', false),
-- и так далее
```

## 6. Тестирование

1. Откройте ваш сайт
2. Заполните форму и нажмите "Купить"
3. Вы должны быть перенаправлены на страницу оплаты Morune
4. После оплаты вернетесь на страницу успеха с QR кодом

## Проверка логов

Для отладки проверяйте логи функций:
- В Netlify Dashboard: Functions → View logs
- Или в терминале: `netlify functions:log`

## Важные замечания

- НЕ коммитьте секретные ключи в git
- Используйте только service_role key для функций
- Проверьте, что все переменные окружения установлены правильно
- Убедитесь, что в таблице есть доступные QR коды (status = false)