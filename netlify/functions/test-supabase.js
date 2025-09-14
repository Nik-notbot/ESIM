// Тестовая функция для проверки подключения к Supabase
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        console.log('Testing Supabase connection...');
        console.log('URL configured:', !!SUPABASE_URL);
        console.log('Service key configured:', !!SUPABASE_SERVICE_KEY);
        
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Supabase not configured',
                    SUPABASE_URL: !!SUPABASE_URL,
                    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_KEY
                })
            };
        }

        // Тестируем подключение - получаем список заказов
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,status&limit=5`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Supabase response status:', response.status);
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Supabase error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Supabase connection failed',
                    status: response.status,
                    errorText: error
                })
            };
        }

        const data = await response.json();
        console.log('Supabase data received:', data);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Supabase connection successful',
                ordersCount: data.length,
                sampleOrders: data,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Test error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Test failed',
                message: error.message,
                stack: error.stack
            })
        };
    }
};