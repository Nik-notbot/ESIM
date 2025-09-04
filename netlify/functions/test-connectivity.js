// Функция для тестирования подключений с сервера Netlify
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const results = {};
  
  // Тест 1: Проверка DNS
  try {
    const dns = require('dns').promises;
    
    // Проверяем DNS для Wata
    try {
      const wataIPs = await dns.resolve4('api.wata.pro');
      results.wata_dns = { success: true, ips: wataIPs };
    } catch (error) {
      results.wata_dns = { success: false, error: error.message };
    }
    
    // Проверяем DNS для Supabase
    try {
      const supabaseIPs = await dns.resolve4('nwcleyhnbzxetcqtlim.supabase.co');
      results.supabase_dns = { success: true, ips: supabaseIPs };
    } catch (error) {
      results.supabase_dns = { success: false, error: error.message };
    }
  } catch (error) {
    results.dns_error = error.message;
  }

  // Тест 2: Простой HTTP запрос к различным API
  const testUrls = [
    { name: 'github', url: 'https://api.github.com' },
    { name: 'google', url: 'https://www.google.com' },
    { name: 'wata_main', url: 'https://wata.pro' },
    { name: 'wata_api', url: 'https://api.wata.pro' },
    { name: 'supabase_main', url: 'https://supabase.com' },
    { name: 'supabase_project', url: 'https://nwcleyhnbzxetcqtlim.supabase.co' }
  ];

  for (const test of testUrls) {
    try {
      const start = Date.now();
      const response = await fetch(test.url, {
        method: 'HEAD',
        timeout: 5000
      });
      const time = Date.now() - start;
      
      results[test.name] = {
        success: true,
        status: response.status,
        time: time + 'ms'
      };
    } catch (error) {
      results[test.name] = {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Тест 3: Проверка с полными заголовками для Wata
  try {
    const wataResponse = await fetch('https://api.wata.pro/api/h2h/', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjEiLCJleHAiOjE3NTk0MTAxMjMsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.593TE4q83LRidOJmCbJhn3B-EhGMWOK_yZmsVDMhY6U',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    const responseText = await wataResponse.text();
    results.wata_api_full = {
      success: true,
      status: wataResponse.status,
      statusText: wataResponse.statusText,
      headers: Object.fromEntries(wataResponse.headers.entries()),
      body: responseText.substring(0, 200) // Первые 200 символов
    };
  } catch (error) {
    results.wata_api_full = {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }

  // Тест 4: Информация о среде выполнения
  results.environment = {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    region: process.env.AWS_REGION || 'unknown',
    function_region: context.clientContext?.custom?.region || 'unknown'
  };

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(results, null, 2)
  };
};