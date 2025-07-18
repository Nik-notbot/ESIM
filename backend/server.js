import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create invoice endpoint
app.post('/api/create-invoice', async (req, res) => {
  try {
    const { email, phone, plan } = req.body;

    // Validate input
    if (!email || !phone || !plan) {
      return res.status(400).json({ 
        error: 'Email, phone and plan are required' 
      });
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
      return res.status(404).json({ 
        error: 'No available eSIM codes at the moment' 
      });
    }

    // Determine price based on plan
    const prices = {
      start: 599,
      premium: 1299
    };
    const amount = prices[plan] || 599;

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
      success_url: `${process.env.FRONTEND_URL}/success?email=${encodeURIComponent(email)}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      webhook_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/morune-webhook`
    };

    const moruneResponse = await axios.post(
      `${process.env.MORUNE_API_URL}/create-invoice`,
      morunePayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MORUNE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoiceData = moruneResponse.data;

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
    res.json({
      success: true,
      invoice_url: invoiceData.invoice_url,
      invoice_id: invoiceData.invoice_id
    });

  } catch (error) {
    console.error('Create invoice error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create invoice',
      details: error.response?.data || error.message
    });
  }
});

// Morune webhook endpoint
app.post('/api/morune-webhook', async (req, res) => {
  try {
    const { 
      invoice_id, 
      status, 
      amount, 
      metadata,
      signature 
    } = req.body;

    // Verify webhook signature if provided
    if (process.env.WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify({ invoice_id, status, amount }))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
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
          // Optionally send email with QR code here
          // You can implement email sending logic using SendGrid, AWS SES, etc.
          console.log(`Payment successful for QR code ID: ${qrCodeId}`);
        }
      }
    }

    // Always return 200 OK to acknowledge webhook receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get QR code endpoint
app.get('/api/get-qr', async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email || !phone) {
      return res.status(400).json({ 
        error: 'Email and phone are required' 
      });
    }

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
      return res.status(404).json({ 
        error: 'No QR code found for this user' 
      });
    }

    res.json({
      success: true,
      qr_url: qrCode.qr_url,
      id: qrCode.id
    });

  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve QR code' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
});