const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('Simple admin auth function called');
        const { password } = JSON.parse(event.body);

        if (!password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Password обязателен' 
                })
            };
        }

        // Инициализация Supabase с service role key
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase environment variables');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Server configuration error' 
                })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Прямой запрос к таблице вместо RPC
        const { data, error } = await supabase
            .from('admin_passwords')
            .select('*')
            .eq('password', password);

        console.log('Query result - data:', data);
        console.log('Query result - error:', error);

        if (error) {
            console.error('Database error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Database error: ' + error.message 
                })
            };
        }

        if (data && data.length > 0) {
            // Пароль найден
            const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Успешная авторизация',
                    sessionToken: sessionToken
                })
            };
        } else {
            // Пароль не найден
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Неверный пароль'
                })
            };
        }

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error: ' + error.message 
            })
        };
    }
};