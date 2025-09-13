const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Check environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing Supabase credentials',
                    details: {
                        hasUrl: !!process.env.SUPABASE_URL,
                        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
                    }
                })
            };
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Test connection by querying a simple table
        console.log('Testing Supabase connection...');
        
        // Test orders table
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .limit(1);
            
        // Test qr_codes table
        const { data: qrCodes, error: qrCodesError } = await supabase
            .from('qr_codes')
            .select('id')
            .limit(1);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Supabase connection test completed',
                timestamp: new Date().toISOString(),
                connection_status: 'success',
                tables_test: {
                    orders: {
                        accessible: !ordersError,
                        error: ordersError?.message || null,
                        sample_count: orders?.length || 0
                    },
                    qr_codes: {
                        accessible: !qrCodesError,
                        error: qrCodesError?.message || null,
                        sample_count: qrCodes?.length || 0
                    }
                },
                environment: {
                    supabase_url: process.env.SUPABASE_URL ? 'configured' : 'missing',
                    service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
                }
            })
        };

    } catch (error) {
        console.error('Supabase test error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Supabase connection test failed',
                details: error.message,
                stack: error.stack
            })
        };
    }
};