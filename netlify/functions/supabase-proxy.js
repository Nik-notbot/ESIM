// Прокси функция для обхода проблем с подключением к Supabase
// netlify/functions/supabase-proxy.js

exports.handler = async (event, context) => {
  // Разрешаем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Обрабатываем preflight запросы
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wiwkergsvbgnrdslqkzg.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2tlcmdzdmJnbnJkc2xxa3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTA5MjAsImV4cCI6MjA3MjU2NjkyMH0.PmWeSrWMRzlHlFJpwRjlSla3Ra6hWAoCNErMEdEWtEk';

  try {
    const { path, method, body: requestBody, queryStringParameters } = event;
    
    // Строим URL
    let url = `${SUPABASE_URL}/rest/v1${path || '/'}`;
    if (queryStringParameters) {
      const params = new URLSearchParams(queryStringParameters);
      url += `?${params.toString()}`;
    }

    // Подготавливаем запрос
    const options = {
      method: method || event.httpMethod,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': event.headers['prefer'] || ''
      }
    };

    if (requestBody) {
      options.body = requestBody;
    }

    // Делаем запрос к Supabase
    const response = await fetch(url, options);
    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: data
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};