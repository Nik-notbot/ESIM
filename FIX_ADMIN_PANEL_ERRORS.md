# 🔧 Исправление ошибок админ панели

## ❌ **Проблемы:**

1. **Ошибка RLS**: `new row violates row-level security policy for table "qr_codes"`
2. **Ограничение поля**: Поле "Код страны" не принимает больше 3 символов

## ✅ **Решение:**

### **Шаг 1: Исправление базы данных**

Выполните в **Supabase SQL Editor**:

```sql
-- Комплексное исправление проблем админ панели
-- 1. Увеличиваем размер поля country_code
ALTER TABLE qr_codes 
ALTER COLUMN country_code TYPE VARCHAR(20);

-- 2. Удаляем старые RLS политики
DROP POLICY IF EXISTS "Allow authenticated read" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role modify" ON qr_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON qr_codes;
DROP POLICY IF EXISTS "Allow anonymous read" ON qr_codes;

-- 3. Включаем RLS для таблицы qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 4. Создаем новые RLS политики
-- Политика для service_role (для серверных функций)
CREATE POLICY "Allow service role full access" ON qr_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Политика для аутентифицированных пользователей (для админ панели)
CREATE POLICY "Allow authenticated users full access" ON qr_codes
    FOR ALL USING (auth.role() = 'authenticated');

-- Политика для анонимных пользователей (только чтение для клиентов)
CREATE POLICY "Allow anonymous read" ON qr_codes
    FOR SELECT USING (true);
```

**ИЛИ** выполните готовый файл `fix_admin_panel_issues.sql`

### **Шаг 2: Дождитесь деплоя**

Netlify автоматически задеплоит обновленную админ панель (убрано ограничение `maxlength="3"`).

## 🧪 **Тестирование:**

1. **Откройте админ панель**: `https://heyesim.me/admin-qr-upload.html`
2. **Введите пароль**: `JlHhWO2hoU2`
3. **Попробуйте добавить QR-код** с длинным кодом страны
4. **Проверьте**, что ошибка RLS исчезла

## 🔍 **Что исправлено:**

### **1. RLS политики:**
- ✅ **service_role** - полный доступ для серверных функций
- ✅ **authenticated** - полный доступ для админ панели
- ✅ **anonymous** - только чтение для клиентов

### **2. Поле country_code:**
- ✅ **Увеличено** с VARCHAR(10) до VARCHAR(20)
- ✅ **Убрано ограничение** maxlength="3" в HTML
- ✅ **Поддерживает** длинные коды стран

## 📋 **Примеры кодов стран:**

Теперь можно вводить:
- `DE` - Германия
- `US-CA` - Калифорния, США
- `GB-ENG` - Англия, Великобритания
- `EU-ROAMING` - Европейский роуминг
- `MULTI-REGION` - Мультирегиональный

## 🚨 **Если проблемы остались:**

### **Проверьте RLS политики:**
```sql
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'qr_codes';
```

### **Проверьте структуру таблицы:**
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'qr_codes';
```

### **Проверьте логи Netlify:**
1. Netlify Dashboard → Functions
2. Проверьте логи на наличие ошибок

## 🎯 **Готово!**

После выполнения SQL скрипта админ панель должна работать без ошибок.