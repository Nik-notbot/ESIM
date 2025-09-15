// Netlify Function: Proxy to create payment in Wata
// This restores the expected endpoint "/.netlify/functions/wata-proxy" used by the frontend

const fetch = globalThis.fetch || require('node-fetch');

// Simple retry with exponential backoff for 429/5xx
async function httpRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (attempt === maxRetries) return res;
      const retryAfter = res.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }
    return res;
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Env-driven configuration to avoid hardcoding API specifics
    const apiUrl = process.env.WATA_CREATE_PAYMENT_URL; // e.g. https://wata.pro/api/payments or similar
    const apiKey = process.env.WATA_API_KEY;            // main cash register API key
    const authHeader = process.env.WATA_AUTH_HEADER || 'Authorization'; // or 'X-Api-Key'
    const authScheme = process.env.WATA_AUTH_SCHEME || 'Bearer';        // or '' for raw key

    if (!apiUrl || !apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Wata API is not configured',
          message: 'Set WATA_CREATE_PAYMENT_URL and WATA_API_KEY in Netlify env vars'
        })
      };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (_) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { amount, currency = 'RUB', description, orderId, customerEmail, successUrl, failUrl } = payload;
    if (!amount || !orderId || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: amount, orderId, description' })
      };
    }

    // Build request body for Wata. Keep it generic and passthrough-friendly.
    const wataBody = {
      amount,
      currency,
      description,
      orderId,
      email: customerEmail,
      successUrl,
      failUrl
    };

    const wataHeaders = {
      'Content-Type': 'application/json'
    };
    if (authHeader.toLowerCase() === 'authorization' && authScheme) {
      wataHeaders[authHeader] = `${authScheme} ${apiKey}`;
    } else {
      // e.g. X-Api-Key
      wataHeaders[authHeader] = apiKey;
    }

    const resp = await httpRequestWithRetry(apiUrl, {
      method: 'POST',
      headers: wataHeaders,
      body: JSON.stringify(wataBody)
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({ error: 'Failed to create payment', status: resp.status, data })
      };
    }

    // Try to normalize response
    // Common fields we try to extract
    const paymentId = data.paymentId || data.id || data.transactionId || data.payment_id;
    const paymentUrl = data.paymentUrl || data.url || data.redirectUrl || data.checkout_url;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        paymentId,
        paymentUrl,
        raw: data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

