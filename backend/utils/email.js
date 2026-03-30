import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendOTPEmail = async (email, otp, name) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'MediConnect - Email Verification OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">MediConnect</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Healthcare Management System</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #1e293b; margin: 0 0 16px;">Hello, ${name}!</h2>
            <p style="color: #64748b; line-height: 1.6;">Your email verification OTP is:</p>
            <div style="background: #f0fdf4; border: 2px dashed #14b8a6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0f766e;">${otp}</span>
            </div>
            <p style="color: #64748b;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  await transporter.sendMail(mailOptions);
};

export const sendNotificationEmail = async (email, subject, message) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `MediConnect - ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f766e;">MediConnect Notification</h2>
        <p>${message}</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
