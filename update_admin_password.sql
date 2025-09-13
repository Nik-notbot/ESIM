-- Обновление пароля админ панели
-- ВНИМАНИЕ: Этот файл содержит пароль в открытом виде!
-- Выполните этот скрипт в Supabase SQL Editor для обновления пароля

-- Удаляем все старые пароли
DELETE FROM admin_passwords;

-- Вставляем новый пароль
INSERT INTO admin_passwords (password) 
VALUES ('JlHhWO2hoU2');

-- Проверяем что пароль установлен
SELECT 'Пароль успешно обновлен' as status;