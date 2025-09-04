# Устранение ошибки "Failed to fetch"

## 1. Откройте тестовую страницу
Откройте файл `test-supabase.html` в браузере и последовательно нажмите все кнопки тестирования.

## 2. Проверьте консоль браузера
Откройте консоль разработчика (F12) и посмотрите подробные ошибки.

## 3. Основные причины ошибки и решения:

### A. CORS проблемы
**Проблема**: Supabase блокирует запросы с вашего домена.

**Решение**:
1. Зайдите в Supabase Dashboard
2. Settings → API → CORS Settings
3. Добавьте ваш домен:
   - Для локальной разработки: `http://localhost:3000`, `http://127.0.0.1:5500`
   - Для продакшена: `https://ваш-домен.com`

### B. RLS (Row Level Security) политики
**Проблема**: Таблицы защищены политиками безопасности.

**Решение**:
1. Выполните SQL из файла `supabase_rls_policies.sql` в SQL Editor Supabase
2. Или временно отключите RLS:
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE esim_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
```

### C. Неправильные ключи API
**Проблема**: Используется неверный ключ.

**Решение**:
1. Проверьте в Settings → API
2. Используйте `anon` ключ для клиентской части
3. `service_role` ключ только для сервера!

### D. Таблицы не созданы
**Проблема**: Таблицы в БД отсутствуют.

**Решение**:
1. Выполните SQL из `database_schema.sql`
2. Проверьте в Table Editor наличие всех таблиц

### E. Локальный файл без сервера
**Проблема**: Открываете HTML файл напрямую (file://).

**Решение**:
1. Используйте локальный сервер:
   - VS Code: Live Server расширение
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`

## 4. Дополнительная отладка

Добавьте в начало `payment.js`:
```javascript
// Тест подключения при загрузке
supabase.from('esim_plans').select('count').single()
  .then(({data, error}) => {
    if (error) {
      console.error('Ошибка подключения к Supabase:', error);
      alert('Проблема с подключением к базе данных. Проверьте консоль.');
    } else {
      console.log('Supabase подключен успешно');
    }
  });
```

## 5. Проверочный чек-лист

- [ ] Сайт открыт через http:// или https://, а не file://
- [ ] В Supabase добавлен ваш домен в CORS
- [ ] Таблицы созданы в базе данных
- [ ] RLS политики настроены или отключены
- [ ] Используется правильный anon ключ
- [ ] В таблице esim_plans есть записи
- [ ] В таблице qr_codes есть неиспользованные QR-коды