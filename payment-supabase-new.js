// Конфигурация для НОВОГО проекта Supabase
// Проект: esim-store
const SUPABASE_URL = 'https://wiwkergsvbgnrdslqkzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2tlcmdzdmJnbnJkc2xxa3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTA5MjAsImV4cCI6MjA3MjU2NjkyMH0.PmWeSrWMRzlHlFJpwRjlSla3Ra6hWAoCNErMEdEWtEk';

// Инициализация Supabase клиента
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Функция для обработки платежа
async function handlePayment(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Обработка...';
        
        // Получаем данные из формы
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const phone = formData.get('phone');
        
        // Получаем параметры плана из URL
        const urlParams = new URLSearchParams(window.location.search);
        const planId = parseInt(urlParams.get('plan'));
        const planName = urlParams.get('name');
        const planData = urlParams.get('data');
        const planPrice = urlParams.get('price');
        
        console.log('Создаем заказ в новой БД Supabase...');
        
        // 1. Создаем заказ в базе данных
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                plan_id: planId,
                customer_email: email,
                customer_phone: phone,
                amount: parseFloat(planPrice),
                status: 'pending'
            })
            .select()
            .single();
            
        if (orderError) {
            console.error('Ошибка создания заказа:', orderError);
            throw new Error('Не удалось создать заказ: ' + orderError.message);
        }
        
        console.log('Заказ создан:', order.id);
        
        // 2. Создаем платеж через Wata API (через прокси)
        const paymentData = {
            amount: parseFloat(planPrice),
            currency: 'RUB',
            description: `eSIM ${planName} - ${planData} ГБ`,
            orderId: order.id,
            customerEmail: email,
            successUrl: `${window.location.origin}/success-new.html?order=${order.id}`,
            failUrl: `${window.location.origin}/payment.html?plan=${planId}&name=${planName}&data=${planData}&price=${planPrice}&error=1`
        };
        
        console.log('Создаем платеж через Wata...');
        
        const paymentResponse = await fetch('/.netlify/functions/wata-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('Ошибка создания платежа:', errorText);
            throw new Error('Не удалось создать платеж');
        }
        
        const payment = await paymentResponse.json();
        console.log('Платеж создан:', payment);
        
        // 3. Обновляем заказ с данными платежа
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_id: payment.paymentId,
                payment_url: payment.paymentUrl,
                status: 'processing'
            })
            .eq('id', order.id);
            
        if (updateError) {
            console.error('Ошибка обновления заказа:', updateError);
        }
        
        // 4. Перенаправляем на страницу оплаты
        submitButton.textContent = 'Перенаправление...';
        window.location.href = payment.paymentUrl;
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка: ' + error.message);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Проверяем подключение к Supabase при загрузке страницы
async function checkSupabaseConnection() {
    try {
        console.log('Проверяем подключение к новому проекту Supabase...');
        console.log('URL:', SUPABASE_URL);
        
        const { count, error } = await supabase
            .from('esim_plans')
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error('Ошибка подключения:', error);
            console.log('Проверьте:');
            console.log('1. Правильность SUPABASE_URL и SUPABASE_ANON_KEY');
            console.log('2. Настройки CORS в Supabase');
            console.log('3. RLS политики в таблицах');
        } else {
            console.log('✅ Подключение к Supabase успешно!');
            console.log('Найдено тарифов:', count);
        }
    } catch (err) {
        console.error('Критическая ошибка:', err);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем подключение
    checkSupabaseConnection();
    
    // Подключаем обработчик формы
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
    
    // Показываем информацию о выбранном плане
    const urlParams = new URLSearchParams(window.location.search);
    const planName = urlParams.get('name');
    const planData = urlParams.get('data');
    const planPrice = urlParams.get('price');
    
    if (planName && planData && planPrice) {
        const planInfo = document.getElementById('plan-info');
        if (planInfo) {
            planInfo.textContent = `${planName} - ${planData} ГБ за ${planPrice} ₽`;
        }
    }
    
    // Проверяем, была ли ошибка оплаты
    if (urlParams.get('error') === '1') {
        alert('Оплата не была завершена. Попробуйте еще раз.');
    }
});