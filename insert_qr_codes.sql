-- Примеры вставки QR-кодов для тарифа "Стандарт" (8 ГБ)
INSERT INTO qr_codes (plan_id, qr_url) VALUES
(1, 'https://ibb.co/TxNLKx3x'),
(1, 'https://ibb.co/ABC123456'),
(1, 'https://ibb.co/DEF789012'),
(1, 'https://ibb.co/GHI345678'),
(1, 'https://ibb.co/JKL901234');

-- Примеры вставки QR-кодов для тарифа "Премиум" (25 ГБ)
INSERT INTO qr_codes (plan_id, qr_url) VALUES
(2, 'https://ibb.co/MNO567890'),
(2, 'https://ibb.co/PQR123456'),
(2, 'https://ibb.co/STU789012'),
(2, 'https://ibb.co/VWX345678'),
(2, 'https://ibb.co/YZA901234');

-- Проверка вставленных данных
SELECT 
    qc.id,
    qc.qr_url,
    ep.name as plan_name,
    ep.data_gb,
    qc.is_used
FROM qr_codes qc
JOIN esim_plans ep ON qc.plan_id = ep.id
ORDER BY ep.id, qc.id;