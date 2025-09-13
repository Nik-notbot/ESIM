-- Создание таблицы для паролей админ панели
-- Выполните этот скрипт в Supabase SQL Editor

-- Создание таблицы для паролей
CREATE TABLE IF NOT EXISTS admin_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Вставка нового пароля (пароль: JlHhWO2hoU2)
INSERT INTO admin_passwords (password) 
VALUES ('JlHhWO2hoU2');

-- Создание RLS политик
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

-- Политика: только service_role может читать и изменять
CREATE POLICY "Allow service role full access" ON admin_passwords
    FOR ALL USING (auth.role() = 'service_role');

-- Проверяем что пароль установлен
SELECT 'Пароль успешно установлен' as status, password FROM admin_passwords;