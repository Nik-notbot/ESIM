// Netlify Function для обработки вебхуков от Wata
// Эта функция будет вызываться когда пользователь завершит оплату

// Конфигурация - проект esim-store
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wiwkergsvbgnrdslqkzg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2tlcmdzdmJnbnJkc2xxa3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk5MDkyMCwiZXhwIjoyMDcyNTY2OTIwfQ.RJPwoAVUNzIbG7yGTm-hS2wNrBelhaQ5k57cpQLXZj8'; // service_role key для вебхуков

// Получаем fetch для Node.js
const fetch = globalThis.fetch || require('node-fetch');

exports.handler = async (event, context) => {
    // Только POST запросы
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Парсим данные вебхука
        const webhookData = JSON.parse(event.body);
        console.log('Получен вебхук:', webhookData);
        
        // Извлекаем данные платежа
        const { 
            orderId,
            paymentId,
            status,
            amount,
            currency
        } = webhookData;
        
        if (!orderId || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }
        
        // Определяем статус для нашей БД
        let orderStatus = 'pending';
        if (status === 'Success' || status === 'Succeeded') {
            orderStatus = 'paid';
        } else if (status === 'Failed' || status === 'Declined') {
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
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};