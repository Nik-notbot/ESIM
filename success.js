// Инициализация Supabase
const supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);

// Получение параметров из URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order');

// Элементы страницы
const qrLoading = document.getElementById('qrLoading');
const qrImage = document.getElementById('qrImage');
const downloadButton = document.getElementById('downloadButton');
const errorState = document.getElementById('errorState');
const orderIdEl = document.getElementById('orderId');

// Загрузка информации о заказе и QR-коде
async function loadOrderInfo() {
    if (!orderId) {
        showError('Номер заказа не указан');
        return;
    }
    
    orderIdEl.textContent = orderId;
    
    try {
        // Загружаем информацию о заказе
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, qr_codes(*)')
            .eq('id', orderId)
            .single();
            
        if (orderError) throw orderError;
        
        if (!order) {
            showError('Заказ не найден');
            return;
        }
        
        // Проверяем статус оплаты
        if (order.status !== 'paid') {
            // Если статус еще не обновился, проверяем через API
            await checkPaymentStatus(order);
            return;
        }
        
        // Если QR-код уже есть в базе, отображаем его
        if (order.qr_codes && order.qr_codes.length > 0) {
            displayQRCode(order.qr_codes[0].qr_url);
        } else if (order.qr_code_url) {
            displayQRCode(order.qr_code_url);
        } else {
            // Если QR-кода нет, генерируем его
            await assignQRCode(order.id);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        showError('Ошибка загрузки информации о заказе');
    }
}

// Проверка статуса платежа через API
async function checkPaymentStatus(order) {
    try {
        // Здесь должна быть проверка через API WATA
        // Для демонстрации просто ждем и проверяем снова
        setTimeout(() => {
            loadOrderInfo();
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка проверки статуса:', error);
        showError('Ошибка проверки статуса платежа');
    }
}

// Назначение QR-кода заказу
async function assignQRCode(orderId) {
    try {
        // Получаем случайный QR-код из предопределенного списка
        const randomQR = config.qrCodes[Math.floor(Math.random() * config.qrCodes.length)];
        
        // Создаем запись о QR-коде
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .insert({
                order_id: orderId,
                qr_url: randomQR,
                is_used: true,
                used_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (qrError) throw qrError;
        
        // Обновляем заказ
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                qr_code_url: randomQR
            })
            .eq('id', orderId);
            
        if (updateError) throw updateError;
        
        displayQRCode(randomQR);
        
    } catch (error) {
        console.error('Ошибка назначения QR-кода:', error);
        showError('Ошибка генерации QR-кода');
    }
}

// Отображение QR-кода
function displayQRCode(qrUrl) {
    qrLoading.style.display = 'none';
    qrImage.src = qrUrl;
    qrImage.style.display = 'block';
    
    // Настраиваем кнопку скачивания
    downloadButton.style.display = 'inline-flex';
    downloadButton.addEventListener('click', (e) => {
        e.preventDefault();
        downloadQRCode(qrUrl);
    });
}

// Скачивание QR-кода
async function downloadQRCode(qrUrl) {
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `esim-qr-${orderId}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        // Открываем в новой вкладке как запасной вариант
        window.open(qrUrl, '_blank');
    }
}

// Показ ошибки
function showError(message) {
    qrLoading.style.display = 'none';
    errorState.style.display = 'block';
    console.error(message);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadOrderInfo();
});