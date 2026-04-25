/**
 * NotificationService — Email + SMS notifications via Bull queue.
 *
 * All emails are enqueued for retry resilience.
 * Templates are server-rendered HTML strings (no external engine).
 * BurnBlack brand: gold (#D4AF37) + black (#0F0F0F), Satoshi font fallback.
 */

const enterpriseLogger = require('../../utils/logger');
const { Notification } = require('../../models');

// Template definitions
const TEMPLATES = {
  session_new_device: {
    subject: 'New login to your BurnBlack account',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">New Login Detected</h2>
      <p>A new login was detected on your account:</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr><td style="${tdL}">Device</td><td style="${tdR}">${d.device || 'Unknown'}</td></tr>
        <tr><td style="${tdL}">Location</td><td style="${tdR}">${d.location || 'Unknown'}</td></tr>
        <tr><td style="${tdL}">Time</td><td style="${tdR}">${d.timestamp || new Date().toLocaleString('en-IN')}</td></tr>
      </table>
      <p style="color:#666">If this wasn't you, change your password immediately.</p>
    `),
  },
  session_evicted: {
    subject: 'Session ended on your BurnBlack account',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Session Ended</h2>
      <p>A session on your account was ended${d.reason ? ` (${d.reason})` : ''}.</p>
      <p>Device: ${d.device || 'Unknown'}</p>
      <p style="color:#666">If you didn't do this, secure your account by changing your password.</p>
    `),
  },
  filing_state_change: {
    subject: (d) => `Filing ${d.status} — AY ${d.assessmentYear}`,
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Filing Status Update</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr><td style="${tdL}">Assessment Year</td><td style="${tdR}">${d.assessmentYear}</td></tr>
        <tr><td style="${tdL}">ITR Type</td><td style="${tdR}">${d.itrType}</td></tr>
        <tr><td style="${tdL}">Status</td><td style="${tdR}"><strong>${d.status}</strong></td></tr>
      </table>
      ${d.ackNumber ? `<p>Acknowledgment No: <strong>${d.ackNumber}</strong></p>` : ''}
      <a href="${d.link || '#'}" style="${btnStyle}">View Filing →</a>
    `),
  },
  filing_deadline_reminder: {
    subject: (d) => `${d.daysLeft} days left to file your ITR`,
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Filing Deadline Reminder</h2>
      <p>You have <strong>${d.daysLeft} days</strong> left to file your income tax return for AY ${d.assessmentYear}.</p>
      ${d.daysLeft <= 7 ? '<p style="color:#DC2626;font-weight:600">Late filing attracts interest under Section 234A and a fee under Section 234F.</p>' : ''}
      <a href="${d.link || '#'}" style="${btnStyle}">Continue Filing →</a>
    `),
  },
  everify_reminder_7d: {
    subject: '7 days left to e-verify your ITR',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">E-Verify Your Return</h2>
      <p>You have <strong>7 days</strong> left to e-verify your return for AY ${d.assessmentYear}.</p>
      <p>Without e-verification, your return is treated as not filed.</p>
      <p><strong>Fastest method:</strong> Aadhaar OTP (2 minutes)</p>
      <a href="https://eportal.incometax.gov.in/iec/foservices/#/e-verify/user-details" style="${btnStyle}">E-Verify Now →</a>
    `),
  },
  everify_reminder_1d: {
    subject: 'URGENT: 1 day left to e-verify your ITR',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px;color:#DC2626">Urgent: E-Verify Today</h2>
      <p>Your e-verification deadline for AY ${d.assessmentYear} is <strong>tomorrow</strong>.</p>
      <p style="color:#DC2626;font-weight:600">If you don't e-verify, your return will be treated as not filed by ITD.</p>
      <a href="https://eportal.incometax.gov.in/iec/foservices/#/e-verify/user-details" style="${btnStyle}">E-Verify Now →</a>
    `),
  },
  refund_status_change: {
    subject: (d) => `Refund ${d.status} — AY ${d.assessmentYear}`,
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Refund Status Update</h2>
      <p>Your refund of <strong>₹${Number(d.amount || 0).toLocaleString('en-IN')}</strong> for AY ${d.assessmentYear} is now: <strong>${d.status}</strong></p>
      ${d.failureReason ? `<p style="color:#DC2626">Reason: ${d.failureReason}</p>` : ''}
    `),
  },
  vault_expiry_reminder: {
    subject: (d) => `Document expiring: ${d.documentName}`,
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Document Expiry Reminder</h2>
      <p>Your document <strong>${d.documentName}</strong> (${d.category}) expires on <strong>${d.expiryDate}</strong>.</p>
      <p>Consider renewing or uploading the updated document to your vault.</p>
      <a href="${d.link || '#'}" style="${btnStyle}">Open Vault →</a>
    `),
  },
  data_export_confirm: {
    subject: 'Your data export is ready',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Data Export Ready</h2>
      <p>Your data export has been generated. You can download it from your account settings.</p>
      <p style="color:#666;font-size:12px">This link expires in 24 hours.</p>
    `),
  },
  data_delete_confirm: {
    subject: 'Account deletion requested',
    render: (d) => wrap(`
      <h2 style="margin:0 0 12px">Account Deletion Requested</h2>
      <p>We received a request to delete your BurnBlack account.</p>
      <p>Your account and all data will be permanently deleted in <strong>24 hours</strong>.</p>
      <p>If you didn't request this, cancel immediately:</p>
      <a href="${d.cancelLink || '#'}" style="${btnStyle}">Cancel Deletion →</a>
    `),
  },
};

// ── HTML helpers ──
const tdL = 'padding:6px 12px 6px 0;color:#666;font-size:13px;border-bottom:1px solid #E8E8E4';
const tdR = 'padding:6px 0 6px 12px;font-size:13px;font-weight:600;color:#111;border-bottom:1px solid #E8E8E4';
const btnStyle = 'display:inline-block;padding:10px 24px;background:#D4AF37;color:#0F0F0F;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-top:12px';

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Satoshi',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#0F0F0F;padding:16px 24px;border-radius:12px 12px 0 0">
    <span style="color:#D4AF37;font-size:18px;font-weight:700">BurnBlack</span>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #E8E8E4;border-top:none;border-radius:0 0 12px 12px">
    ${body}
  </div>
  <div style="text-align:center;padding:16px 0;font-size:11px;color:#999">
    <a href="#" style="color:#999;text-decoration:underline">Unsubscribe</a> · BurnBlack Technologies · India
  </div>
</div></body></html>`;
}

class NotificationService {
  /**
   * Send an email notification (enqueued via Bull if available, direct otherwise).
   */
  static async sendEmail(userId, templateId, data) {
    const template = TEMPLATES[templateId];
    if (!template) {
      enterpriseLogger.warn('Unknown notification template', { templateId });
      return null;
    }

    const subject = typeof template.subject === 'function' ? template.subject(data) : template.subject;
    const html = template.render(data);

    // Save notification record
    const notification = await Notification.create({
      userId, channel: 'email', templateId, status: 'pending', data,
    });

    // Try to enqueue via Bull, fall back to direct send
    try {
      const JobQueue = require('../core/JobQueue');
      const queue = JobQueue.getQueue?.('email');
      if (queue) {
        const job = await queue.add('sendEmail', {
          notificationId: notification.id, to: data.email, subject, html,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 30000 } });
        notification.metadata = { jobId: job.id };
        await notification.save();
        return { jobId: job.id, notificationId: notification.id };
      }
    } catch { /* Bull not available — send directly */ }

    // Direct send fallback
    try {
      const emailService = require('./EmailService');
      await emailService.sendRawEmail(data.email, subject, html);
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
    } catch (err) {
      notification.status = 'failed';
      notification.failureReason = err.message;
      notification.retryCount = 1;
      await notification.save();
      enterpriseLogger.error('Email notification failed', { templateId, error: err.message });
    }

    return { notificationId: notification.id };
  }

  /**
   * Send SMS via Twilio (if configured).
   */
  static async sendSMS(phone, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      enterpriseLogger.warn('Twilio not configured — SMS not sent', { phone: phone?.slice(0, 4) + '***' });
      return null;
    }

    try {
      const twilio = require('twilio')(accountSid, authToken);
      const result = await twilio.messages.create({
        body: message, from: fromNumber, to: phone.startsWith('+') ? phone : `+91${phone}`,
      });
      return { sid: result.sid };
    } catch (err) {
      enterpriseLogger.error('SMS send failed', { error: err.message });
      return null;
    }
  }

  /**
   * Schedule a future notification.
   */
  static async schedule(userId, templateId, data, sendAt) {
    const notification = await Notification.create({
      userId, channel: 'email', templateId, status: 'pending',
      scheduledAt: sendAt, data,
    });

    try {
      const JobQueue = require('../core/JobQueue');
      const queue = JobQueue.getQueue?.('email');
      if (queue) {
        const delay = Math.max(0, new Date(sendAt).getTime() - Date.now());
        const job = await queue.add('sendEmail', {
          notificationId: notification.id, templateId, data,
        }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 30000 } });
        notification.metadata = { jobId: job.id };
        await notification.save();
      }
    } catch { /* Bull not available — will be picked up by cron */ }

    return { notificationId: notification.id };
  }

  /**
   * Cancel a scheduled notification.
   */
  static async cancel(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification || notification.status !== 'pending') return false;
    notification.status = 'cancelled';
    await notification.save();

    // Try to remove from Bull queue
    if (notification.metadata?.jobId) {
      try {
        const JobQueue = require('../core/JobQueue');
        const queue = JobQueue.getQueue?.('email');
        const job = await queue?.getJob(notification.metadata.jobId);
        await job?.remove();
      } catch { /* silent */ }
    }

    return true;
  }

  /**
   * Get available template IDs.
   */
  static getTemplateIds() {
    return Object.keys(TEMPLATES);
  }

  /**
   * Render a template (for preview/testing).
   */
  static renderTemplate(templateId, data) {
    const template = TEMPLATES[templateId];
    if (!template) return null;
    return {
      subject: typeof template.subject === 'function' ? template.subject(data) : template.subject,
      html: template.render(data),
    };
  }
}

module.exports = NotificationService;
