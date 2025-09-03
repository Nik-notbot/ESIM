// Обработчик webhook от платежной системы WATA
// Этот файл должен быть размещен на сервере и доступен по URL, указанному в конфигурации

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Загружаем конфигурацию
let config;
try {
    config = require('../config.js');
} catch (e) {
    console.log('Using environment variables for configuration');
    config = {
        supabase: {
            url: process.env.SUPABASE_URL,
            serviceKey: process.env.SUPABASE_SERVICE_KEY
        },
        wata: {
            webhookSecret: process.env.WATA_WEBHOOK_SECRET
        },
        qrCodes: process.env.QR_CODES ? process.env.QR_CODES.split(',') : []
    };
}

// Инициализация Supabase с сервисным ключом
const supabase = createClient(
    process.env.SUPABASE_URL || config.supabase.url,
    process.env.SUPABASE_SERVICE_KEY || config.supabase.serviceKey
);

// Middleware для Express
const webhookHandler = async (req, res) => {
    try {
        // Проверяем подпись webhook (если поддерживается API)
        const signature = req.headers['x-webhook-signature'];
        if (signature && config.wata.webhookSecret) {
            const hash = crypto
                .createHmac('sha256', config.wata.webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');
                
            if (hash !== signature) {
                console.error('Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        
        // Получаем данные о платеже
        const { paymentId, status, orderId, amount } = req.body;
        
        console.log('Webhook received:', { paymentId, status, orderId });
        
        // Обновляем статус заказа в базе данных
        const { data: order, error: updateError } = await supabase
            .from('orders')
            .update({
                status: mapPaymentStatus(status),
                paid_at: status === 'SUCCESS' ? new Date().toISOString() : null
            })
            .eq('payment_id', paymentId)
            .select()
            .single();
            
        if (updateError) {
            console.error('Error updating order:', updateError);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Если платеж успешный, назначаем QR-код
        if (status === 'SUCCESS' && order) {
            await assignQRCodeToOrder(order.id);
        }
        
        // Отправляем уведомление в Telegram (опционально)
        if (status === 'SUCCESS' && order) {
            await sendTelegramNotification(order);
        }
        
        res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Маппинг статусов платежной системы на наши статусы
function mapPaymentStatus(wataStatus) {
    const statusMap = {
        'PENDING': 'pending',
        'PROCESSING': 'processing',
        'SUCCESS': 'paid',
        'FAILED': 'failed',
        'CANCELLED': 'cancelled'
    };
    
    return statusMap[wataStatus] || 'pending';
}

// Назначение QR-кода заказу
async function assignQRCodeToOrder(orderId) {
    try {
        // Проверяем, есть ли уже QR-код
        const { data: existingQR } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
        if (existingQR) {
            console.log('QR code already assigned to order:', orderId);
            return;
        }
        
        // Получаем случайный неиспользованный QR-код
        const randomQR = config.qrCodes[Math.floor(Math.random() * config.qrCodes.length)];
        
        // Создаем запись о QR-коде
        const { error: qrError } = await supabase
            .from('qr_codes')
            .insert({
                order_id: orderId,
                qr_url: randomQR,
                is_used: true,
                used_at: new Date().toISOString()
            });
            
        if (qrError) throw qrError;
        
        // Обновляем заказ
        await supabase
            .from('orders')
            .update({
                qr_code_url: randomQR
            })
            .eq('id', orderId);
            
        console.log('QR code assigned to order:', orderId);
        
    } catch (error) {
        console.error('Error assigning QR code:', error);
    }
}

// Отправка уведомления в Telegram (опционально)
async function sendTelegramNotification(order) {
    try {
        // Получаем информацию о покупателе
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', order.customer_id)
            .single();
            
        if (!customer || !customer.telegram_username) {
            return;
        }
        
        // Здесь можно добавить интеграцию с Telegram Bot API
        // для отправки уведомления покупателю
        console.log('Telegram notification would be sent to:', customer.telegram_username);
        
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

// Экспорт для использования в Express приложении
module.exports = webhookHandler;

// Если файл запускается напрямую, создаем простой сервер
if (require.main === module) {
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Webhook endpoint
    app.post('/api/webhook', webhookHandler);
    
    // Error handling
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Webhook server listening on port ${PORT}`);
        console.log(`Health check available at http://localhost:${PORT}/health`);
    });
}