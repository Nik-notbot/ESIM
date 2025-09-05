-- Исправленная функция для получения QR-кода
-- Проблема: колонка qr_url неоднозначна в RETURN QUERY

CREATE OR REPLACE FUNCTION get_available_qr_code(p_plan_id INT, p_order_id UUID)
RETURNS TABLE (
    qr_id UUID,
    qr_url TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_qr_id UUID;
    v_qr_url TEXT;
BEGIN
    -- Находим первый доступный QR для плана
    SELECT id, qr_url INTO v_qr_id, v_qr_url
    FROM qr_codes
    WHERE plan_id = p_plan_id 
      AND is_used = FALSE
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    -- Если нашли, помечаем как использованный
    IF v_qr_id IS NOT NULL THEN
        UPDATE qr_codes 
        SET is_used = TRUE,
            used_at = NOW(),
            used_by_order_id = p_order_id
        WHERE id = v_qr_id;
        
        -- Обновляем заказ
        UPDATE orders
        SET qr_code_id = v_qr_id,
            status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Возвращаем результат с явным указанием колонок
        RETURN QUERY SELECT v_qr_id::UUID, v_qr_url::TEXT;
    END IF;
    
    RETURN;
END;
$$;