-- Восстановление RLS безопасности для таблицы qr_codes
-- Выполните этот скрипт после того, как админ панель заработала

-- 1. Включаем RLS обратно
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 2. Создаем правильные политики безопасности
CREATE POLICY "Allow service role full access" ON qr_codes 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access" ON qr_codes 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous read" ON qr_codes 
FOR SELECT USING (true);

-- 3. Проверяем что политики созданы
SELECT 'RLS включен' as status, 
       schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- 4. Проверяем политики
SELECT 'Политики созданы' as status, 
       COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'qr_codes';