import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event, context) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get query parameters
  const { email, phone } = event.queryStringParameters || {};

  if (!email || !phone) {
    return {
      statusCode: 400,
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
        body: JSON.stringify({ error: 'No QR code found for this user' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        qr_url: qrCode.qr_url,
        id: qrCode.id
      }),
    };

  } catch (error) {
    console.error('Get QR error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve QR code' }),
    };
  }
};