// Конфигурация для работы с Supabase и платежной системой WATA

const config = {
    // Supabase конфигурация
    supabase: {
        url: 'YOUR_SUPABASE_URL', // Замените на ваш URL Supabase
        anonKey: 'YOUR_SUPABASE_ANON_KEY', // Замените на ваш анонимный ключ
        serviceKey: 'YOUR_SUPABASE_SERVICE_KEY' // Замените на ваш сервисный ключ (для серверных операций)
    },
    
    // WATA платежная система
    wata: {
        apiUrl: 'https://api.wata.pro',
        apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjEiLCJleHAiOjE3NTk0MTAxMjMsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.593TE4q83LRidOJmCbJhn3B-EhGMWOK_yZmsVDMhY6U',
        publicId: '3a1bf961-8cbc-bb0d-b2dc-3f145b5fb7e8',
        webhookSecret: 'YOUR_WEBHOOK_SECRET' // Замените на секрет для проверки webhook
    },
    
    // URL-адреса для редиректов
    urls: {
        success: '/success.html',
        fail: '/fail.html',
        webhook: '/api/webhook' // Endpoint для обработки webhook от платежной системы
    },
    
    // Предопределенные QR коды (замените на реальные)
    qrCodes: [
        'https://ibb.co/TxNLKx3x',
        // Добавьте больше QR кодов здесь
    ]
};

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}