// Простая прокси функция для Supabase API
// В Node.js 18+ fetch встроен, для старых версий используем node-fetch
const fetch = globalThis.fetch || require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SUPABASE_URL = 'https://nwcleyhnbzxetcqtlim.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y2xleWhubmJ6eGV0Y3F0bGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODEzODUsImV4cCI6MjA2Mjk1NzM4NX0.3ss3IMHLlhipHY1u8610mCX6TBG4e3doZULjvoQ1Ijg';

  try {
    // Parse the request
    const { table, params } = JSON.parse(event.body || '{}');
    const method = event.httpMethod;
    
    // Build URL
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    if (params && method === 'GET') {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }

    // Make request to Supabase
    const response = await fetch(url, {
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: method !== 'GET' ? JSON.stringify(params) : undefined
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: data
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};