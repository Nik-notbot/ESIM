import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

  try {
    const { 
      invoice_id, 
      status, 
      amount, 
      metadata,
      signature 
    } = JSON.parse(event.body);

    // Verify webhook signature if provided
    if (process.env.WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify({ invoice_id, status, amount }))
        .digest('hex');

      if (signature !== expectedSignature) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid signature' }),
        };
      }
    }

    // Check if payment is successful
    if (status === 'paid' || status === 'success') {
      const qrCodeId = metadata?.qr_code_id;
      
      if (qrCodeId) {
        // Update QR code status to true (sold)
        const { error: updateError } = await supabase
          .from('qr_codes')
          .update({ 
            status: true,
            paid_at: new Date().toISOString()
          })
          .eq('id', qrCodeId);

        if (updateError) {
          console.error('Status update error:', updateError);
        } else {
          console.log(`Payment successful for QR code ID: ${qrCodeId}`);
          
          // Get QR code details for email
          const { data: qrCode } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', qrCodeId)
            .single();

          if (qrCode && qrCode.email) {
            // Here you can trigger email sending
            // For Netlify, you might want to use SendGrid or another service
            console.log(`Should send email to: ${qrCode.email}`);
          }
        }
      }
    }

    // Always return 200 OK to acknowledge webhook receipt
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    };
  }
};