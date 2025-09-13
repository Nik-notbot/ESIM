# 🔒 Восстановление безопасности RLS

## ✅ Статус: Админ панель работает!

Теперь нужно восстановить безопасность базы данных.

## 🚀 Шаг 1: Включить RLS обратно

**Выполните в Supabase SQL Editor:**

```sql
-- Восстановление RLS безопасности для таблицы qr_codes
-- 1. Включаем RLS обратно
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 2. Создаем правильные политики безопасности
CREATE POLICY "Allow service role full access" ON qr_codes 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access" ON qr_codes 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous read" ON qr_codes 
FOR SELECT USING (true);

-- 3. Проверяем что политики созданы
SELECT 'RLS включен' as status, 
       schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- 4. Проверяем политики
SELECT 'Политики созданы' as status, 
       COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'qr_codes';
```

**ИЛИ** выполните готовый файл `restore_rls_security.sql`

## 🧪 Шаг 2: Протестировать админ панель

После выполнения SQL:

1. **Откройте админ панель** - `https://heyesim.me/admin-qr-upload.html`
2. **Войдите в систему** с паролем `JlHhWO2hoU2`
3. **Попробуйте добавить QR-код** - должно работать
4. **Проверьте список QR-кодов** - должен загружаться

## 🔍 Шаг 3: Проверить основной сайт

1. **Откройте главную страницу** - `https://heyesim.me/`
2. **Попробуйте купить eSIM** - должно работать
3. **Проверьте процесс оплаты** - должен работать
4. **Проверьте получение QR-кода** - должно работать

## ✅ Результат

После выполнения всех шагов:
- ✅ **Админ панель** работает стабильно
- ✅ **Основной сайт** работает как раньше  
- ✅ **Безопасность** восстановлена
- ✅ **RLS политики** настроены правильно

## 🚨 Если что-то сломается

Если после включения RLS админ панель перестанет работать:

1. **Временно отключите RLS:**
   ```sql
   ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
   ```

2. **Сообщите о проблеме** - мы исправим политики

## 🎯 Следующие шаги

После стабилизации можно:
- Настроить уведомления о продажах
- Добавить статистику продаж
- Улучшить интерфейс админ панели