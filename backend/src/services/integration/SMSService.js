/**
 * SMS Service
 * Integration with SMS providers (Twilio/AWS SNS/TextLocal)
 */

const enterpriseLogger = require('../../utils/logger');

class SMSService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'mock'; // 'twilio', 'sns', 'mock'
    }

    /**
     * Send SMS
     * @param {string} to - Phone number
     * @param {string} message - Message content
     * @param {object} options - Additional options
     */
    async sendSMS(to, message, options = {}) {
        try {
            enterpriseLogger.info('Sending SMS', { to: this.maskPhone(to), provider: this.provider });

            if (this.provider === 'mock') {
                return this.sendMockSMS(to, message);
            }

            // TODO: Implement actual providers
            // if (this.provider === 'twilio') return this.sendTwilioSMS(to, message);
            // if (this.provider === 'sns') return this.sendSNSSMS(to, message);

            throw new Error(`SMS Provider ${this.provider} not implemented`);
        } catch (error) {
            enterpriseLogger.error('SMS sending failed', {
                error: error.message,
                to: this.maskPhone(to)
            });
            throw error;
        }
    }

    async sendMockSMS(to, message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        enterpriseLogger.info('MOCK SMS SENT', {
            to,
            message,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            messageId: `mock-sms-${Date.now()}`,
            provider: 'mock'
        };
    }

    maskPhone(phone) {
        if (!phone || phone.length < 4) return 'xxx';
        return phone.substring(0, 2) + 'xxxx' + phone.substring(phone.length - 4);
    }
}

module.exports = new SMSService();
