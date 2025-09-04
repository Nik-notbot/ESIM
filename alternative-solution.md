# Альтернативные решения для обхода блокировок

## Проблема
Серверы Netlify не могут подключиться к Wata API и Supabase, вероятно из-за региональных ограничений.

## Решение 1: Использовать Vercel вместо Netlify

1. Создайте аккаунт на [Vercel](https://vercel.com)
2. Импортируйте ваш GitHub репозиторий
3. Vercel Functions работают аналогично Netlify Functions
4. Серверы Vercel могут быть в других регионах

## Решение 2: Альтернативные сервисы

### Вместо Supabase:
1. **Firebase Firestore** (Google)
   - Бесплатный план достаточный
   - Хорошая документация
   - Работает везде

2. **PlanetScale** 
   - MySQL совместимая БД
   - Бесплатный план
   - Serverless

3. **Локальное решение**
   - Использовать Google Sheets как БД
   - Или Airtable API

### Вместо Wata для платежей:

1. **YooKassa (Яндекс.Касса)**
   ```javascript
   const YOOKASSA_SHOP_ID = 'ваш_shop_id';
   const YOOKASSA_SECRET_KEY = 'ваш_secret_key';
   
   // Создание платежа
   const payment = await fetch('https://api.yookassa.ru/v3/payments', {
     method: 'POST',
     headers: {
       'Authorization': 'Basic ' + btoa(YOOKASSA_SHOP_ID + ':' + YOOKASSA_SECRET_KEY),
       'Content-Type': 'application/json',
       'Idempotence-Key': uuidv4()
     },
     body: JSON.stringify({
       amount: { value: "990.00", currency: "RUB" },
       confirmation: { type: "redirect", return_url: "https://heyesim.me/success" },
       capture: true,
       description: "eSIM тариф"
     })
   });
   ```

2. **CloudPayments**
   - Поддерживает криптовалюты
   - Простая интеграция
   - Работает с российскими картами

3. **Cryptomus**
   - Прием криптовалют
   - Конвертация в рубли
   - Простое API

## Решение 3: Прокси-сервер

Развернуть простой прокси на VPS:

```javascript
// proxy-server.js на вашем VPS
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Прокси для Supabase
app.all('/supabase/*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `https://nwcleyhnbzxetcqtlim.supabase.co${req.path.replace('/supabase', '')}`,
      headers: {
        ...req.headers,
        host: 'nwcleyhnbzxetcqtlim.supabase.co'
      },
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Прокси для Wata
app.all('/wata/*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `https://api.wata.pro${req.path.replace('/wata', '')}`,
      headers: {
        ...req.headers,
        host: 'api.wata.pro'
      },
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(3000);
```

## Решение 4: Полностью статичное решение

1. Предзагрузить QR-коды в JSON файл
2. Использовать Google Forms для сбора заказов
3. Обрабатывать платежи вручную или через Telegram бота

## Рекомендация

Самое быстрое решение - перейти на **Vercel** или использовать **Firebase + YooKassa**.

Это позволит запустить проект без необходимости настройки сложной инфраструктуры.