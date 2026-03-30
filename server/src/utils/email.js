const nodemailer = require('nodemailer');

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create transporter — uses Ethereal (fake SMTP) for dev, real SMTP for production
let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Dev mode: use Ethereal fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal test email account created:', testAccount.user);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

async function sendOTPEmail(toEmail, otp) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Community CarPool" <noreply@carpool.community>',
    to: toEmail,
    subject: 'Your CarPool Registration OTP',
    text: `Your OTP code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0d9488;">🚗 Community CarPool</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d9488;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  // In dev mode, log the preview URL so you can view the email
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 Preview OTP email:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
}

module.exports = { generateOTP, sendOTPEmail, getTransporter };
