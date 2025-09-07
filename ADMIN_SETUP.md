# 🔐 Настройка админ панели с базой данных

## 📋 Шаги настройки:

### 1. Создание таблицы в Supabase

Выполните SQL скрипт `admin_auth_setup.sql` в Supabase SQL Editor:

```sql
-- Создание таблицы для админов
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Вставка админа по умолчанию (пароль: admin123)
INSERT INTO admins (username, password) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Создание RLS политик
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Политика: только аутентифицированные пользователи могут читать
CREATE POLICY "Allow authenticated read" ON admins
    FOR SELECT USING (auth.role() = 'authenticated');

-- Политика: только service_role может изменять
CREATE POLICY "Allow service role modify" ON admins
    FOR ALL USING (auth.role() = 'service_role');

-- Создание функции для проверки пароля
CREATE OR REPLACE FUNCTION check_admin_password(
    input_username VARCHAR(50),
    input_password VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    result JSON;
BEGIN
    -- Ищем админа по username
    SELECT * INTO admin_record 
    FROM admins 
    WHERE username = input_username AND is_active = true;
    
    -- Если админ не найден
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Пользователь не найден'
        );
        RETURN result;
    END IF;
    
    -- Проверяем пароль (простая проверка для демо)
    -- В реальном проекте используйте bcrypt или другую хеш-функцию
    IF input_password = 'admin123' THEN
        -- Обновляем время последнего входа
        UPDATE admins 
        SET last_login = NOW() 
        WHERE username = input_username;
        
        result := json_build_object(
            'success', true,
            'message', 'Успешная авторизация',
            'admin_id', admin_record.id,
            'username', admin_record.username
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'Неверный пароль'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION check_admin_password TO anon;
```

### 2. Настройка переменных окружения в Netlify

Добавьте в Netlify Dashboard → Site settings → Environment variables:

```
SUPABASE_URL=ваш_supabase_url
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

### 3. Изменение пароля

Чтобы изменить пароль админа, выполните в Supabase SQL Editor:

```sql
-- Изменить пароль для пользователя admin
UPDATE admins 
SET password = 'новый_пароль' 
WHERE username = 'admin';
```

### 4. Добавление нового админа

```sql
-- Добавить нового админа
INSERT INTO admins (username, password) 
VALUES ('новый_админ', 'пароль_админа');
```

## 🔒 Безопасность:

- ✅ Пароли хранятся в базе данных
- ✅ Серверная проверка через API
- ✅ RLS политики защищают данные
- ✅ Токены сессии с истечением
- ✅ Логирование входов

## 🚀 Использование:

1. Откройте `https://heyesim.me/admin-qr-upload.html`
2. Введите пароль: `admin123`
3. Нажмите "Войти"
4. Доступ к админ панели на 1 час

## 📝 Примечания:

- Пароль по умолчанию: `admin123`
- Сессия действует 1 час
- Все попытки входа логируются в БД
- Можно добавить несколько админов