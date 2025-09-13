-- Комплексное исправление проблем админ панели
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Увеличиваем размер поля country_code
ALTER TABLE qr_codes 
ALTER COLUMN country_code TYPE VARCHAR(20);

-- 2. Удаляем старые RLS политики
DROP POLICY IF EXISTS "Allow authenticated read" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role modify" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow anonymous read" ON qr_codes;

-- 3. Включаем RLS для таблицы qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 4. Создаем новые RLS политики
-- Политика для service_role (для серверных функций)
CREATE POLICY "Allow service role full access" ON qr_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Политика для аутентифицированных пользователей (для админ панели)
CREATE POLICY "Allow authenticated users full access" ON qr_codes
    FOR ALL USING (auth.role() = 'authenticated');

-- Политика для анонимных пользователей (только чтение для клиентов)
CREATE POLICY "Allow anonymous read" ON qr_codes
    FOR SELECT USING (true);

-- 5. Проверяем что все исправлено
SELECT 'Поле country_code обновлено' as status, 
       column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' AND column_name = 'country_code';

SELECT 'RLS политики созданы' as status, 
       policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'qr_codes';