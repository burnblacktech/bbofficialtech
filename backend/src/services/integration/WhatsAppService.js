/**
 * WhatsApp Service
 * Integration with WhatsApp Business API
 */

const enterpriseLogger = require('../../utils/logger');

class WhatsAppService {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || 'mock';
    }

    /**
     * Send WhatsApp message
     * @param {string} to - Phone number
     * @param {string} templateName - Template name
     * @param {object} parameters - Template parameters
     */
    async sendMessage(to, templateName, parameters = {}) {
        try {
            enterpriseLogger.info('Sending WhatsApp message', {
                to: this.maskPhone(to),
                template: templateName
            });

            if (this.provider === 'mock') {
                return this.sendMockMessage(to, templateName, parameters);
            }

            throw new Error(`WhatsApp Provider ${this.provider} not implemented`);
        } catch (error) {
            enterpriseLogger.error('WhatsApp sending failed', {
                error: error.message,
                to: this.maskPhone(to)
            });
            throw error;
        }
    }

    async sendMockMessage(to, templateName, parameters) {
        await new Promise(resolve => setTimeout(resolve, 300));

        return {
            success: true,
            messageId: `mock-wa-${Date.now()}`,
            status: 'sent'
        };
    }

    maskPhone(phone) {
        if (!phone || phone.length < 4) return 'xxx';
        return phone.substring(0, 2) + 'xxxx' + phone.substring(phone.length - 4);
    }
}

module.exports = new WhatsAppService();
