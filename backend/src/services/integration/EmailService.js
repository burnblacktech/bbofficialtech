// =====================================================
// EMAIL SERVICE - ENTERPRISE GRADE
// Handles all email communications (password reset, OTP, notifications)
// =====================================================

const nodemailer = require('nodemailer');
const enterpriseLogger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // For development, use a test account or mock
      if (process.env.NODE_ENV === 'development') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
            pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
          },
        });
      } else {
        // Production email service (AWS SES, SendGrid, etc.)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      enterpriseLogger.info('Email service initialized', {
        environment: process.env.NODE_ENV,
        hasTransporter: !!this.transporter,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to initialize email service', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async sendEmail({ to, subject, html, text, from = null }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: from || process.env.FROM_EMAIL || 'noreply@burnblack.com',
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      enterpriseLogger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to send email', {
        error: error.message,
        to,
        subject,
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const subject = 'Password Reset Request - BurnBlack ITR Platform';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your BurnBlack ITR Platform account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This email was sent from BurnBlack ITR Platform. Please do not reply to this email.</p>
            <p>&copy; 2024 BurnBlack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - BurnBlack ITR Platform
      
      Hello,
      
      We received a request to reset your password for your BurnBlack ITR Platform account.
      
      Click the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour for your security.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      BurnBlack ITR Platform Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendOTPEmail(email, otp, purpose = 'verification') {
    const subject = `OTP for ${purpose} - BurnBlack ITR Platform`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .otp-box { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>OTP Verification</h2>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for ${purpose} is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <div class="warning">
              <strong>Security Notice:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone.
            </div>
            <p>If you didn't request this OTP, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This email was sent from BurnBlack ITR Platform. Please do not reply to this email.</p>
            <p>&copy; 2024 BurnBlack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      OTP Verification - BurnBlack ITR Platform
      
      Hello,
      
      Your One-Time Password (OTP) for ${purpose} is: ${otp}
      
      This OTP is valid for 10 minutes only.
      
      If you didn't request this OTP, please ignore this email.
      
      Best regards,
      BurnBlack ITR Platform Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAccountLinkingEmail(email, linkingToken, linkingUrl) {
    const subject = 'Account Linking Request - BurnBlack ITR Platform';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Linking</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Account Linking Request</h2>
            <p>Hello,</p>
            <p>We received a request to link your Google account to your existing BurnBlack ITR Platform account.</p>
            <p>Click the button below to confirm the account linking:</p>
            <a href="${linkingUrl}" class="button">Link Accounts</a>
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour. Only click this link if you requested to link your Google account.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${linkingUrl}</p>
          </div>
          <div class="footer">
            <p>This email was sent from BurnBlack ITR Platform. Please do not reply to this email.</p>
            <p>&copy; 2024 BurnBlack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Account Linking Request - BurnBlack ITR Platform
      
      Hello,
      
      We received a request to link your Google account to your existing BurnBlack ITR Platform account.
      
      Click the following link to confirm the account linking:
      ${linkingUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this account linking, please ignore this email.
      
      Best regards,
      BurnBlack ITR Platform Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email, fullName) {
    const subject = 'Welcome to BurnBlack ITR Platform';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Welcome to BurnBlack ITR Platform - your comprehensive solution for Indian Income Tax Return filing.</p>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>File your ITR online</li>
              <li>Manage your documents</li>
              <li>Track your filing status</li>
              <li>Get expert CA assistance</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>This email was sent from BurnBlack ITR Platform. Please do not reply to this email.</p>
            <p>&copy; 2024 BurnBlack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to BurnBlack ITR Platform
      
      Hello ${fullName}!
      
      Welcome to BurnBlack ITR Platform - your comprehensive solution for Indian Income Tax Return filing.
      
      Your account has been successfully created. You can now:
      - File your ITR online
      - Manage your documents
      - Track your filing status
      - Get expert CA assistance
      
      Get started: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
      
      If you have any questions, feel free to contact our support team.
      
      Best regards,
      BurnBlack ITR Platform Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  // Test email functionality
  async testEmail() {
    try {
      const result = await this.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Test Email</h1><p>This is a test email from BurnBlack ITR Platform.</p>',
        text: 'Test Email - This is a test email from BurnBlack ITR Platform.',
      });

      enterpriseLogger.info('Test email sent successfully', result);
      return result;
    } catch (error) {
      enterpriseLogger.error('Test email failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
