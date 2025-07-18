import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Parse request body
  const { email, phone, plan } = JSON.parse(event.body);

  // Validate input
  if (!email || !phone || !plan) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email, phone and plan are required' }),
    };
  }

  try {
    // Get available QR code from database
    const { data: availableQR, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('status', false)
      .limit(1)
      .single();

    if (qrError || !availableQR) {
      console.error('QR Error:', qrError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No available eSIM codes at the moment' }),
      };
    }

    // Determine price based on plan
    const prices = {
      start: 599,
      premium: 1299
    };
    const amount = prices[plan] || 599;

    // Get site URL from Netlify context
    const siteUrl = process.env.URL || 'http://localhost:8888';

    // Create invoice with Morune API
    const morunePayload = {
      amount: amount,
      currency: 'RUB',
      description: `eSIM ${plan === 'premium' ? 'Premium 25GB' : 'Start 8GB'}`,
      customer_email: email,
      customer_phone: phone,
      metadata: {
        qr_code_id: availableQR.id,
        plan: plan
      },
      success_url: `${siteUrl}/success?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
      cancel_url: `${siteUrl}/`,
      webhook_url: `${siteUrl}/.netlify/functions/morune-webhook`
    };

    const moruneResponse = await fetch(
      `${process.env.MORUNE_API_URL}/create-invoice`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MORUNE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(morunePayload)
      }
    );

    if (!moruneResponse.ok) {
      const errorData = await moruneResponse.text();
      console.error('Morune API error:', errorData);
      throw new Error(`Morune API error: ${moruneResponse.status}`);
    }

    const invoiceData = await moruneResponse.json();

    // Update QR code record with customer info (but not status yet)
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ 
        email: email, 
        phone: phone,
        invoice_id: invoiceData.invoice_id 
      })
      .eq('id', availableQR.id);

    if (updateError) {
      console.error('Update Error:', updateError);
    }

    // Return invoice URL to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        invoice_url: invoiceData.invoice_url,
        invoice_id: invoiceData.invoice_id
      }),
    };

  } catch (error) {
    console.error('Create invoice error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create invoice',
        details: error.message
      }),
    };
  }
};