// =====================================================
// INVOICE SERVICE - AUTOMATED INVOICE GENERATION AND DELIVERY
// Comprehensive invoice generation and email delivery system
// =====================================================

const { Invoice, User, ITRFiling, CAFirm } = require('../models');
const emailService = require('./emailService');
const enterpriseLogger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  /**
   * Generate and send invoice for ITR filing
   * @param {Object} paymentData - Payment confirmation data
   * @param {Object} filingData - ITR filing data
   * @returns {Promise<Object>} - Invoice data
   */
  async generateITRFilingInvoice(paymentData, filingData) {
    try {
      enterpriseLogger.info('InvoiceService: Generating ITR filing invoice', {
        filingId: filingData.id,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount
      });

      // Get user data
      const user = await User.findByPk(filingData.userId);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber('ITR');

      // Create invoice record
      const invoice = await Invoice.create({
        invoiceNumber,
        type: 'itr_filing',
        status: 'paid',
        amount: paymentData.amount,
        currency: 'INR',
        userId: filingData.userId,
        filingId: filingData.id,
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.paymentMethod || 'razorpay',
        description: `ITR Filing for Assessment Year ${filingData.assessmentYear}`,
        metadata: {
          assessmentYear: filingData.assessmentYear,
          pan: filingData.pan,
          expertReview: paymentData.expertReview || false
        }
      });

      // Generate PDF invoice
      const pdfPath = await this.generatePDFInvoice(invoice, user, filingData);

      // Send invoice email
      await this.sendInvoiceEmail(invoice, user, pdfPath);

      enterpriseLogger.info('InvoiceService: ITR filing invoice generated successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfPath
      };

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error generating ITR filing invoice', {
        error: error.message,
        filingId: filingData.id,
        stack: error.stack
      });

      throw new Error('Failed to generate ITR filing invoice');
    }
  }

  /**
   * Generate and send invoice for CA subscription
   * @param {Object} paymentData - Payment confirmation data
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} - Invoice data
   */
  async generateSubscriptionInvoice(paymentData, subscriptionData) {
    try {
      enterpriseLogger.info('InvoiceService: Generating subscription invoice', {
        planId: subscriptionData.planId,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount
      });

      // Get user data
      const user = await User.findByPk(subscriptionData.userId);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber('SUB');

      // Create invoice record
      const invoice = await Invoice.create({
        invoiceNumber,
        type: 'ca_subscription',
        status: 'paid',
        amount: paymentData.amount,
        currency: 'INR',
        userId: subscriptionData.userId,
        subscriptionId: subscriptionData.id,
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.paymentMethod || 'razorpay',
        description: `${subscriptionData.planName} Subscription - ${subscriptionData.billingCycle}`,
        metadata: {
          planId: subscriptionData.planId,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          clientLimit: subscriptionData.clientLimit
        }
      });

      // Generate PDF invoice
      const pdfPath = await this.generatePDFInvoice(invoice, user, subscriptionData);

      // Send invoice email
      await this.sendInvoiceEmail(invoice, user, pdfPath);

      enterpriseLogger.info('InvoiceService: Subscription invoice generated successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfPath
      };

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error generating subscription invoice', {
        error: error.message,
        planId: subscriptionData.planId,
        stack: error.stack
      });

      throw new Error('Failed to generate subscription invoice');
    }
  }

  /**
   * Generate PDF invoice
   * @param {Object} invoice - Invoice data
   * @param {Object} user - User data
   * @param {Object} serviceData - Service data (filing or subscription)
   * @returns {Promise<string>} - PDF file path
   */
  async generatePDFInvoice(invoice, user, serviceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice_${invoice.invoiceNumber}.pdf`;
        const filePath = path.join(__dirname, '../../uploads/invoices', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('BurnBlack', 50, 50);
        doc.fontSize(12).text('ITR Filing Platform', 50, 75);
        doc.fontSize(10).text('Invoice', 50, 95);

        // Company details
        doc.fontSize(10)
          .text('BurnBlack Technologies Pvt Ltd', 400, 50)
          .text('123 Business Street', 400, 65)
          .text('Mumbai, Maharashtra 400001', 400, 80)
          .text('India', 400, 95)
          .text('GST: 27AAAAA0000A1Z5', 400, 110)
          .text('Email: billing@burnblack.com', 400, 125)
          .text('Phone: +91-22-1234-5678', 400, 140);

        // Invoice details
        doc.fontSize(14).text('INVOICE', 50, 180);
        doc.fontSize(10)
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 200)
          .text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 50, 215)
          .text(`Due Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 50, 230);

        // Customer details
        doc.fontSize(12).text('Bill To:', 50, 260);
        doc.fontSize(10)
          .text(user.fullName, 50, 280)
          .text(user.email, 50, 295);
        
        if (serviceData.address) {
          doc.text(serviceData.address.street, 50, 310)
            .text(`${serviceData.address.city}, ${serviceData.address.state} ${serviceData.address.pincode}`, 50, 325);
        }

        // Service details
        doc.fontSize(12).text('Service Details:', 50, 360);
        doc.fontSize(10)
          .text(`Service: ${invoice.description}`, 50, 380)
          .text(`Payment ID: ${invoice.paymentId}`, 50, 395)
          .text(`Payment Method: ${invoice.paymentMethod}`, 50, 410);

        // Amount details
        doc.fontSize(12).text('Amount Details:', 400, 360);
        doc.fontSize(10)
          .text(`Service Amount: ₹${invoice.amount}`, 400, 380)
          .text(`GST (18%): ₹${(invoice.amount * 0.18).toFixed(2)}`, 400, 395)
          .text(`Total Amount: ₹${(invoice.amount * 1.18).toFixed(2)}`, 400, 410);

        // Footer
        doc.fontSize(8)
          .text('Thank you for using BurnBlack!', 50, 500)
          .text('This is a computer-generated invoice and does not require a signature.', 50, 515);

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send invoice email
   * @param {Object} invoice - Invoice data
   * @param {Object} user - User data
   * @param {string} pdfPath - PDF file path
   */
  async sendInvoiceEmail(invoice, user, pdfPath) {
    try {
      const emailData = {
        to: user.email,
        subject: `Invoice ${invoice.invoiceNumber} - BurnBlack`,
        template: 'invoice-email',
        data: {
          userName: user.fullName,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
          amount: invoice.amount,
          description: invoice.description,
          paymentId: invoice.paymentId
        },
        attachments: [
          {
            filename: `invoice_${invoice.invoiceNumber}.pdf`,
            path: pdfPath
          }
        ]
      };

      await emailService.sendEmail(emailData);

      enterpriseLogger.info('InvoiceService: Invoice email sent successfully', {
        invoiceId: invoice.id,
        userEmail: user.email
      });

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error sending invoice email', {
        error: error.message,
        invoiceId: invoice.id
      });
    }
  }

  /**
   * Generate unique invoice number
   * @param {string} prefix - Invoice prefix
   * @returns {Promise<string>} - Invoice number
   */
  async generateInvoiceNumber(prefix) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Get last invoice number for this month
      const lastInvoice = await Invoice.findOne({
        where: {
          invoiceNumber: {
            [require('sequelize').Op.like]: `${prefix}-${year}${month}-%`
          }
        },
        order: [['createdAt', 'DESC']]
      });

      let sequence = 1;
      if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }

      const invoiceNumber = `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
      
      return invoiceNumber;

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error generating invoice number', {
        error: error.message
      });

      throw new Error('Failed to generate invoice number');
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} - Invoice data
   */
  async getInvoice(invoiceId) {
    try {
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          }
        ]
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error getting invoice', {
        error: error.message,
        invoiceId
      });

      throw new Error('Failed to get invoice');
    }
  }

  /**
   * Get user invoices
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - User invoices
   */
  async getUserInvoices(userId, filters = {}) {
    try {
      const whereClause = { userId };

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const invoices = await Invoice.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      return invoices;

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error getting user invoices', {
        error: error.message,
        userId
      });

      throw new Error('Failed to get user invoices');
    }
  }

  /**
   * Resend invoice email
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} - Resend result
   */
  async resendInvoiceEmail(invoiceId) {
    try {
      const invoice = await this.getInvoice(invoiceId);
      const user = await User.findByPk(invoice.userId);

      // Generate PDF if not exists
      let pdfPath = path.join(__dirname, '../../uploads/invoices', `invoice_${invoice.invoiceNumber}.pdf`);
      
      if (!fs.existsSync(pdfPath)) {
        pdfPath = await this.generatePDFInvoice(invoice, user, invoice.metadata);
      }

      // Send email
      await this.sendInvoiceEmail(invoice, user, pdfPath);

      enterpriseLogger.info('InvoiceService: Invoice email resent successfully', {
        invoiceId,
        userEmail: user.email
      });

      return {
        success: true,
        message: 'Invoice email sent successfully'
      };

    } catch (error) {
      enterpriseLogger.error('InvoiceService: Error resending invoice email', {
        error: error.message,
        invoiceId
      });

      throw new Error('Failed to resend invoice email');
    }
  }
}

module.exports = new InvoiceService();
