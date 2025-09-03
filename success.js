// Инициализация Supabase
const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODEzODUsImV4cCI6MjA2Mjk1NzM4NX0.3ss3IMHLlhipHY1u8610mCX6TBG4e3doZULjvoQ1Ijg';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Получаем ID заказа из URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order');

const mainContainer = document.getElementById('mainContainer');

// Функция для отображения загрузки
function showLoading() {
    mainContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Проверяем статус платежа...</p>
        </div>
    `;
}

// Функция для отображения ошибки
function showError(message) {
    mainContainer.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor"/>
                </svg>
            </div>
            <h2 class="success-title">Ошибка</h2>
            <p class="success-message">${message}</p>
            <a href="/" class="home-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5"></path>
                    <path d="M12 19l-7-7 7-7"></path>
                </svg>
                Вернуться на главную
            </a>
        </div>
    `;
}

// Функция для отображения успешной оплаты
function showSuccess(order, qrCode) {
    mainContainer.innerHTML = `
        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor"/>
            </svg>
        </div>
        
        <h1 class="success-title">Оплата прошла успешно!</h1>
        <p class="success-message">Ваша eSIM готова к использованию</p>
        
        <div class="qr-section">
            <h2 class="qr-title">Ваш QR-код для активации eSIM</h2>
            <div class="qr-code-container">
                <img src="${qrCode.qr_url}" alt="QR код для активации eSIM">
            </div>
            <a href="${qrCode.qr_url}" download="esim-qr-code.png" class="download-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Скачать QR-код
            </a>
        </div>
        
        <div class="instructions">
            <h3>Как активировать eSIM:</h3>
            <ol>
                <li>Откройте <strong>Настройки</strong> → <strong>Сотовая связь</strong> (или <strong>Мобильные данные</strong>)</li>
                <li>Нажмите <strong>Добавить eSIM</strong> или <strong>Добавить тарифный план</strong></li>
                <li>Выберите <strong>Использовать QR-код</strong></li>
                <li>Отсканируйте QR-код выше</li>
                <li>Следуйте инструкциям на экране для завершения настройки</li>
            </ol>
        </div>
        
        <p class="success-message" style="margin-top: 30px;">
            QR-код также отправлен на вашу почту: <strong>${order.customer_email}</strong>
        </p>
        
        <a href="/" class="home-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            На главную
        </a>
    `;
}

// Основная функция проверки заказа
async function checkOrder() {
    if (!orderId) {
        showError('Неверная ссылка. ID заказа не найден.');
        return;
    }
    
    showLoading();
    
    try {
        // Получаем информацию о заказе
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, qr_codes(*)')
            .eq('id', orderId)
            .single();
            
        if (orderError || !order) {
            showError('Заказ не найден.');
            return;
        }
        
        // Проверяем статус оплаты
        if (order.status !== 'paid') {
            // Делаем дополнительную проверку через API (может платеж еще обрабатывается)
            setTimeout(() => {
                showError('Платеж еще не подтвержден. Пожалуйста, подождите или обратитесь в поддержку.');
            }, 2000);
            return;
        }
        
        // Проверяем, есть ли QR-код
        if (!order.qr_codes || !order.qr_codes.qr_url) {
            showError('QR-код еще не готов. Пожалуйста, обновите страницу через несколько секунд.');
            return;
        }
        
        // Отображаем успешную страницу
        showSuccess(order, order.qr_codes);
        
        // Отправляем событие в метрику
        if (typeof ym !== 'undefined') {
            ym(103523686, 'reachGoal', 'purchase_completed', {
                order_id: orderId,
                amount: order.amount
            });
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Произошла ошибка при загрузке информации о заказе.');
    }
}

// Запускаем проверку при загрузке страницы
document.addEventListener('DOMContentLoaded', checkOrder);