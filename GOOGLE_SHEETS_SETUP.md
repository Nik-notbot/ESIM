# Настройка Google Sheets для хранения QR-кодов

## Преимущества:
- ✅ Бесплатно
- ✅ Легко управлять через таблицу
- ✅ Не нужен сервер
- ✅ Автоматическая синхронизация

## Шаги настройки:

### 1. Создайте Google Таблицу
1. Зайдите в [Google Sheets](https://sheets.google.com)
2. Создайте новую таблицу
3. Назовите её "eSIM QR Codes"

### 2. Структура таблицы
Создайте колонки:
- A: ID (например: qr_001)
- B: Plan (1 для Стандарт, 2 для Премиум)
- C: QR_URL (ссылка на изображение)
- D: Used (TRUE/FALSE)
- E: Used_Date (дата использования)
- F: Order_ID (номер заказа)

### 3. Настройте Google Apps Script
1. В таблице: Расширения → Apps Script
2. Вставьте код:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Параметры запроса
  const action = e.parameter.action;
  const planId = e.parameter.planId;
  
  if (action === 'getAvailable') {
    // Находим первый доступный QR для плана
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] == planId && data[i][3] === false) {
        // Помечаем как использованный
        sheet.getRange(i + 1, 4).setValue(true);
        sheet.getRange(i + 1, 5).setValue(new Date());
        sheet.getRange(i + 1, 6).setValue(e.parameter.orderId);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            qr: {
              id: data[i][0],
              url: data[i][2]
            }
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'No QR codes available'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Получить статистику
  if (action === 'stats') {
    let stats = {
      plan1: { total: 0, used: 0, available: 0 },
      plan2: { total: 0, used: 0, available: 0 }
    };
    
    for (let i = 1; i < data.length; i++) {
      const plan = data[i][1] == 1 ? 'plan1' : 'plan2';
      stats[plan].total++;
      if (data[i][3] === true) {
        stats[plan].used++;
      } else {
        stats[plan].available++;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(stats))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'add') {
    // Добавляем новый QR
    sheet.appendRow([
      data.id,
      data.planId,
      data.url,
      false,
      '',
      ''
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Сохраните и разверните:
   - Нажмите "Развернуть" → "Новое развертывание"
   - Тип: Веб-приложение
   - Доступ: Любой пользователь
   - Скопируйте URL веб-приложения

### 4. Обновите код сайта
Замените URL в коде на ваш Google Apps Script URL.

## Альтернатива: JSON файл в репозитории

Если не хотите использовать Google Sheets, можно хранить QR-коды прямо в репозитории:

1. Создайте файл `qr-codes-database.json`
2. Обновляйте через GitHub
3. Netlify автоматически задеплоит изменения

Что выбираете?