const { BrevoClient } = require('@getbrevo/brevo');
const getBrevoClient = () => {
  return new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });
};
const sendEmail = async (to, subject, htmlContent) => {
  const brevo = getBrevoClient();
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'HMS',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@hospital.com',
      },
      to: [{ email: to }],
    });
    console.log(` Email sent to ${to}:`, response.messageId || 'OK');
    return true;
  } catch (error) {
    console.error(' Email send error:', error.message || error);
    throw new Error('Failed to send email');
  }
};
const sendOtpEmail = async (email, otp, name) => {
  const subject = 'Your Verification Code — HMS';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0F172A; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0D9488, #0EA5E9); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;"> HMS</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Email Verification</p>
      </div>
      <div style="padding: 32px; color: #CBD5E1;">
        <p style="margin: 0 0 16px;">Hello <strong style="color: #fff;">${name}</strong>,</p>
        <p style="margin: 0 0 24px;">Use the following code to verify your email address:</p>
        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00BFA6;">${otp}</span>
        </div>
        <p style="margin: 0 0 8px; font-size: 14px; color: #94A3B8;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="margin: 0; font-size: 14px; color: #94A3B8;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="padding: 16px 32px; background: #0B1120; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #475569;">&copy; ${new Date().getFullYear()} HMS</p>
      </div>
    </div>
  `;
  return sendEmail(email, subject, htmlContent);
};
module.exports = { sendEmail, sendOtpEmail };
