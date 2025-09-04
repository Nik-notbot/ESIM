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
  
  // Попробуем альтернативный URL из вашей информации
  const ALT_WATA_URL = 'https://acquiring.foreignpay.ru/webhook/partner_sbp/transaction';

  try {
    const paymentData = JSON.parse(event.body);
    
    console.log('Creating payment link:', paymentData);
    console.log('Using Wata API URL:', WATA_API_URL);
    
    // Преобразуем данные в формат Wata API для создания платежной ссылки
    const wataPaymentData = {
      type: 'OneTime', // Одноразовая ссылка
      amount: paymentData.amount,
      currency: paymentData.currency || 'RUB',
      description: paymentData.description,
      orderId: paymentData.orderId,
          successRedirectUrl: paymentData.successUrl || paymentData.successRedirectUrl,
    failRedirectUrl: paymentData.failUrl || paymentData.failRedirectUrl
    };
    
    console.log('Wata payment data:', wataPaymentData);
    
    const response = await fetch(`${WATA_API_URL}/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(wataPaymentData)
    });

    const responseText = await response.text();
    console.log('Wata response status:', response.status);
    console.log('Wata response body:', responseText);

    // Проверяем, является ли ответ JSON
    let responseBody = responseText;
    try {
      const jsonResponse = JSON.parse(responseText);
      
      // Если успешно создана платежная ссылка, преобразуем ответ в наш формат
      if (response.ok && jsonResponse.url) {
        const transformedResponse = {
          paymentId: jsonResponse.id,
          paymentUrl: jsonResponse.url,
          status: jsonResponse.status,
          amount: jsonResponse.amount,
          currency: jsonResponse.currency,
          orderId: jsonResponse.orderId,
          creationTime: jsonResponse.creationTime,
          expirationDateTime: jsonResponse.expirationDateTime,
          // Сохраняем оригинальный ответ для отладки
          _original: jsonResponse
        };
        responseBody = JSON.stringify(transformedResponse);
      } else {
        responseBody = JSON.stringify(jsonResponse);
      }
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