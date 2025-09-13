// Функция для отправки уведомлений в Telegram
// Используется для уведомлений о продажах

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { orderData, notificationType = 'sale' } = JSON.parse(event.body);

        // Получаем настройки Telegram из переменных окружения
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramBotToken || !telegramChatId) {
            console.log('Telegram not configured, skipping notification');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Telegram not configured, notification skipped' 
                })
            };
        }

        // Формируем сообщение в зависимости от типа уведомления
        let message = '';
        
        if (notificationType === 'sale') {
            message = formatSaleNotification(orderData);
        } else if (notificationType === 'error') {
            message = formatErrorNotification(orderData);
        } else {
            message = formatGenericNotification(orderData);
        }

        // Отправляем сообщение в Telegram
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            }
        );

        if (!telegramResponse.ok) {
            const errorText = await telegramResponse.text();
            console.error('Telegram API error:', errorText);
            throw new Error('Failed to send Telegram notification');
        }

        const telegramResult = await telegramResponse.json();
        console.log('Telegram notification sent:', telegramResult.message_id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Notification sent successfully',
                telegram_message_id: telegramResult.message_id
            })
        };

    } catch (error) {
        console.error('Error sending notification:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to send notification',
                message: error.message 
            })
        };
    }
};

// Форматирование уведомления о продаже
function formatSaleNotification(orderData) {
    const {
        id: orderId,
        customer_email,
        customer_phone,
        amount,
        currency = 'RUB',
        esim_plans,
        created_at
    } = orderData;

    const orderTime = new Date(created_at).toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `🛒 <b>НОВАЯ ПРОДАЖА eSIM!</b>

📋 <b>Заказ:</b> #${orderId.substring(0, 8)}
💰 <b>Сумма:</b> ${amount} ${currency}
📧 <b>Email:</b> ${customer_email || 'Не указан'}
📞 <b>Телефон:</b> ${customer_phone || 'Не указан'}
🎯 <b>Тариф:</b> ${esim_plans?.name || 'Неизвестно'} (${esim_plans?.data_gb || '?'} ГБ)
⏰ <b>Время:</b> ${orderTime}

💡 <i>Проверьте админ панель для деталей</i>`;
}

// Форматирование уведомления об ошибке
function formatErrorNotification(errorData) {
    return `⚠️ <b>ОШИБКА В СИСТЕМЕ</b>

🔍 <b>Тип:</b> ${errorData.type || 'Неизвестная ошибка'}
📝 <b>Описание:</b> ${errorData.message || 'Нет описания'}
⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}

🚨 <i>Требуется проверка системы</i>`;
}

// Форматирование общего уведомления
function formatGenericNotification(data) {
    return `📢 <b>УВЕДОМЛЕНИЕ СИСТЕМЫ</b>

📝 <b>Сообщение:</b> ${data.message || 'Нет сообщения'}
⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
}