// Payment с использованием прокси для Supabase
const WATA_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjIiLCJleHAiOjE3NTk1Njk0NjcsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.AxHi2wXqNJrDQa3RIbB1QXcA5MIzWZbDiyrr2GMtjmU';
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

// Простая функция для работы с Supabase через прокси
async function supabaseRequest(action, data) {
    const proxyUrl = '/.netlify/functions/supabase-api';
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Supabase proxy error:', error);
        throw error;
    }
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
        // 1. Создаем заказ через прокси
        console.log('Создаем заказ...');
        
        const orderData = {
            plan_id: parseInt(planId),
            customer_email: email,
            customer_phone: phone || null,
            amount: parseFloat(planPrice),
            status: 'pending'
        };

        // Для временного решения - создаем заказ с случайным ID
        const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Сохраняем данные заказа в localStorage для временного решения
        localStorage.setItem(orderId, JSON.stringify({
            ...orderData,
            id: orderId,
            created_at: new Date().toISOString()
        }));

        console.log('Заказ создан локально:', orderId);
        
        // 2. Создаем платеж в Wata
        const paymentData = {
            amount: parseFloat(planPrice),
            currency: 'RUB',
            description: `eSIM ${planName} - ${planData} ГБ`,
            orderId: orderId,
            customerEmail: email,
            successUrl: `${window.location.origin}/success.html?order=${orderId}`,
            failUrl: `${window.location.origin}/payment.html?plan=${planId}&name=${planName}&data=${planData}&price=${planPrice}&error=1`
        };
        
        console.log('Создаем платеж в Wata:', paymentData);
        
        const paymentResponse = await fetch(`${WATA_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!paymentResponse.ok) {
            const errorData = await paymentResponse.text();
            console.error('Ошибка от Wata:', errorData);
            throw new Error('Ошибка создания платежа: ' + paymentResponse.statusText);
        }
        
        const payment = await paymentResponse.json();
        console.log('Платеж создан:', payment);
        
        // Сохраняем данные платежа
        localStorage.setItem(`payment_${orderId}`, JSON.stringify({
            paymentId: payment.paymentId || payment.id,
            paymentUrl: payment.paymentUrl || payment.url,
            created_at: new Date().toISOString()
        }));
        
        // 3. Перенаправляем на страницу оплаты Wata
        const redirectUrl = payment.paymentUrl || payment.url;
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            throw new Error('Не получен URL для оплаты');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        errorMessage.textContent = error.message || 'Произошла ошибка при создании платежа. Попробуйте еще раз.';
        errorMessage.style.display = 'block';
        payButton.disabled = false;
        loading.classList.remove('active');
        
        // Дополнительная информация для отладки
        if (error.message.includes('Failed to fetch')) {
            errorMessage.innerHTML += '<br><small>Проблема с сетевым подключением. Проверьте интернет-соединение.</small>';
        }
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