-- Исправление RLS политик для таблицы qr_codes
-- Выполните этот скрипт в Supabase SQL Editor

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Allow authenticated read" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role modify" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON qr_codes;

-- Включаем RLS для таблицы qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Создаем политику для service_role (для серверных функций)
CREATE POLICY "Allow service role full access" ON qr_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Создаем политику для аутентифицированных пользователей (для админ панели)
CREATE POLICY "Allow authenticated users full access" ON qr_codes
    FOR ALL USING (auth.role() = 'authenticated');

-- Создаем политику для анонимных пользователей (только чтение для клиентов)
CREATE POLICY "Allow anonymous read" ON qr_codes
    FOR SELECT USING (true);

-- Проверяем что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'qr_codes';