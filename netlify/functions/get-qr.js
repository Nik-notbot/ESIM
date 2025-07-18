import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get query parameters
  const { email, phone } = event.queryStringParameters || {};

  if (!email || !phone) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email and phone are required' }),
    };
  }

  try {
    // Get QR code for the user
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('email', email)
      .eq('phone', phone)
      .eq('status', true)
      .order('paid_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !qrCode) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No QR code found for this user' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        qr_url: qrCode.qr_url,
        id: qrCode.id,
        name_user: qrCode.name_user
      }),
    };

  } catch (error) {
    console.error('Get QR error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve QR code' }),
    };
  }
};