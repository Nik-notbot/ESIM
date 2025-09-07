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
    -- Ищем админа по username и паролю
    SELECT * INTO admin_record 
    FROM admins 
    WHERE username = input_username AND password = input_password;
    
    -- Если админ не найден
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Неверный логин или пароль'
        );
    ELSE
        result := json_build_object(
            'success', true,
            'message', 'Успешная авторизация',
            'admin_id', admin_record.id,
            'username', admin_record.username
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION check_admin_password TO anon;