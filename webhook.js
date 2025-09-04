// Это серверный код для обработки webhook от Wata
// Нужно развернуть на сервере с Node.js (например, Vercel, Netlify Functions, или свой сервер)

const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase с service role key (НЕ используйте anon key для серверных операций!)
// Service role key нужно получить из настроек проекта Supabase
const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM4MTM4NSwiZXhwIjoyMDYyOTU3Mzg1fQ.a5O7rS9bdXtADv4fS1OAQZP4uPZjKmpRqNKr-E98elw'; // Замените на реальный service role key!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Обработчик webhook
async function handleWebhook(request, response) {
    try {
        // Получаем данные от Wata
        const webhookData = request.body;
        
        console.log('Получен webhook от Wata:', webhookData);
        
        // Проверяем тип события
        const { Event, PaymentId, OrderId, Status, Amount } = webhookData;
        
        if (!OrderId) {
            return response.status(400).json({ error: 'OrderId not found' });
        }
        
        // Записываем событие в историю
        await supabase
            .from('payment_history')
            .insert({
                order_id: OrderId,
                event_type: Event || Status,
                payment_data: webhookData
            });
        
        // Обрабатываем успешную оплату
        if (Event === 'payment.succeeded' || Status === 'Succeeded') {
            // Получаем заказ
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', OrderId)
                .single();
                
            if (orderError || !order) {
                console.error('Заказ не найден:', OrderId);
                return response.status(404).json({ error: 'Order not found' });
            }
            
            // Если заказ уже оплачен, не обрабатываем повторно
            if (order.status === 'paid') {
                return response.status(200).json({ message: 'Already processed' });
            }
            
            // Находим свободный QR-код для данного тарифа
            const { data: qrCode, error: qrError } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('plan_id', order.plan_id)
                .eq('is_used', false)
                .limit(1)
                .single();
                
            if (qrError || !qrCode) {
                console.error('Нет доступных QR-кодов для тарифа:', order.plan_id);
                // Здесь можно отправить уведомление администратору
                return response.status(500).json({ error: 'No available QR codes' });
            }
            
            // Начинаем транзакцию
            // Помечаем QR-код как использованный
            const { error: qrUpdateError } = await supabase
                .from('qr_codes')
                .update({
                    is_used: true,
                    used_by_order_id: OrderId,
                    used_at: new Date().toISOString()
                })
                .eq('id', qrCode.id);
                
            if (qrUpdateError) {
                console.error('Ошибка обновления QR-кода:', qrUpdateError);
                return response.status(500).json({ error: 'Failed to update QR code' });
            }
            
            // Обновляем заказ
            const { error: orderUpdateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    qr_code_id: qrCode.id,
                    payment_id: PaymentId,
                    paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', OrderId);
                
            if (orderUpdateError) {
                console.error('Ошибка обновления заказа:', orderUpdateError);
                // Откатываем изменения QR-кода
                await supabase
                    .from('qr_codes')
                    .update({
                        is_used: false,
                        used_by_order_id: null,
                        used_at: null
                    })
                    .eq('id', qrCode.id);
                    
                return response.status(500).json({ error: 'Failed to update order' });
            }
            
            // Отправляем email с QR-кодом (если есть email сервис)
            if (order.customer_email) {
                // await sendEmailWithQRCode(order.customer_email, qrCode.qr_url, order);
                console.log(`Email должен быть отправлен на ${order.customer_email} с QR: ${qrCode.qr_url}`);
            }
            
            console.log(`Заказ ${OrderId} успешно оплачен и обработан`);
            
        } else if (Event === 'payment.failed' || Status === 'Failed') {
            // Обновляем статус заказа на failed
            await supabase
                .from('orders')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', OrderId);
                
            console.log(`Платеж для заказа ${OrderId} не прошел`);
        }
        
        // Отправляем успешный ответ Wata
        response.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Ошибка обработки webhook:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

// Экспорт для различных платформ
module.exports = { handleWebhook };

// Для Vercel
module.exports.default = handleWebhook;

// Для Express
// app.post('/webhook/wata', handleWebhook);
