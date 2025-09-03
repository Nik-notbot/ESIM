-- Таблица с тарифными планами
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    data_amount INTEGER NOT NULL, -- Объем данных в ГБ
    price_rub DECIMAL(10, 2) NOT NULL, -- Цена в рублях
    description TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица с пользователями/покупателями
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    telegram_username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица с заказами
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    payment_id VARCHAR(255) UNIQUE, -- ID платежа от платежной системы
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed, cancelled
    payment_url TEXT, -- Ссылка на оплату от платежной системы
    qr_code_url TEXT, -- Ссылка на QR код (формат https://ibb.co/xxxxx)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Таблица с QR кодами
CREATE TABLE qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    qr_url TEXT NOT NULL, -- Ссылка на изображение QR кода
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для оптимизации
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_qr_codes_order_id ON qr_codes(order_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных о тарифах
INSERT INTO plans (name, data_amount, price_rub, description, is_popular) VALUES
('Стандарт', 8, 499, 'Идеально для базовых потребностей', FALSE),
('Премиум', 25, 999, 'Оптимальный выбор для активных пользователей', TRUE);

-- Создание политик RLS (Row Level Security)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Политики для публичного доступа к тарифам
CREATE POLICY "Public can view plans" ON plans FOR SELECT USING (true);

-- Политики для заказов (только владелец может видеть свои заказы)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
    auth.uid()::text = customer_id::text OR 
    EXISTS (SELECT 1 FROM customers WHERE customers.id = orders.customer_id AND customers.email = auth.email())
);

-- Политики для QR кодов (только владелец заказа может видеть)
CREATE POLICY "Users can view own QR codes" ON qr_codes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = qr_codes.order_id 
        AND (
            auth.uid()::text = orders.customer_id::text OR
            EXISTS (SELECT 1 FROM customers WHERE customers.id = orders.customer_id AND customers.email = auth.email())
        )
    )
);