-- Обновление цен и объемов данных в базе
-- Выполните этот скрипт в Supabase SQL Editor

-- Обновляем тариф "Стандарт" (8 ГБ) - цена 2400 ₽
UPDATE esim_plans 
SET price_rub = 2400.00 
WHERE name = 'Стандарт' AND data_gb = 8;

-- Обновляем тариф "Премиум" (25 ГБ -> 50 ГБ) - цена 3000 ₽
UPDATE esim_plans 
SET data_gb = 50, price_rub = 3000.00 
WHERE name = 'Премиум' AND data_gb = 25;

-- Проверяем результат
SELECT id, name, data_gb, price_rub, is_popular 
FROM esim_plans 
ORDER BY id;