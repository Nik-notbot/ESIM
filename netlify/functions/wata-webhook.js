// Netlify Function для обработки вебхуков от Wata
// Эта функция будет вызываться когда пользователь завершит оплату

// Конфигурация - проект esim-store
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wiwkergsvbgnrdslqkzg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2tlcmdzdmJnbnJkc2xxa3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk5MDkyMCwiZXhwIjoyMDcyNTY2OTIwfQ.RJPwoAVUNzIbG7yGTm-hS2wNrBelhaQ5k57cpQLXZj8'; // service_role key для вебхуков

// Секретный ключ для проверки подписи Wata
const WATA_WEBHOOK_SECRET = process.env.WATA_WEBHOOK_SECRET || 'your-webhook-secret-here';

// Получаем fetch для Node.js
const fetch = globalThis.fetch || require('node-fetch');

// Функция для проверки подписи Wata
function verifyWataSignature(payload, signature, secret) {
    if (!signature || !secret) {
        console.log('No signature or secret provided, skipping verification');
        return true; // Пропускаем проверку если нет подписи
    }
    
    try {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload, 'utf8')
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    // CORS заголовки
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запросов
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Только POST запросы
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Логируем входящий запрос
        console.log('Webhook received:', {
            method: event.httpMethod,
            headers: event.headers,
            body: event.body
        });

        // Проверяем наличие тела запроса
        if (!event.body) {
            console.error('Empty request body');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Empty request body' })
            };
        }

        // Проверяем подпись Wata (если есть)
        const signature = event.headers['x-wata-signature'] || event.headers['X-Wata-Signature'];
        if (signature && !verifyWataSignature(event.body, signature, WATA_WEBHOOK_SECRET)) {
            console.error('Invalid signature');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid signature' })
            };
        }

        // Парсим данные вебхука
        let webhookData;
        try {
            webhookData = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON format' })
            };
        }
        
        console.log('Parsed webhook data:', webhookData);
        
        // Извлекаем данные платежа согласно формату Wata API
        // Формат Wata: { order_uuid, amount, status, order_id, paid_date_msk, hash }
        const orderId = webhookData.order_uuid || webhookData.order_id || webhookData.orderId || webhookData.id;
        const paymentId = webhookData.payment_id || webhookData.paymentId || webhookData.transaction_id;
        const status = webhookData.status || webhookData.state || webhookData.payment_status;
        const amount = webhookData.amount || webhookData.total || webhookData.sum;
        const currency = webhookData.currency || webhookData.currency_code || 'RUB';
        const paidDate = webhookData.paid_date_msk || webhookData.paid_date || webhookData.created_at;
        const hash = webhookData.hash;
        
        console.log('Extracted data:', { orderId, paymentId, status, amount, currency, paidDate, hash });
        
        if (!orderId || !status) {
            console.error('Missing required fields:', { orderId, status });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    received: { orderId, status },
                    fullData: webhookData
                })
            };
        }
        
        // Определяем статус для нашей БД согласно Wata API
        let orderStatus = 'pending';
        if (status === 'Paid' || status === 'Success' || status === 'Succeeded') {
            orderStatus = 'paid';
        } else if (status === 'Failed' || status === 'Declined' || status === 'Cancelled') {
            orderStatus = 'failed';
        }
        
        console.log(`Обновляем заказ ${orderId} - статус: ${orderStatus}`);
        
        // Обновляем статус заказа в Supabase
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    status: orderStatus,
                    payment_id: paymentId,
                    updated_at: new Date().toISOString()
                })
            }
        );
        
        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('Ошибка обновления заказа:', error);
            throw new Error('Failed to update order');
        }
        
        const updatedOrder = await updateResponse.json();
        console.log('Заказ обновлен:', updatedOrder);
        
        // Если оплата успешна и нет QR-кода, пытаемся назначить
        if (orderStatus === 'paid' && updatedOrder.length > 0 && !updatedOrder[0].qr_code_id) {
            console.log('Назначаем QR-код для заказа...');
            
            // Вызываем функцию назначения QR-кода
            const qrResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_available_qr_code`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_plan_id: updatedOrder[0].plan_id,
                        p_order_id: orderId
                    })
                }
            );
            
            if (qrResponse.ok) {
                console.log('QR-код успешно назначен');
            } else {
                console.log('Не удалось назначить QR-код:', await qrResponse.text());
            }
        }

        // Отправляем уведомление о продаже (только при успешной оплате)
        if (orderStatus === 'paid' && updatedOrder.length > 0) {
            console.log('Отправляем уведомление о продаже...');
            
            try {
                // Получаем полную информацию о заказе с планом
                const fullOrderResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*,esim_plans(*)`,
                    {
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (fullOrderResponse.ok) {
                    const fullOrderData = await fullOrderResponse.json();
                    if (fullOrderData.length > 0) {
                        // Отправляем уведомление в Telegram
                        const notificationResponse = await fetch(
                            `${process.env.URL || 'https://heyesim.me'}/.netlify/functions/send-telegram-notification`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    orderData: fullOrderData[0],
                                    notificationType: 'sale'
                                })
                            }
                        );

                        if (notificationResponse.ok) {
                            console.log('Уведомление о продаже отправлено');
                        } else {
                            console.log('Не удалось отправить уведомление о продаже');
                        }
                    }
                }
            } catch (notificationError) {
                console.error('Ошибка отправки уведомления:', notificationError);
                // Не прерываем выполнение из-за ошибки уведомления
            }
        }
        
        // Возвращаем успешный ответ
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Webhook processed successfully',
                orderId: orderId,
                status: orderStatus
            })
        };
        
    } catch (error) {
        console.error('Ошибка обработки вебхука:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};