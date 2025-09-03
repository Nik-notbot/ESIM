// Инициализация Supabase
const supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);

// Получение параметров из URL
const urlParams = new URLSearchParams(window.location.search);
const planId = urlParams.get('plan');

// Элементы страницы
const planNameEl = document.getElementById('planName');
const dataAmountEl = document.getElementById('dataAmount');
const totalAmountEl = document.getElementById('totalAmount');
const paymentForm = document.getElementById('paymentForm');
const payButton = document.getElementById('payButton');
const errorMessage = document.getElementById('errorMessage');

// Загрузка информации о тарифе
async function loadPlanInfo() {
    // Проверяем демо-режим
    if (planId && planId.startsWith('demo-')) {
        // В демо-режиме используем параметры из URL
        const planName = urlParams.get('name') || 'Тариф';
        const planAmount = urlParams.get('amount') || '0';
        const planPrice = urlParams.get('price') || '999';
        
        planNameEl.textContent = planName;
        dataAmountEl.textContent = `${planAmount} ГБ`;
        totalAmountEl.textContent = `${planPrice} ₽`;
        
        window.currentPlan = {
            id: planId,
            name: planName,
            data_amount: parseInt(planAmount),
            price_rub: parseFloat(planPrice)
        };
        
        return;
    }
    
    // Обычный режим с Supabase
    if (!supabase) {
        showError('База данных не подключена');
        return;
    }
    
    try {
        const { data: plan, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();
            
        if (error) throw error;
        
        if (!plan) {
            showError('Тариф не найден');
            return;
        }
        
        // Отображение информации о тарифе
        planNameEl.textContent = plan.name;
        dataAmountEl.textContent = `${plan.data_amount} ГБ`;
        totalAmountEl.textContent = `${plan.price_rub} ₽`;
        
        // Сохраняем план в памяти для дальнейшего использования
        window.currentPlan = plan;
        
    } catch (error) {
        console.error('Ошибка загрузки тарифа:', error);
        showError('Ошибка загрузки информации о тарифе');
    }
}

// Создание платежа
async function createPayment(customerData) {
    try {
        // Создаем или находим покупателя
        let customerId = null;
        
        if (customerData.email || customerData.telegram) {
            const { data: customer, error: customerError } = await supabase
                .from('customers')
                .upsert({
                    email: customerData.email || null,
                    telegram_username: customerData.telegram || null
                })
                .select()
                .single();
                
            if (customerError) throw customerError;
            customerId = customer.id;
        }
        
        // Создаем заказ в базе данных
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: customerId,
                plan_id: window.currentPlan.id,
                amount: window.currentPlan.price_rub,
                currency: 'RUB',
                status: 'pending'
            })
            .select()
            .single();
            
        if (orderError) throw orderError;
        
        // Создаем платеж через API WATA
        const paymentData = {
            amount: window.currentPlan.price_rub,
            currency: 'RUB',
            orderId: order.id,
            description: `eSIM ${window.currentPlan.name} - ${window.currentPlan.data_amount} ГБ`,
            successUrl: `${window.location.origin}${config.urls.success}?order=${order.id}`,
            failUrl: `${window.location.origin}${config.urls.fail}?order=${order.id}`,
            webhookUrl: `${window.location.origin}${config.urls.webhook}`
        };
        
        const response = await fetch(`${config.wata.apiUrl}/api/h2h/v1/payment/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.wata.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка создания платежа');
        }
        
        const paymentResponse = await response.json();
        
        // Обновляем заказ с ID платежа и ссылкой на оплату
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_id: paymentResponse.paymentId,
                payment_url: paymentResponse.paymentUrl
            })
            .eq('id', order.id);
            
        if (updateError) throw updateError;
        
        // Перенаправляем на страницу оплаты
        window.location.href = paymentResponse.paymentUrl;
        
    } catch (error) {
        console.error('Ошибка создания платежа:', error);
        showError('Ошибка создания платежа. Попробуйте позже.');
    }
}

// Обработка отправки формы
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!window.currentPlan) {
        showError('Информация о тарифе не загружена');
        return;
    }
    
    // Получаем данные формы
    const email = document.getElementById('email').value.trim();
    const telegram = document.getElementById('telegram').value.trim();
    
    // Показываем индикатор загрузки
    payButton.classList.add('loading');
    payButton.disabled = true;
    hideError();
    
    try {
        await createPayment({ email, telegram });
    } catch (error) {
        payButton.classList.remove('loading');
        payButton.disabled = false;
    }
});

// Вспомогательные функции
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (!planId) {
        showError('Тариф не выбран');
        payButton.disabled = true;
        return;
    }
    
    loadPlanInfo();
});