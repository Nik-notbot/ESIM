-- Добавляем недостающие столбцы в таблицу qr_codes
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Переименовываем столбцы для соответствия коду
ALTER TABLE qr_codes 
RENAME COLUMN emal TO email;

ALTER TABLE qr_codes 
RENAME COLUMN "Status" TO status;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_email_phone ON qr_codes(email, phone);
CREATE INDEX IF NOT EXISTS idx_qr_codes_invoice_id ON qr_codes(invoice_id);

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at 
BEFORE UPDATE ON qr_codes
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();