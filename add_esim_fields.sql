-- Добавление новых полей в таблицу qr_codes для информации о eSIM
-- Выполните этот скрипт в Supabase SQL Editor

-- Добавляем новые колонки
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS country_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS esim_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS puk_code VARCHAR(20);

-- Добавляем комментарии к колонкам
COMMENT ON COLUMN qr_codes.country_name IS 'Название страны eSIM';
COMMENT ON COLUMN qr_codes.country_code IS 'Код страны (например, DE, FR, US)';
COMMENT ON COLUMN qr_codes.esim_number IS 'Номер eSIM карты';
COMMENT ON COLUMN qr_codes.pin_code IS 'PIN код для eSIM';
COMMENT ON COLUMN qr_codes.puk_code IS 'PUK код для eSIM';