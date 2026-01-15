/**
 * Notification Service
 * Orchestrates notifications via Email, SMS, and Push
 */

const emailService = require('./EmailService');
const smsService = require('./SMSService');
const enterpriseLogger = require('../../utils/logger');
// const pushNotificationService = require('./PushNotificationService'); // Future

class NotificationService {
    /**
     * Send notification via multiple channels
     * @param {object} recipient - { userId, email, phone, fcmToken }
     * @param {string} type - Notification type (e.g. 'FILING_SUBMITTED')
     * @param {object} data - Template data
     * @param {array} channels - ['email', 'sms', 'push']
     */
    async send(recipient, type, data = {}, channels = ['email']) {
        const results = {
            email: null,
            sms: null,
            push: null,
            success: true
        };

        try {
            // 1. Send Email
            if (channels.includes('email') && recipient.email) {
                try {
                    // Assuming emailService has sendTemplateEmail or similar
                    // For now using generic send
                    results.email = await emailService.sendEmail({
                        to: recipient.email,
                        subject: this.getSubjectForType(type, data),
                        template: type.toLowerCase(),
                        context: data
                    });
                } catch (err) {
                    enterpriseLogger.error('Email notification failed', { error: err.message, type });
                    results.email = { success: false, error: err.message };
                    results.success = false; // Partial failure
                }
            }

            // 2. Send SMS
            if (channels.includes('sms') && recipient.phone) {
                try {
                    const message = this.getSMSContentForType(type, data);
                    results.sms = await smsService.sendSMS(recipient.phone, message);
                } catch (err) {
                    enterpriseLogger.error('SMS notification failed', { error: err.message, type });
                    results.sms = { success: false, error: err.message };
                }
            }

            // 3. Send Push (Future)
            // if (channels.includes('push') && recipient.fcmToken) ...

            return results;
        } catch (error) {
            enterpriseLogger.error('Notification orchestration failed', { error: error.message });
            throw error;
        }
    }

    getSubjectForType(type, data) {
        const subjects = {
            'FILING_SUBMITTED': 'ITR Filing Submitted Successfully',
            'FILING_VERIFIED': 'Your ITR is Verified',
            'PAYMENT_SUCCESS': 'Payment Receipt - BurnBlack',
            'OTP_VERIFICATION': 'Your Verification Code',
            'WELCOME': 'Welcome to BurnBlack'
        };
        return subjects[type] || 'Notification from BurnBlack';
    }

    getSMSContentForType(type, data) {
        const templates = {
            'FILING_SUBMITTED': `Your ITR for ${data.year} has been submitted. Check email for details. - BurnBlack`,
            'OTP_VERIFICATION': `${data.otp} is your verification code. Valid for 10 mins. - BurnBlack`,
            'PAYMENT_SUCCESS': `Payment of Rs.${data.amount} received. Order ID: ${data.orderId}.`
        };
        return templates[type] || 'You have a new notification from BurnBlack.';
    }
}

module.exports = new NotificationService();
