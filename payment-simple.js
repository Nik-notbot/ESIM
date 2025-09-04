// Упрощенная версия оплаты без Supabase
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
        // Создаем уникальный ID заказа
        const orderId = `esim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Сохраняем заказ локально
        const orderData = {
            id: orderId,
            planId,
            planName,
            planData,
            planPrice,
            customerEmail: email,
            customerPhone: phone,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
        
        // Создаем платеж в Wata через прокси функцию
        console.log('Создаем платеж через Netlify Function...');
        
        const paymentData = {
            amount: parseFloat(planPrice),
            currency: 'RUB',
            description: `eSIM ${planName} - ${planData} ГБ`,
            orderId: orderId,
            customerEmail: email,
            successUrl: `${window.location.origin}/success-simple.html?order=${orderId}`,
            failUrl: `${window.location.origin}/payment.html?plan=${planId}&name=${planName}&data=${planData}&price=${planPrice}&error=1`
        };
        
        // Используем Netlify Function для создания платежа
        const response = await fetch('/.netlify/functions/wata-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка от прокси:', errorText);
            throw new Error('Ошибка создания платежа');
        }
        
        const payment = await response.json();
        console.log('Платеж создан:', payment);
        
        // Сохраняем информацию о платеже
        orderData.paymentId = payment.paymentId || payment.id;
        orderData.paymentUrl = payment.paymentUrl || payment.url;
        orderData.status = 'processing';
        localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
        
        // Перенаправляем на страницу оплаты
        if (payment.paymentUrl || payment.url) {
            window.location.href = payment.paymentUrl || payment.url;
        } else {
            throw new Error('Не получен URL для оплаты');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        errorMessage.innerHTML = `
            <p>${error.message || 'Произошла ошибка при создании платежа'}</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                Если проблема повторяется, напишите нам в 
                <a href="https://t.me/HEYKYCSTORE" target="_blank">Telegram</a>
            </p>
        `;
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