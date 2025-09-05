-- Простая функция для получения QR-кода без конфликтов имен

CREATE OR REPLACE FUNCTION get_available_qr_code(p_plan_id INT, p_order_id UUID)
RETURNS TABLE (
    qr_id UUID,
    qr_url TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    selected_qr_id UUID;
    selected_qr_url TEXT;
BEGIN
    -- Находим первый доступный QR для плана
    SELECT id, qr_url INTO selected_qr_id, selected_qr_url
    FROM qr_codes
    WHERE plan_id = p_plan_id 
      AND is_used = FALSE
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    -- Если нашли, помечаем как использованный
    IF selected_qr_id IS NOT NULL THEN
        UPDATE qr_codes 
        SET is_used = TRUE,
            used_at = NOW(),
            used_by_order_id = p_order_id
        WHERE id = selected_qr_id;
        
        -- Обновляем заказ
        UPDATE orders
        SET qr_code_id = selected_qr_id,
            status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Возвращаем результат
        RETURN QUERY SELECT selected_qr_id, selected_qr_url;
    END IF;
    
    RETURN;
END;
$$;