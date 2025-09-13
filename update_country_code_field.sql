-- Обновление поля country_code для поддержки более длинных кодов
-- Выполните этот скрипт в Supabase SQL Editor

-- Увеличиваем размер поля country_code
ALTER TABLE qr_codes 
ALTER COLUMN country_code TYPE VARCHAR(20);

-- Добавляем комментарий к полю
COMMENT ON COLUMN qr_codes.country_code IS 'Код страны (может быть длиннее стандартного ISO кода)';

-- Проверяем что поле обновлено
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' AND column_name = 'country_code';