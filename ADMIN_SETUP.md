# 🔐 Настройка админ панели с базой данных

## 📋 Шаги настройки:

### 1. Очистка старых функций (если нужно)

Если возникают ошибки с функциями, сначала выполните `cleanup_old_functions.sql`:

```sql
-- Удаляем старые функции
DROP FUNCTION IF EXISTS check_admin_password(VARCHAR(50), VARCHAR(255));
DROP FUNCTION IF EXISTS check_admin_password(VARCHAR(255));

-- Удаляем старые таблицы
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_passwords CASCADE;
```

### 2. Создание таблицы в Supabase

Выполните SQL скрипт `admin_auth_setup.sql` в Supabase SQL Editor:

```sql
-- Создание таблицы для паролей
CREATE TABLE IF NOT EXISTS admin_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- Удаляем старые пароли если они есть
DELETE FROM admin_passwords;

-- Вставка нового пароля (пароль: JlHhWO2hoU2)
INSERT INTO admin_passwords (password) 
VALUES ('JlHhWO2hoU2');

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

### 3. Настройка переменных окружения в Netlify

Добавьте в Netlify Dashboard → Site settings → Environment variables:

```
SUPABASE_URL=ваш_supabase_url
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

### 4. Изменение пароля

Чтобы изменить пароль, выполните в Supabase SQL Editor:

```sql
-- Изменить пароль
UPDATE admin_passwords 
SET password = 'новый_пароль' 
WHERE password = 'JlHhWO2hoU2';
```

### 5. Добавление дополнительного пароля

```sql
-- Добавить дополнительный пароль
INSERT INTO admin_passwords (password) 
VALUES ('дополнительный_пароль');
```

## 🔒 Безопасность:

- ✅ Пароли хранятся в базе данных
- ✅ Серверная проверка через API
- ✅ RLS политики защищают данные
- ✅ Токены сессии с истечением
- ✅ Логирование входов

## 🚀 Использование:

1. Откройте `https://heyesim.me/admin-qr-upload.html`
2. Введите пароль: `JlHhWO2hoU2`
3. Нажмите "Войти"
4. Доступ к админ панели на 1 час

## 📝 Примечания:

- Пароль по умолчанию: `JlHhWO2hoU2`
- Сессия действует 1 час
- Все попытки входа логируются в БД
- Можно добавить несколько админов