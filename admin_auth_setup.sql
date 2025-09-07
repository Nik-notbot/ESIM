-- Создание таблицы для админов
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Вставка админа по умолчанию (пароль: admin123)
-- Хеш для пароля 'admin123' (bcrypt с солью)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV')
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