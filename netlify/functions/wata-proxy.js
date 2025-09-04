// Прокси для Wata API
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const WATA_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjIiLCJleHAiOjE3NTk1Njk0NjcsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.AxHi2wXqNJrDQa3RIbB1QXcA5MIzWZbDiyrr2GMtjmU';
  const WATA_API_URL = 'https://api.wata.pro/api/h2h';

  try {
    const paymentData = JSON.parse(event.body);
    
    console.log('Creating payment:', paymentData);
    console.log('Using Wata API URL:', WATA_API_URL);
    
    const response = await fetch(`${WATA_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const responseText = await response.text();
    console.log('Wata response status:', response.status);
    console.log('Wata response body:', responseText);

    // Проверяем, является ли ответ JSON
    let responseBody = responseText;
    try {
      const jsonResponse = JSON.parse(responseText);
      responseBody = JSON.stringify(jsonResponse);
    } catch (e) {
      // Если не JSON, возвращаем как есть
      console.log('Response is not JSON:', e.message);
    }

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: responseBody
    };

  } catch (error) {
    console.error('Wata proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};