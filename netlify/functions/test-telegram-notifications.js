// Функция для тестирования уведомлений нескольким пользователям
// Используется для проверки настроек Telegram

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Получаем настройки Telegram
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatIds = process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID;

        // Проверяем конфигурацию
        const config = {
            hasBotToken: !!telegramBotToken,
            hasChatIds: !!telegramChatIds,
            chatIds: telegramChatIds ? telegramChatIds.split(',').map(id => id.trim()).filter(id => id) : [],
            totalRecipients: 0
        };

        if (config.chatIds.length > 0) {
            config.totalRecipients = config.chatIds.length;
        }

        // Если все настроено, отправляем тестовое уведомление
        if (config.hasBotToken && config.hasChatIds && config.chatIds.length > 0) {
            const testMessage = `🧪 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b>

✅ <b>Система уведомлений работает!</b>
👥 <b>Получателей:</b> ${config.totalRecipients}
⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}

🎯 <i>Если вы видите это сообщение, настройка прошла успешно!</i>`;

            const results = [];
            const errors = [];

            for (const chatId of config.chatIds) {
                try {
                    const response = await fetch(
                        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: testMessage,
                                parse_mode: 'HTML',
                                disable_web_page_preview: true
                            })
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        errors.push({ chatId, error: errorText });
                    } else {
                        const result = await response.json();
                        results.push({ 
                            chatId, 
                            messageId: result.message_id,
                            success: true 
                        });
                    }
                } catch (error) {
                    errors.push({ chatId, error: error.message });
                }
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Test notification sent',
                    config: config,
                    results: results,
                    errors: errors,
                    summary: {
                        total_recipients: config.totalRecipients,
                        successful: results.length,
                        failed: errors.length
                    }
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Telegram not configured',
                    config: config,
                    instructions: {
                        setup_required: !config.hasBotToken || !config.hasChatIds,
                        missing_bot_token: !config.hasBotToken,
                        missing_chat_ids: !config.hasChatIds,
                        no_valid_chat_ids: config.chatIds.length === 0
                    }
                })
            };
        }

    } catch (error) {
        console.error('Test notification error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Test failed',
                message: error.message 
            })
        };
    }
};