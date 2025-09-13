-- ЭКСТРЕННОЕ исправление RLS для таблицы qr_codes
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. ВРЕМЕННО отключаем RLS для отладки
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- 2. Удаляем ВСЕ существующие политики
DROP POLICY IF EXISTS "Allow authenticated read" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role modify" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow anonymous read" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON qr_codes;

-- 3. Проверяем что политики удалены
SELECT 'Политики удалены' as status, 
       COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'qr_codes';

-- 4. Проверяем статус RLS
SELECT 'RLS отключен' as status, 
       schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'qr_codes';