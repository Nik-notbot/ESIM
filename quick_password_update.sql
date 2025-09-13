-- Быстрое обновление пароля админ панели
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем таблицу если её нет
CREATE TABLE IF NOT EXISTS admin_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Очищаем старые пароли
DELETE FROM admin_passwords;

-- Вставляем новый пароль
INSERT INTO admin_passwords (password) 
VALUES ('JlHhWO2hoU2');

-- Проверяем результат
SELECT 'Пароль обновлен' as status, password, created_at FROM admin_passwords;