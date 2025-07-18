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
    console.log('Webhook received:', event.body);
    
    // Parse the callback data
    const callbackData = JSON.parse(event.body);
    
    // According to Morune docs, callback contains:
    // - uuid: invoice ID
    // - amount: payment amount
    // - status: payment status (1 = success)
    // - key: MD5 verification hash
    // - extra_data: our custom data
    
    const { uuid, amount, status, key, extra_data } = callbackData;

    // Verify the callback signature
    // According to docs: MD5(secret_key + uuid + additional_key)
    const expectedKey = crypto
      .createHash('md5')
      .update(process.env.MORUNE_API_KEY + uuid + process.env.MORUNE_ADDITIONAL_KEY)
      .digest('hex');

    if (key !== expectedKey) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Parse extra data
    let metadata;
    try {
      metadata = JSON.parse(extra_data);
    } catch (e) {
      console.error('Failed to parse extra_data:', e);
      metadata = {};
    }

    // Check if payment is successful (status = 1)
    if (status === 1 || status === '1') {
      const qrCodeId = metadata?.qr_code_id;
      
      if (qrCodeId) {
        // Update QR code status to true (sold)
        const { data: updatedQR, error: updateError } = await supabase
          .from('qr_codes')
          .update({ 
            status: true,
            paid_at: new Date().toISOString()
          })
          .eq('id', qrCodeId)
          .select()
          .single();

        if (updateError) {
          console.error('Status update error:', updateError);
        } else {
          console.log(`Payment successful for QR code ID: ${qrCodeId}`);
          
          // Here you could send email notification
          if (updatedQR && updatedQR.email) {
            console.log(`Should send QR code to: ${updatedQR.email}`);
            // TODO: Implement email sending via SendGrid or another service
          }
        }
      }
    } else {
      console.log(`Payment not successful, status: ${status}`);
    }

    // Always return 200 OK to acknowledge webhook receipt
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok' }),
    };

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'error', message: error.message }),
    };
  }
};