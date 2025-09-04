// Инициализация Supabase
const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODEzODUsImV4cCI6MjA2Mjk1NzM4NX0.3ss3IMHLlhipHY1u8610mCX6TBG4e3doZULjvoQ1Ijg';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка подключения при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data, error } = await supabase
            .from('esim_plans')
            .select('count')
            .single();
            
        if (error) {
            console.error('Ошибка подключения к Supabase:', error);
            console.log('Текущий URL:', window.location.origin);
            console.log('Проверьте CORS настройки для этого домена в Supabase');
        } else {
            console.log('✓ Supabase подключен успешно');
        }
    } catch (err) {
        console.error('Критическая ошибка подключения:', err);
    }
});

// API ключ Wata
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
        // 1. Создаем заказ в базе данных
        console.log('Создаем заказ с данными:', {
            plan_id: parseInt(planId),
            customer_email: email,
            customer_phone: phone,
            amount: parseFloat(planPrice),
            status: 'pending'
        });
        
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                plan_id: parseInt(planId),
                customer_email: email,
                customer_phone: phone || null,
                amount: parseFloat(planPrice),
                status: 'pending'
            })
            .select()
            .single();
            
        if (orderError) {
            console.error('Ошибка Supabase:', orderError);
            throw new Error('Ошибка создания заказа: ' + orderError.message);
        }
        
        // 2. Создаем платеж в Wata
        const paymentData = {
            amount: parseFloat(planPrice),
            currency: 'RUB',
            description: `eSIM ${planName} - ${planData} ГБ`,
            orderId: order.id,
            customerEmail: email,
            successUrl: `${window.location.origin}/success.html?order=${order.id}`,
            failUrl: `${window.location.origin}/payment.html?plan=${planId}&name=${planName}&data=${planData}&price=${planPrice}&error=1`
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
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_id: payment.paymentId || payment.id,
                payment_url: payment.paymentUrl || payment.url,
                status: 'processing'
            })
            .eq('id', order.id);
            
        if (updateError) throw new Error('Ошибка обновления заказа: ' + updateError.message);
        
        // 4. Записываем в историю платежей
        await supabase
            .from('payment_history')
            .insert({
                order_id: order.id,
                event_type: 'created',
                payment_data: payment
            });
        
        // 5. Перенаправляем на страницу оплаты Wata
        window.location.href = payment.paymentUrl || payment.url;
        
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