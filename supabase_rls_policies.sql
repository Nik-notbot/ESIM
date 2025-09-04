-- Отключаем RLS для таблиц (временно для тестирования)
-- ВНИМАНИЕ: В продакшене нужно настроить правильные политики безопасности!

-- Для таблицы orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политика для создания заказов (любой может создать)
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Политика для чтения заказов (только свои заказы по id)
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    TO anon
    USING (true); -- Временно разрешаем все, в продакшене нужно ограничить

-- Для таблицы esim_plans (публичная информация)
ALTER TABLE esim_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON esim_plans
    FOR SELECT
    TO anon
    USING (true);

-- Для таблицы qr_codes (только чтение для проверки доступности)
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can check QR availability" ON qr_codes
    FOR SELECT
    TO anon
    USING (is_used = false);

-- Для таблицы payment_history (только серверная запись)
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
-- Нет политик для anon, только service role может писать