// src/services/email.service.js - Email Service with Gmail

const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  // Gmail configuration
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
  });
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'InvoiceAI'} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  // Construct reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .email-wrapper {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        .header {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0A66C2 0%, #8B5CF6 100%);
          border-radius: 12px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 28px;
          font-weight: 900;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          margin: 0 0 16px 0;
          color: #0F172A;
          font-size: 24px;
          font-weight: 700;
        }
        .content p {
          margin: 0 0 24px 0;
          color: #64748B;
          font-size: 16px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #0A66C2 0%, #8B5CF6 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(10, 102, 194, 0.35);
        }
        .button:hover {
          box-shadow: 0 12px 28px rgba(10, 102, 194, 0.4);
        }
        .info-box {
          background: #f1f5f9;
          border-left: 4px solid #0A66C2;
          padding: 16px 20px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .info-box p {
          margin: 0;
          font-size: 14px;
        }
        .footer {
          padding: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 8px 0;
        }
        .link {
          color: #0A66C2;
          text-decoration: none;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">📄</div>
            <h1>InvoiceAI</h1>
          </div>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
              <p><strong>⏱️ This link expires in 1 hour</strong></p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
            
            <p style="margin-top: 32px;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
          </div>
          
          <div class="footer">
            <p><strong>InvoiceAI</strong></p>
            <p>AI-Powered Invoice Processing</p>
            <p style="margin-top: 16px; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your Password - InvoiceAI',
    html
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to InvoiceAI</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .email-wrapper {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        .header {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0A66C2 0%, #8B5CF6 100%);
          border-radius: 12px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 28px;
          font-weight: 900;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          margin: 0 0 16px 0;
          color: #0F172A;
          font-size: 24px;
          font-weight: 700;
        }
        .content p {
          margin: 0 0 16px 0;
          color: #64748B;
          font-size: 16px;
          line-height: 1.6;
        }
        .feature {
          display: flex;
          align-items: start;
          margin: 16px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .feature-icon {
          font-size: 24px;
          margin-right: 16px;
        }
        .feature-text h3 {
          margin: 0 0 4px 0;
          color: #0F172A;
          font-size: 16px;
          font-weight: 600;
        }
        .feature-text p {
          margin: 0;
          font-size: 14px;
          color: #64748B;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #0A66C2 0%, #8B5CF6 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(10, 102, 194, 0.35);
        }
        .footer {
          padding: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">📄</div>
            <h1>InvoiceAI</h1>
          </div>
          
          <div class="content">
            <h2>Welcome, ${name}! 🎉</h2>
            <p>Thank you for joining InvoiceAI. Your account has been successfully created and you're ready to start processing invoices with AI-powered automation.</p>
            
            <div class="feature">
              <div class="feature-icon">✨</div>
              <div class="feature-text">
                <h3>Smart Data Extraction</h3>
                <p>AI-powered OCR extracts data from invoices automatically</p>
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">⚡</div>
              <div class="feature-text">
                <h3>Real-time Processing</h3>
                <p>Process invoices in seconds, not hours</p>
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">🛡️</div>
              <div class="feature-text">
                <h3>Enterprise Security</h3>
                <p>Bank-grade encryption keeps your data safe</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p style="margin-top: 32px;">Need help getting started? Check out our documentation or contact support.</p>
          </div>
          
          <div class="footer">
            <p><strong>InvoiceAI</strong></p>
            <p>AI-Powered Invoice Processing</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Welcome to InvoiceAI, ${name}!`,
    html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};