// Функция для тестирования различных endpoints Wata API
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const WATA_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjIiLCJleHAiOjE3NTk1Njk0NjcsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.AxHi2wXqNJrDQa3RIbB1QXcA5MIzWZbDiyrr2GMtjmU';
  
  const results = [];
  
  // Различные возможные endpoints
  const endpoints = [
    { url: 'https://api.wata.pro/api/h2h', method: 'GET', name: 'Root endpoint' },
    { url: 'https://api.wata.pro/api/h2h/', method: 'GET', name: 'Root with slash' },
    { url: 'https://api.wata.pro/api/h2h/payments', method: 'GET', name: 'GET payments' },
    { url: 'https://api.wata.pro/api/h2h/payments', method: 'POST', name: 'POST payments', 
      body: JSON.stringify({
        amount: 100,
        currency: 'RUB',
        description: 'Test payment',
        orderId: 'test_' + Date.now()
      })
    },
    { url: 'https://api.wata.pro/api/h2h/payment', method: 'POST', name: 'POST payment (singular)',
      body: JSON.stringify({
        amount: 100,
        currency: 'RUB',
        description: 'Test payment',
        orderId: 'test_' + Date.now()
      })
    },
    { url: 'https://api.wata.pro/api/h2h/create-payment', method: 'POST', name: 'POST create-payment',
      body: JSON.stringify({
        amount: 100,
        currency: 'RUB',
        description: 'Test payment',
        orderId: 'test_' + Date.now()
      })
    },
    { url: 'https://api.wata.pro/api/h2h/invoices', method: 'GET', name: 'GET invoices' },
    { url: 'https://api.wata.pro/api/h2h/invoice', method: 'POST', name: 'POST invoice',
      body: JSON.stringify({
        amount: 100,
        currency: 'RUB',
        description: 'Test invoice',
        orderId: 'test_' + Date.now()
      })
    },
    { url: 'https://api.wata.pro/api/h2h/balance', method: 'GET', name: 'GET balance' },
    { url: 'https://api.wata.pro/api/h2h/terminals', method: 'GET', name: 'GET terminals' },
    { url: 'https://api.wata.pro/api/h2h/public-key', method: 'GET', name: 'GET public-key' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${WATA_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (endpoint.body && endpoint.method === 'POST') {
        options.body = endpoint.body;
      }
      
      const response = await fetch(endpoint.url, options);
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        success: response.status >= 200 && response.status < 300
      });
      
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        error: error.message,
        success: false
      });
    }
  }
  
  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      results: results
    }, null, 2)
  };
};