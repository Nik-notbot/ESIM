-- Создание таблицы для паролей
CREATE TABLE IF NOT EXISTS admin_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- Вставка пароля по умолчанию (пароль: admin123)
INSERT INTO admin_passwords (password) 
VALUES ('admin123');

-- Создание RLS политик
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

-- Политика: только аутентифицированные пользователи могут читать
CREATE POLICY "Allow authenticated read" ON admin_passwords
    FOR SELECT USING (auth.role() = 'authenticated');

-- Политика: только service_role может изменять
CREATE POLICY "Allow service role modify" ON admin_passwords
    FOR ALL USING (auth.role() = 'service_role');

-- Удаляем старую функцию если она существует
DROP FUNCTION IF EXISTS check_admin_password(VARCHAR(50), VARCHAR(255));

-- Создание функции для проверки пароля
CREATE OR REPLACE FUNCTION check_admin_password(
    input_password VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    password_record RECORD;
    result JSON;
BEGIN
    -- Ищем пароль в таблице
    SELECT * INTO password_record 
    FROM admin_passwords 
    WHERE password = input_password;
    
    -- Если пароль не найден
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Неверный пароль'
        );
    ELSE
        result := json_build_object(
            'success', true,
            'message', 'Успешная авторизация'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION check_admin_password(VARCHAR(255)) TO anon;