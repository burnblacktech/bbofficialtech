// =====================================================
// EMAIL SERVICE - ENTERPRISE GRADE
// Handles all email communications (password reset, OTP, notifications)
// =====================================================

const nodemailer = require('nodemailer');
const enterpriseLogger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';

      // Check if real SMTP config exists
      const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

      if (!isProduction && !hasSmtpConfig && !process.env.ETHEREAL_USER) {
        // Log that we're using a limited mock because Ethereal credentials are not configured
        enterpriseLogger.warn('Email service: Using placeholder Ethereal credentials. Emails may not be successfully sent to Ethereal. Please set ETHEREAL_USER/PASS or real SMTP credentials for testing.');
      }

      if (isProduction || hasSmtpConfig) {
        // Production email service or explicitly configured SMTP
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER || process.env.ETHEREAL_USER,
            pass: process.env.SMTP_PASS || process.env.ETHEREAL_PASS,
          },
          tls: {
            rejectUnauthorized: isProduction, // Allow self-signed certs in dev
          }
        });
      } else {
        // Fallback to Ethereal if no SMTP config is provided (standard nodal development)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
            pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
          },
        });
      }

      enterpriseLogger.info('Email service initialized', {
        environment: process.env.NODE_ENV,
        method: hasSmtpConfig ? 'SMTP' : 'Ethereal',
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

  async sendVerificationEmail(email, verificationUrl) {
    const subject = 'Verify Your Email - BurnBlack ITR Platform';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .info { background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Welcome to BurnBlack!</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for BurnBlack ITR Platform. Please verify your email address to get started.</p>
            <div class="info">
              <strong>Why verify?</strong> Verification helps secure your account and ensures you receive important updates about your tax filings.
            </div>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
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
      Verify Your Email - BurnBlack ITR Platform
      
      Hello,
      
      Thank you for signing up for BurnBlack ITR Platform. Please verify your email address to get started.
      
      Click the following link to verify your email:
      ${verificationUrl}
      
      If you didn't sign up for an account, please ignore this email.
      
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

  /**
   * Send discrepancy report email
   * @param {string} email - Recipient email
   * @param {string} filingId - Filing ID
   * @param {Array} discrepancies - Array of discrepancies
   * @param {string} reportUrl - URL to view full report
   * @returns {Promise<object>} - Email send result
   */
  async sendDiscrepancyReportEmail(email, filingId, discrepancies, reportUrl) {
    const totalDiscrepancies = discrepancies.length;
    const criticalCount = discrepancies.filter(d => d.severity === 'error' || d.severity === 'critical').length;
    const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
    const infoCount = discrepancies.filter(d => d.severity === 'info').length;

    const subject = `Discrepancy Report - Filing ${filingId} - BurnBlack ITR Platform`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Discrepancy Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .stats { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .stat-item:last-child { border-bottom: none; }
          .stat-label { font-weight: 600; color: #4b5563; }
          .stat-value { font-weight: bold; }
          .critical { color: #dc2626; }
          .warning { color: #f59e0b; }
          .info { color: #3b82f6; }
          .discrepancy-list { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; max-height: 300px; overflow-y: auto; }
          .discrepancy-item { padding: 10px; margin: 5px 0; border-left: 3px solid #e5e7eb; background: #f9fafb; }
          .discrepancy-item.critical { border-left-color: #dc2626; }
          .discrepancy-item.warning { border-left-color: #f59e0b; }
          .discrepancy-item.info { border-left-color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Discrepancy Report</h2>
            <p>Hello,</p>
            <p>Your ITR filing (ID: ${filingId}) has been analyzed and ${totalDiscrepancies} discrepancy${totalDiscrepancies !== 1 ? 'ies' : ''} ${totalDiscrepancies !== 1 ? 'have' : 'has'} been found.</p>
            
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">Total Discrepancies:</span>
                <span class="stat-value">${totalDiscrepancies}</span>
              </div>
              ${criticalCount > 0 ? `
              <div class="stat-item">
                <span class="stat-label critical">Critical:</span>
                <span class="stat-value critical">${criticalCount}</span>
              </div>
              ` : ''}
              ${warningCount > 0 ? `
              <div class="stat-item">
                <span class="stat-label warning">Warnings:</span>
                <span class="stat-value warning">${warningCount}</span>
              </div>
              ` : ''}
              ${infoCount > 0 ? `
              <div class="stat-item">
                <span class="stat-label info">Info:</span>
                <span class="stat-value info">${infoCount}</span>
              </div>
              ` : ''}
            </div>

            ${discrepancies.length > 0 ? `
            <div class="discrepancy-list">
              <h3>Top Discrepancies:</h3>
              ${discrepancies.slice(0, 5).map(d => `
                <div class="discrepancy-item ${d.severity || 'info'}">
                  <strong>${d.field || 'Unknown Field'}:</strong> ${d.message || `Manual: ₹${d.manualValue || 0}, Source: ₹${d.sourceValue || 0}`}
                </div>
              `).join('')}
              ${discrepancies.length > 5 ? `<p style="text-align: center; color: #6b7280; margin-top: 10px;">... and ${discrepancies.length - 5} more</p>` : ''}
            </div>
            ` : ''}

            <p>Please review and resolve these discrepancies before submitting your ITR.</p>
            <a href="${reportUrl}" class="button">View Full Report</a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${reportUrl}</span>
            </p>
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
      Discrepancy Report - BurnBlack ITR Platform
      
      Hello,
      
      Your ITR filing (ID: ${filingId}) has been analyzed and ${totalDiscrepancies} discrepancy${totalDiscrepancies !== 1 ? 'ies' : ''} ${totalDiscrepancies !== 1 ? 'have' : 'has'} been found.
      
      Summary:
      - Total: ${totalDiscrepancies}
      - Critical: ${criticalCount}
      - Warnings: ${warningCount}
      - Info: ${infoCount}
      
      Please review and resolve these discrepancies before submitting your ITR.
      
      View full report: ${reportUrl}
      
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

  /**
   * Send draft sharing notification email
   * @param {string} email - Recipient email
   * @param {string} draftId - Draft ID
   * @param {string} sharedBy - Name of person who shared
   * @param {string} accessUrl - URL to access the draft
   * @returns {Promise<object>} - Email send result
   */
  async sendDraftSharingEmail(email, draftId, sharedBy, accessUrl) {
    const subject = `Draft Shared with You - BurnBlack ITR Platform`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Draft Shared</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BurnBlack ITR Platform</h1>
          </div>
          <div class="content">
            <h2>Draft Shared with You</h2>
            <p>Hello,</p>
            <p><strong>${sharedBy}</strong> has shared an ITR draft with you for review.</p>
            
            <div class="info-box">
              <p><strong>Draft ID:</strong> ${draftId}</p>
              <p><strong>Shared by:</strong> ${sharedBy}</p>
            </div>

            <p>Click the button below to access and review the draft:</p>
            <a href="${accessUrl}" class="button">Access Draft</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              <strong>Note:</strong> This link will expire in 7 days for security purposes.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${accessUrl}</span>
            </p>
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
      Draft Shared with You - BurnBlack ITR Platform
      
      Hello,
      
      ${sharedBy} has shared an ITR draft with you for review.
      
      Draft ID: ${draftId}
      Shared by: ${sharedBy}
      
      Access the draft: ${accessUrl}
      
      Note: This link will expire in 7 days for security purposes.
      
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

  /**
   * Send submission confirmation email
   * @param {string} email - Recipient email
   * @param {string} filingId - Filing ID
   * @param {string} acknowledgmentNumber - Acknowledgment number
   * @param {string} downloadUrl - URL to download acknowledgment
   * @returns {Promise<object>} - Email send result
   */
  async sendSubmissionConfirmationEmail(email, filingId, acknowledgmentNumber, downloadUrl) {
    const subject = `ITR Submitted Successfully - Acknowledgment ${acknowledgmentNumber} - BurnBlack ITR Platform`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ITR Submission Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .ack-number { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; padding: 15px; background: white; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ ITR Submitted Successfully</h1>
          </div>
          <div class="content">
            <h2>Congratulations!</h2>
            <p>Hello,</p>
            <p>Your Income Tax Return has been successfully submitted to the Income Tax Department.</p>
            
            <div class="success-box">
              <p style="margin: 0; font-weight: 600;">Filing ID: ${filingId}</p>
            </div>

            <div class="ack-number">
              Acknowledgment Number<br>
              ${acknowledgmentNumber}
            </div>

            <p><strong>Important:</strong> Please save this acknowledgment number for your records. You will need it for future reference and to track your refund status.</p>

            <p>Click the button below to download your acknowledgment receipt:</p>
            <a href="${downloadUrl}" class="button">Download Acknowledgment</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              <strong>Next Steps:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px;">
              <li>Keep a copy of the acknowledgment receipt</li>
              <li>Track your refund status in the dashboard</li>
              <li>Respond to any notices from the Income Tax Department if required</li>
            </ul>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${downloadUrl}</span>
            </p>
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
      ITR Submitted Successfully - BurnBlack ITR Platform
      
      Hello,
      
      Your Income Tax Return has been successfully submitted to the Income Tax Department.
      
      Filing ID: ${filingId}
      Acknowledgment Number: ${acknowledgmentNumber}
      
      Important: Please save this acknowledgment number for your records.
      
      Download acknowledgment: ${downloadUrl}
      
      Next Steps:
      - Keep a copy of the acknowledgment receipt
      - Track your refund status in the dashboard
      - Respond to any notices from the Income Tax Department if required
      
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

  /**
   * Send deadline reminder email
   * @param {string} email - Recipient email
   * @param {object} deadline - Deadline object
   * @param {number} daysRemaining - Days remaining until deadline
   * @returns {Promise<object>} - Email send result
   */
  async sendReminderEmail(email, deadline, daysRemaining) {
    const urgencyColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 7 ? '#f59e0b' : '#3b82f6';
    const urgencyText = daysRemaining <= 1 ? 'URGENT' : daysRemaining <= 7 ? 'SOON' : 'UPCOMING';

    const subject = `${urgencyText}: ${deadline.title} - ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining - BurnBlack ITR Platform`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deadline Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: ${urgencyColor}; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .deadline-box { background: white; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .days-remaining { font-size: 32px; font-weight: bold; color: ${urgencyColor}; text-align: center; padding: 15px; background: white; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgencyText} Deadline Reminder</h1>
          </div>
          <div class="content">
            <h2>${deadline.title}</h2>
            <p>Hello,</p>
            <p>This is a reminder about an upcoming tax deadline.</p>
            
            <div class="days-remaining">
              ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining
            </div>

            <div class="deadline-box">
              <p style="margin: 5px 0;"><strong>Deadline Type:</strong> ${deadline.deadline_type || 'Tax Deadline'}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(deadline.deadline_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              ${deadline.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${deadline.description}</p>` : ''}
            </div>

            <p><strong>Action Required:</strong> Please ensure you complete the necessary actions before the deadline to avoid penalties or interest charges.</p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you have already completed this action, you can ignore this reminder.
            </p>
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
      ${urgencyText} Deadline Reminder - BurnBlack ITR Platform
      
      Hello,
      
      This is a reminder about an upcoming tax deadline.
      
      ${deadline.title}
      Days Remaining: ${daysRemaining}
      Due Date: ${new Date(deadline.deadline_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
      ${deadline.description ? `Description: ${deadline.description}` : ''}
      
      Action Required: Please ensure you complete the necessary actions before the deadline.
      
      View Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
      
      If you have already completed this action, you can ignore this reminder.
      
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
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
