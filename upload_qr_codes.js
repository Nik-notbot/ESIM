// Скрипт для загрузки QR-кодов в Supabase
// Запускать локально: node upload_qr_codes.js

const { createClient } = require('@supabase/supabase-js');

// Настройки Supabase
const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Замените на service role key!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ваши QR-коды
const qrCodes = [
    // Для тарифа "Стандарт" (plan_id = 1)
    { plan_id: 1, qr_url: 'https://ibb.co/TxNLKx3x' },
    { plan_id: 1, qr_url: 'https://ibb.co/ABC123456' },
    { plan_id: 1, qr_url: 'https://ibb.co/DEF789012' },
    { plan_id: 1, qr_url: 'https://ibb.co/GHI345678' },
    { plan_id: 1, qr_url: 'https://ibb.co/JKL901234' },
    
    // Для тарифа "Премиум" (plan_id = 2)
    { plan_id: 2, qr_url: 'https://ibb.co/MNO567890' },
    { plan_id: 2, qr_url: 'https://ibb.co/PQR123456' },
    { plan_id: 2, qr_url: 'https://ibb.co/STU789012' },
    { plan_id: 2, qr_url: 'https://ibb.co/VWX345678' },
    { plan_id: 2, qr_url: 'https://ibb.co/YZA901234' },
];

async function uploadQRCodes() {
    console.log('Начинаем загрузку QR-кодов...');
    
    try {
        // Загружаем QR-коды пакетами
        const { data, error } = await supabase
            .from('qr_codes')
            .insert(qrCodes);
            
        if (error) {
            console.error('Ошибка при загрузке:', error);
            return;
        }
        
        console.log(`Успешно загружено ${qrCodes.length} QR-кодов`);
        
        // Проверяем статистику
        const { data: stats, error: statsError } = await supabase
            .from('qr_codes')
            .select('plan_id')
            .eq('is_used', false);
            
        if (!statsError && stats) {
            const plan1Count = stats.filter(item => item.plan_id === 1).length;
            const plan2Count = stats.filter(item => item.plan_id === 2).length;
            
            console.log('\nСтатистика доступных QR-кодов:');
            console.log(`Тариф "Стандарт": ${plan1Count} кодов`);
            console.log(`Тариф "Премиум": ${plan2Count} кодов`);
        }
        
    } catch (err) {
        console.error('Произошла ошибка:', err);
    }
}

// Запускаем загрузку
uploadQRCodes();