// Простая тестовая функция для проверки webhook
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const response = {
            success: true,
            message: 'Webhook test endpoint is working',
            timestamp: new Date().toISOString(),
            method: event.httpMethod,
            headers: event.headers,
            body: event.body ? JSON.parse(event.body) : null,
            query: event.queryStringParameters
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Test webhook error',
                message: error.message
            })
        };
    }
};