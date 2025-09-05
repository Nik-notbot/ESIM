-- Исправленные RLS политики для таблицы qr_codes
-- Добавляем возможность обновления для анонимных пользователей

-- Удаляем старую политику
DROP POLICY IF EXISTS "Anon can check QR availability" ON qr_codes;

-- Добавляем политику для чтения
CREATE POLICY "Anon can check QR availability" ON qr_codes
    FOR SELECT
    TO anon
    USING (is_used = false);

-- Добавляем политику для обновления (помечание как использованный)
CREATE POLICY "Anon can mark QR as used" ON qr_codes
    FOR UPDATE
    TO anon
    USING (is_used = false)
    WITH CHECK (is_used = true);