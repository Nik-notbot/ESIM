import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For production, use a real email service like SendGrid, AWS SES, etc.
  // This example uses Gmail
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendQRCodeEmail = async (email, qrUrl, plan) => {
  const transporter = createTransporter();
  
  const planDetails = {
    start: { name: 'Старт', data: '8 ГБ' },
    premium: { name: 'Премиум', data: '25 ГБ' }
  };
  
  const currentPlan = planDetails[plan] || planDetails.start;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Ваш eSIM от HEY, ESIM! готов к использованию',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea; text-align: center;">HEY, ESIM!</h1>
        <h2>Спасибо за покупку!</h2>
        <p>Ваш eSIM (тариф ${currentPlan.name} - ${currentPlan.data}) готов к использованию.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrUrl}" alt="eSIM QR Code" style="max-width: 300px; border: 2px solid #e2e8f0; padding: 20px;">
        </div>
        
        <h3>Как активировать eSIM:</h3>
        <ol>
          <li><strong>iPhone:</strong> Настройки → Сотовая связь → Добавить тарифный план → Использовать QR-код</li>
          <li><strong>Android:</strong> Настройки → Сеть и интернет → SIM-карты → Добавить → Сканировать QR-код</li>
        </ol>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Если у вас возникли вопросы, свяжитесь с нами: hello@heyesim.com
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Add this function to server.js webhook handler after successful payment:
// import { sendQRCodeEmail } from './services/emailService.js';
// 
// // In webhook handler after updating status:
// const { data: qrCode } = await supabase
//   .from('qr_codes')
//   .select('*')
//   .eq('id', qrCodeId)
//   .single();
// 
// if (qrCode) {
//   await sendQRCodeEmail(qrCode.email, qrCode.qr_url, metadata?.plan);
// }