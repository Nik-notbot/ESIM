// Альтернативная версия с поддержкой прокси
// Инициализация
const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODEzODUsImV4cCI6MjA2Mjk1NzM4NX0.3ss3IMHLlhipHY1u8610mCX6TBG4e3doZULjvoQ1Ijg';

// Определяем, нужно ли использовать прокси
let useProxy = false;
let proxyUrl = '/.netlify/functions/supabase-proxy';

// Класс для работы с Supabase через прокси или напрямую
class SupabaseClient {
    constructor() {
        this.checkConnection();
    }
    
    async checkConnection() {
        try {
            // Пробуем прямое подключение
            const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Direct connection failed');
            }
            
            console.log('✓ Прямое подключение к Supabase работает');
            useProxy = false;
        } catch (error) {
            console.log('✗ Прямое подключение не работает, используем прокси');
            useProxy = true;
        }
    }
    
    async request(endpoint, options = {}) {
        const url = useProxy 
            ? `${proxyUrl}${endpoint}` 
            : `${SUPABASE_URL}/rest/v1${endpoint}`;
            
        const headers = useProxy ? {
            'Content-Type': 'application/json',
            ...options.headers
        } : {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
    
    async createOrder(orderData) {
        return this.request('/orders?select=*', {
            method: 'POST',
            body: JSON.stringify(orderData),
            headers: {
                'Prefer': 'return=representation'
            }
        });
    }
    
    async getPlans() {
        return this.request('/esim_plans?select=*');
    }
}

// Создаем клиент
const supabaseClient = new SupabaseClient();

// API ключ Wata
const WATA_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjEiLCJleHAiOjE3NTk0MTAxMjMsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.593TE4q83LRidOJmCbJhn3B-EhGMWOK_yZmsVDMhY6U';
const WATA_API_URL = 'https://api.wata.pro/api/h2h';

// Получаем параметры из URL
const urlParams = new URLSearchParams(window.location.search);
const planId = urlParams.get('plan');
const planName = urlParams.get('name');
const planData = urlParams.get('data');
const planPrice = urlParams.get('price');

// Отображаем информацию о заказе
document.getElementById('planName').textContent = planName || 'Не выбран';
document.getElementById('planData').textContent = planData ? `${planData} ГБ` : '-';
document.getElementById('planPrice').textContent = planPrice ? `${planPrice} ₽` : '-';

// Если нет параметров тарифа, возвращаем на главную
if (!planId || !planPrice) {
    window.location.href = '/';
}

// Обработка формы оплаты
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const payButton = document.getElementById('payButton');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    
    // Показываем загрузку
    payButton.disabled = true;
    loading.classList.add('active');
    errorMessage.style.display = 'none';
    
    try {
        // 1. Создаем заказ в базе данных
        console.log('Создаем заказ с данными:', {
            plan_id: parseInt(planId),
            customer_email: email,
            customer_phone: phone,
            amount: parseFloat(planPrice),
            status: 'pending'
        });
        
        const orderData = await supabaseClient.createOrder({
            plan_id: parseInt(planId),
            customer_email: email,
            customer_phone: phone || null,
            amount: parseFloat(planPrice),
            status: 'pending'
        });
        
        const order = Array.isArray(orderData) ? orderData[0] : orderData;
        
        if (!order || !order.id) {
            throw new Error('Не удалось создать заказ');
        }
        
        console.log('Заказ создан:', order);
        
        // 2. Создаем платеж в Wata
        const paymentData = {
            Amount: parseFloat(planPrice),
            Currency: 'RUB',
            Description: `eSIM ${planName} - ${planData} ГБ`,
            OrderId: order.id,
            CustomerEmail: email,
            SuccessUrl: `${window.location.origin}/success.html?order=${order.id}`,
            FailUrl: `${window.location.origin}/payment.html?plan=${planId}&name=${planName}&data=${planData}&price=${planPrice}&error=1`
        };
        
        const paymentResponse = await fetch(`${WATA_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!paymentResponse.ok) {
            const errorData = await paymentResponse.json();
            throw new Error('Ошибка создания платежа: ' + (errorData.message || paymentResponse.statusText));
        }
        
        const payment = await paymentResponse.json();
        
        // 3. Обновляем заказ с данными платежа
        await supabaseClient.request(`/orders?id=eq.${order.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                payment_id: payment.PaymentId,
                payment_url: payment.PaymentUrl,
                status: 'processing'
            })
        });
        
        // 4. Перенаправляем на страницу оплаты Wata
        window.location.href = payment.PaymentUrl;
        
    } catch (error) {
        console.error('Ошибка:', error);
        errorMessage.textContent = error.message || 'Произошла ошибка при создании платежа. Попробуйте еще раз.';
        errorMessage.style.display = 'block';
        payButton.disabled = false;
        loading.classList.remove('active');
    }
});

// Проверяем, если вернулись с ошибкой
if (urlParams.get('error') === '1') {
    document.getElementById('errorMessage').textContent = 'Платеж не был завершен. Попробуйте еще раз.';
    document.getElementById('errorMessage').style.display = 'block';
}

// Форматирование телефона
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (value.length > 0) {
        if (value[0] === '7') {
            formattedValue = '+7';
            if (value.length > 1) {
                formattedValue += ' (' + value.substring(1, 4);
            }
            if (value.length > 4) {
                formattedValue += ') ' + value.substring(4, 7);
            }
            if (value.length > 7) {
                formattedValue += '-' + value.substring(7, 9);
            }
            if (value.length > 9) {
                formattedValue += '-' + value.substring(9, 11);
            }
        } else {
            formattedValue = '+' + value;
        }
    }
    
    e.target.value = formattedValue;
});