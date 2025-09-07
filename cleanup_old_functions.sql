-- Очистка старых функций и таблиц
-- Выполните этот скрипт если возникают конфликты

-- Удаляем старые функции
DROP FUNCTION IF EXISTS check_admin_password(VARCHAR(50), VARCHAR(255));
DROP FUNCTION IF EXISTS check_admin_password(VARCHAR(255));

-- Удаляем старые таблицы если они существуют
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_passwords CASCADE;

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Allow authenticated read" ON admins;
DROP POLICY IF EXISTS "Allow service role modify" ON admins;
DROP POLICY IF EXISTS "Allow authenticated read" ON admin_passwords;
DROP POLICY IF EXISTS "Allow service role modify" ON admin_passwords;

-- Теперь можно выполнить admin_auth_setup.sql