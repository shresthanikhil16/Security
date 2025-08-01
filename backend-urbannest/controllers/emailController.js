const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || !text || !html) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields in the request body'
    });
  }

  try {
    await transporter.sendMail({
      from: `Homefy <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text, // Plain text version
      html  // HTML version
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// 🔐 SEND PASSWORD RESET EMAIL (Secure SHA-256 Token System)
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;

    const subject = '� Secure Password Reset Request - Homefy';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .reset-button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .security-info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>� Secure Password Reset</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password Securely</h2>
          <p>You requested a password reset for your Homefy account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="reset-button">🔒 Reset Your Password</a>
          </div>
          
          <div class="security-info">
            <p><strong>🔐 Enhanced Security Features:</strong></p>
            <ul>
              <li><strong>Cryptographic Token:</strong> Generated using secure random bytes</li>
              <li><strong>SHA-256 Hashing:</strong> Token is hashed before database storage</li>
              <li><strong>Single-Use:</strong> Token is automatically invalidated after use</li>
              <li><strong>Time-Limited:</strong> Expires in exactly 1 hour for your safety</li>
            </ul>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Security Notice:</strong></p>
            <ul>
              <li>This link expires in <strong>1 hour</strong></li>
              <li>This link can only be used <strong>once</strong></li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your account remains secure - no changes have been made</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link:</p>
          <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetUrl}
          </p>
        </div>
        <div class="footer">
          <p>© 2024 Homefy Security Team. All rights reserved.</p>
          <p>If you didn't request this, please contact our support team immediately.</p>
          <p><em>This email was sent from a secure, verified address.</em></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Homefy - Secure Password Reset Request
      
      You requested a password reset for your account.
      
      SECURITY FEATURES:
      ✓ Cryptographically generated token
      ✓ SHA-256 hashed for database security  
      ✓ Single-use token (automatically invalidated)
      ✓ Expires in 1 hour for your protection
      
      Click this link to reset your password: ${resetUrl}
      
      This link expires in 1 hour and can only be used once.
      
      If you didn't request this, please ignore this email.
      Your account remains secure.
    `;

    await transporter.sendMail({
      from: `Homefy Security <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
      html: html
    });

    console.log(`✅ SECURE PASSWORD RESET EMAIL SENT - To: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = { sendEmail, sendPasswordResetEmail };