-- Добавление скрытого текстового столбца в таблицу qr_codes
-- Выполните этот скрипт в Supabase SQL Editor

-- Добавляем новый столбец для скрытых заметок
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS hidden_notes TEXT;

-- Добавляем комментарий к столбцу для документации
COMMENT ON COLUMN qr_codes.hidden_notes IS 'Скрытые заметки для администратора, не отображаются на сайте';

-- Проверяем что столбец добавлен
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' AND column_name = 'hidden_notes';