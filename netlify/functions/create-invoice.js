import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { email, phone, plan } = JSON.parse(event.body);

    // Validate input
    if (!email || !phone || !plan) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, phone and plan are required' }),
      };
    }

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
        headers,
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

    // Generate MD5 hash for Morune API
    // According to docs: MD5(secret_key + amount + additional_key)
    const md5Hash = crypto
      .createHash('md5')
      .update(process.env.MORUNE_API_KEY + amount + process.env.MORUNE_ADDITIONAL_KEY)
      .digest('hex');

    // Create invoice with Morune API
    const morunePayload = {
      amount: amount,
      description: `eSIM ${plan === 'premium' ? 'Premium 25GB' : 'Start 8GB'}`,
      callback_url: `${siteUrl}/.netlify/functions/morune-webhook`,
      redirect_url: `${siteUrl}/success?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
      extra_data: JSON.stringify({
        qr_code_id: availableQR.id,
        plan: plan,
        email: email,
        phone: phone
      }),
      key: md5Hash
    };

    console.log('Morune request payload:', { ...morunePayload, key: 'hidden' });

    const moruneResponse = await fetch(
      `${process.env.MORUNE_API_URL}/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(morunePayload)
      }
    );

    const responseText = await moruneResponse.text();
    console.log('Morune response:', responseText);

    if (!moruneResponse.ok) {
      console.error('Morune API error:', responseText);
      throw new Error(`Morune API error: ${moruneResponse.status}`);
    }

    let invoiceData;
    try {
      invoiceData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Morune response:', e);
      throw new Error('Invalid response from payment provider');
    }

    // Check if invoice was created successfully
    if (!invoiceData.status || !invoiceData.link) {
      throw new Error('Failed to create invoice');
    }

    // Update QR code record with customer info and invoice ID
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ 
        email: email, 
        phone: phone,
        invoice_id: invoiceData.uuid || invoiceData.id
      })
      .eq('id', availableQR.id);

    if (updateError) {
      console.error('Update Error:', updateError);
    }

    // Return invoice URL to frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        invoice_url: invoiceData.link,
        invoice_id: invoiceData.uuid || invoiceData.id
      }),
    };

  } catch (error) {
    console.error('Create invoice error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create invoice',
        details: error.message
      }),
    };
  }
};