const WATA_API = 'https://api.wata.pro/api/h2h';
const WATA_TOKEN = process.env.WATA_ACCESS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!WATA_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'WATA token not configured' }) };
  }

  try {
    const { amount, currency, orderId, description, successRedirectUrl, failRedirectUrl } = JSON.parse(event.body);

    const res = await fetch(`${WATA_API}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATA_TOKEN}`
      },
      body: JSON.stringify({ amount, currency, orderId, description, successRedirectUrl, failRedirectUrl })
    });

    const data = await res.json();

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: data.url, id: data.id })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
