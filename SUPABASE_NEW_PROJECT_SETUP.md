# Настройка нового проекта Supabase для eSIM Store

## Шаг 1: Создание проекта

1. Зайдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub
4. Нажмите "New project"
5. Заполните:
   - **Name**: esim-store
   - **Database Password**: [сохраните надежный пароль]
   - **Region**: выберите ближайший (Frankfurt, London)
   - **Pricing Plan**: Free tier
6. Нажмите "Create new project" и подождите ~2 минуты

## Шаг 2: Получение ключей

После создания проекта:
1. Зайдите в Settings → API
2. Скопируйте:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (держите в секрете!)

## Шаг 3: Создание таблиц

В Supabase Dashboard → SQL Editor выполните:

```sql
-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица тарифов eSIM
CREATE TABLE esim_plans (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    data_gb INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Вставляем тарифы
INSERT INTO esim_plans (id, name, data_gb, price, description) VALUES
(1, 'Стандарт', 8, 100, 'Базовый тариф для путешественников'),
(2, 'Премиум', 25, 100, 'Расширенный тариф для активных пользователей');

-- Таблица QR-кодов
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id INT REFERENCES esim_plans(id),
    qr_url TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Таблица заказов
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id INT REFERENCES esim_plans(id),
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_id TEXT,
    payment_url TEXT,
    qr_code_id UUID REFERENCES qr_codes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Индексы для быстрого поиска
CREATE INDEX idx_qr_codes_plan_used ON qr_codes(plan_id, is_used);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
```

## Шаг 4: Настройка безопасности (RLS)

```sql
-- Включаем Row Level Security
ALTER TABLE esim_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики для esim_plans (только чтение)
CREATE POLICY "Тарифы доступны всем для чтения" 
ON esim_plans FOR SELECT 
USING (true);

-- Политики для orders (создание и чтение)
CREATE POLICY "Пользователи могут создавать заказы" 
ON orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Пользователи могут читать свои заказы" 
ON orders FOR SELECT 
USING (true);

CREATE POLICY "Система может обновлять заказы" 
ON orders FOR UPDATE 
USING (true);

-- Политики для qr_codes (только чтение и обновление системой)
CREATE POLICY "Система может читать QR коды" 
ON qr_codes FOR SELECT 
USING (true);

CREATE POLICY "Система может обновлять QR коды" 
ON qr_codes FOR UPDATE 
USING (true);
```

## Шаг 5: Настройка CORS

1. В Supabase Dashboard → Authentication → URL Configuration
2. Добавьте в "Site URL": `https://heyesim.me`
3. В "Redirect URLs" добавьте:
   - `https://heyesim.me`
   - `http://localhost:*`
   - `https://*.netlify.app`

## Шаг 6: Функция для получения QR-кода

Создайте функцию в SQL Editor:

```sql
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
            order_id = p_order_id::TEXT
        WHERE id = v_qr_id;
        
        -- Обновляем заказ
        UPDATE orders
        SET qr_code_id = v_qr_id,
            status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        RETURN QUERY SELECT v_qr_id, v_qr_url;
    END IF;
    
    RETURN;
END;
$$;
```

## Шаг 7: Тестовые QR-коды

Добавьте несколько тестовых QR-кодов:

```sql
-- Тестовые QR для тарифа Стандарт (plan_id = 1)
INSERT INTO qr_codes (plan_id, qr_url) VALUES
(1, 'https://i.ibb.co/TxNLKx3x/qr-standard-001.png'),
(1, 'https://i.ibb.co/ABC123/qr-standard-002.png'),
(1, 'https://i.ibb.co/DEF456/qr-standard-003.png');

-- Тестовые QR для тарифа Премиум (plan_id = 2)
INSERT INTO qr_codes (plan_id, qr_url) VALUES
(2, 'https://i.ibb.co/GHI789/qr-premium-001.png'),
(2, 'https://i.ibb.co/JKL012/qr-premium-002.png'),
(2, 'https://i.ibb.co/MNO345/qr-premium-003.png');
```

## Шаг 8: Обновление переменных окружения

Создайте файл `.env` (не коммитьте его!):

```env
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

В Netlify Dashboard → Site settings → Environment variables добавьте те же переменные.

## Готово! 🎉

Теперь у вас есть:
- ✅ Новый проект Supabase
- ✅ Все необходимые таблицы
- ✅ Настроенная безопасность
- ✅ Функция автоматической выдачи QR-кодов
- ✅ CORS для вашего домена

Следующий шаг: обновить код сайта для работы с новой базой данных.