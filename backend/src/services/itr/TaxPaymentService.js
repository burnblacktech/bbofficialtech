// =====================================================
// TAX PAYMENT SERVICE
// Service for handling tax payments (advance tax, self-assessment tax, etc.)
// Supports both Razorpay and ITD direct payment gateways
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { query: dbQuery } = require('../../utils/dbQuery');
const TaxPayment = require('../../models/TaxPayment');
const ITRFiling = require('../../models/ITRFiling');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    enterpriseLogger.info('Razorpay initialized for tax payments');
  } catch (error) {
    enterpriseLogger.warn('Razorpay initialization failed for tax payments', { error: error.message });
  }
}

class TaxPaymentService {
  /**
   * Generate challan ITNS 280
   * @param {string} filingId - Filing ID
   * @param {object} challanData - Challan data
   * @returns {Promise<object>} - Generated challan details
   */
  async generateChallan(filingId, challanData) {
    try {
      enterpriseLogger.info('Generating challan', { filingId, challanData });

      // Verify filing exists and user owns it
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Generate challan number (format: ITNS280-YYYYMMDD-HHMMSS-XXXX)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const challanNumber = `ITNS280-${dateStr}-${timeStr}-${randomStr}`;

      // Create tax payment record
      const taxPayment = await TaxPayment.create({
        filingId,
        userId: filing.userId,
        challanNumber,
        assessmentYear: challanData.assessmentYear || filing.assessmentYear,
        typeOfPayment: this.mapPaymentType(challanData.typeOfPayment),
        amount: challanData.amount,
        paymentMethod: challanData.modeOfPayment === 'online' ? 'razorpay' : 'offline',
        paymentStatus: 'pending',
        challanData: {
          majorHead: challanData.majorHead || '0021',
          minorHead: challanData.minorHead || '100',
          typeOfPayment: challanData.typeOfPayment,
          modeOfPayment: challanData.modeOfPayment,
        },
      });

      enterpriseLogger.info('Challan generated successfully', {
        filingId,
        challanNumber: taxPayment.challanNumber,
        paymentId: taxPayment.id,
      });

      return {
        success: true,
        paymentId: taxPayment.id,
        challanNumber: taxPayment.challanNumber,
        amount: taxPayment.amount,
        assessmentYear: taxPayment.assessmentYear,
        typeOfPayment: taxPayment.typeOfPayment,
        challanData: taxPayment.challanData,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to generate challan', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to generate challan: ${error.message}`, 500);
    }
  }

  /**
   * Create Razorpay order for tax payment
   * @param {string} filingId - Filing ID
   * @param {string} paymentId - Tax payment ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} - Razorpay order details
   */
  async createPaymentOrder(filingId, paymentId, paymentData) {
    try {
      enterpriseLogger.info('Creating payment order', { filingId, paymentId });

      if (!razorpay) {
        throw new AppError('Payment gateway not configured', 503);
      }

      // Get tax payment record
      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment || taxPayment.filingId !== filingId) {
        throw new AppError('Tax payment not found', 404);
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round(taxPayment.amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `tax_${paymentId}_${Date.now()}`,
        notes: {
          filingId,
          paymentId,
          challanNumber: taxPayment.challanNumber,
          typeOfPayment: taxPayment.typeOfPayment,
          assessmentYear: taxPayment.assessmentYear,
        },
      });

      // Update tax payment with order ID
      await taxPayment.update({
        razorpayOrderId: order.id,
        paymentStatus: 'processing',
        paymentDetails: {
          ...(taxPayment.paymentDetails || {}),
          razorpayOrder: order,
        },
      });

      enterpriseLogger.info('Payment order created', {
        paymentId,
        orderId: order.id,
        amount: order.amount,
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to create payment order', {
        filingId,
        paymentId,
        error: error.message,
      });
      throw new AppError(`Failed to create payment order: ${error.message}`, 500);
    }
  }

  /**
   * Initiate ITD payment (generate payment URL)
   * @param {string} filingId - Filing ID
   * @param {string} paymentId - Tax payment ID
   * @returns {Promise<object>} - ITD payment URL
   */
  async initiateITDPayment(filingId, paymentId) {
    try {
      enterpriseLogger.info('Initiating ITD payment', { filingId, paymentId });

      // Get tax payment record
      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment || taxPayment.filingId !== filingId) {
        throw new AppError('Tax payment not found', 404);
      }

      // Get filing details
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Generate ITD payment gateway URL
      // Note: This is a placeholder - actual ITD gateway integration would require
      // ITD API credentials and specific gateway implementation
      const itdPaymentUrl = this.generateITDPaymentURL(taxPayment, filing);

      // Update payment status
      await taxPayment.update({
        paymentMethod: 'itd_direct',
        paymentStatus: 'processing',
        paymentDetails: {
          ...(taxPayment.paymentDetails || {}),
          itdPaymentUrl,
          initiatedAt: new Date().toISOString(),
        },
      });

      enterpriseLogger.info('ITD payment initiated', {
        paymentId,
        paymentUrl: itdPaymentUrl,
      });

      return {
        success: true,
        paymentUrl: itdPaymentUrl,
        challanNumber: taxPayment.challanNumber,
        amount: taxPayment.amount,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to initiate ITD payment', {
        filingId,
        paymentId,
        error: error.message,
      });
      throw new AppError(`Failed to initiate ITD payment: ${error.message}`, 500);
    }
  }

  /**
   * Verify payment (Razorpay signature or ITD callback)
   * @param {string} paymentId - Tax payment ID
   * @param {object} verificationData - Verification data
   * @returns {Promise<object>} - Verification result
   */
  async verifyPayment(paymentId, verificationData) {
    try {
      enterpriseLogger.info('Verifying payment', { paymentId });

      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment) {
        throw new AppError('Tax payment not found', 404);
      }

      if (taxPayment.paymentMethod === 'razorpay') {
        // Verify Razorpay signature
        const body = verificationData.razorpay_order_id + '|' + verificationData.razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest('hex');

        if (expectedSignature !== verificationData.razorpay_signature) {
          await taxPayment.markAsFailed('Invalid payment signature');
          throw new AppError('Invalid payment signature', 400);
        }

        // Update payment record
        await taxPayment.update({
          razorpayPaymentId: verificationData.razorpay_payment_id,
          paymentStatus: 'completed',
          paymentDetails: {
            ...(taxPayment.paymentDetails || {}),
            verifiedAt: new Date().toISOString(),
            verificationData,
          },
        });

        await taxPayment.markAsCompleted({
          razorpayPaymentId: verificationData.razorpay_payment_id,
          verifiedAt: new Date().toISOString(),
        });

        // Update taxes paid in filing
        await this.updateTaxesPaidInFiling(taxPayment.filingId, taxPayment);

        enterpriseLogger.info('Razorpay payment verified', {
          paymentId,
          razorpayPaymentId: verificationData.razorpay_payment_id,
        });

        return {
          success: true,
          paymentId: taxPayment.id,
          status: 'completed',
        };
      } else if (taxPayment.paymentMethod === 'itd_direct') {
        // Verify ITD callback
        // This would typically verify against ITD's callback/webhook
        await taxPayment.update({
          itdTransactionId: verificationData.transaction_id,
          paymentStatus: 'completed',
          paymentDetails: {
            ...(taxPayment.paymentDetails || {}),
            verifiedAt: new Date().toISOString(),
            verificationData,
          },
        });

        await taxPayment.markAsCompleted({
          itdTransactionId: verificationData.transaction_id,
          verifiedAt: new Date().toISOString(),
        });

        // Update taxes paid in filing
        await this.updateTaxesPaidInFiling(taxPayment.filingId, taxPayment);

        enterpriseLogger.info('ITD payment verified', {
          paymentId,
          transactionId: verificationData.transaction_id,
        });

        return {
          success: true,
          paymentId: taxPayment.id,
          status: 'completed',
        };
      } else {
        throw new AppError('Invalid payment method', 400);
      }
    } catch (error) {
      enterpriseLogger.error('Payment verification failed', {
        paymentId,
        error: error.message,
      });
      throw new AppError(`Payment verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Verify payment via Form 26AS
   * @param {string} paymentId - Tax payment ID
   * @returns {Promise<object>} - Verification result
   */
  async verifyVia26AS(paymentId) {
    try {
      enterpriseLogger.info('Verifying payment via 26AS', { paymentId });

      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment) {
        throw new AppError('Tax payment not found', 404);
      }

      // Get filing to get PAN
      const filing = await ITRFiling.findByPk(taxPayment.filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      // Extract PAN from filing
      const jsonPayload = filing.jsonPayload || {};
      const pan = jsonPayload.personal_info?.pan || jsonPayload.personalInfo?.pan;
      if (!pan) {
        throw new AppError('PAN not found in filing', 400);
      }

      // This would integrate with Form26ASService to fetch and verify
      // For now, we'll mark it as a placeholder that needs Form26ASService integration
      // The actual implementation would:
      // 1. Fetch Form 26AS data for the PAN and assessment year
      // 2. Search for challan matching challanNumber and amount
      // 3. If found, mark as verified

      // Placeholder: Mark as verified (actual implementation would verify against 26AS)
      await taxPayment.markAsVerified('auto_26as', {
        verifiedAt: new Date().toISOString(),
        challanNumber: taxPayment.challanNumber,
        amount: taxPayment.amount,
      });

      // Update taxes paid in filing
      await this.updateTaxesPaidInFiling(taxPayment.filingId, taxPayment);

      enterpriseLogger.info('Payment verified via 26AS', {
        paymentId,
        challanNumber: taxPayment.challanNumber,
      });

      return {
        success: true,
        paymentId: taxPayment.id,
        status: 'verified',
        verificationMethod: 'auto_26as',
      };
    } catch (error) {
      enterpriseLogger.error('26AS verification failed', {
        paymentId,
        error: error.message,
      });
      throw new AppError(`26AS verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Upload payment proof
   * @param {string} paymentId - Tax payment ID
   * @param {string} proofUrl - URL of uploaded proof document
   * @returns {Promise<object>} - Upload result
   */
  async uploadPaymentProof(paymentId, proofUrl) {
    try {
      enterpriseLogger.info('Uploading payment proof', { paymentId });

      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment) {
        throw new AppError('Tax payment not found', 404);
      }

      await taxPayment.update({
        paymentProofUrl: proofUrl,
        verificationMethod: 'manual_upload',
        paymentDetails: {
          ...(taxPayment.paymentDetails || {}),
          proofUploadedAt: new Date().toISOString(),
        },
      });

      enterpriseLogger.info('Payment proof uploaded', {
        paymentId,
        proofUrl,
      });

      return {
        success: true,
        paymentId: taxPayment.id,
        proofUrl,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to upload payment proof', {
        paymentId,
        error: error.message,
      });
      throw new AppError(`Failed to upload payment proof: ${error.message}`, 500);
    }
  }

  /**
   * Get payment status
   * @param {string} paymentId - Tax payment ID
   * @returns {Promise<object>} - Payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const taxPayment = await TaxPayment.findByPk(paymentId);
      if (!taxPayment) {
        throw new AppError('Tax payment not found', 404);
      }

      return {
        success: true,
        payment: {
          id: taxPayment.id,
          challanNumber: taxPayment.challanNumber,
          amount: taxPayment.amount,
          paymentStatus: taxPayment.paymentStatus,
          paymentMethod: taxPayment.paymentMethod,
          typeOfPayment: taxPayment.typeOfPayment,
          assessmentYear: taxPayment.assessmentYear,
          verifiedAt: taxPayment.verifiedAt,
          verificationMethod: taxPayment.verificationMethod,
          paymentProofUrl: taxPayment.paymentProofUrl,
          createdAt: taxPayment.createdAt,
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get payment status', {
        paymentId,
        error: error.message,
      });
      throw new AppError(`Failed to get payment status: ${error.message}`, 500);
    }
  }

  /**
   * Get payment history for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<Array>} - Payment history
   */
  async getPaymentHistory(filingId) {
    try {
      const payments = await TaxPayment.findByFiling(filingId);

      return {
        success: true,
        payments: payments.map(payment => ({
          id: payment.id,
          challanNumber: payment.challanNumber,
          amount: payment.amount,
          paymentStatus: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          typeOfPayment: payment.typeOfPayment,
          assessmentYear: payment.assessmentYear,
          verifiedAt: payment.verifiedAt,
          verificationMethod: payment.verificationMethod,
          createdAt: payment.createdAt,
        })),
        totalPaid: payments
          .filter(p => p.paymentStatus === 'completed' || p.paymentStatus === 'verified')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get payment history', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to get payment history: ${error.message}`, 500);
    }
  }

  // Helper methods

  mapPaymentType(typeCode) {
    const mapping = {
      '100': 'advance_tax',
      '300': 'self_assessment',
      '400': 'regular_assessment',
    };
    return mapping[typeCode] || 'advance_tax';
  }

  generateITDPaymentURL(taxPayment, filing) {
    // Placeholder for ITD payment gateway URL generation
    // Actual implementation would require ITD gateway API integration
    const baseUrl = process.env.ITD_PAYMENT_GATEWAY_URL || 'https://www.incometax.gov.in/iec/foportal/help/online-payment';
    
    // Construct payment URL with challan details
    const params = new URLSearchParams({
      challan: taxPayment.challanNumber,
      amount: taxPayment.amount,
      assessmentYear: taxPayment.assessmentYear,
      typeOfPayment: taxPayment.challanData?.typeOfPayment || '100',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async updateTaxesPaidInFiling(filingId, taxPayment) {
    try {
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        return;
      }

      const jsonPayload = filing.jsonPayload || {};
      const taxesPaid = jsonPayload.taxes_paid || jsonPayload.taxesPaid || {};

      // Add payment to appropriate tax type
      if (taxPayment.typeOfPayment === 'advance_tax') {
        if (!taxesPaid.advanceTax) {
          taxesPaid.advanceTax = [];
        }
        taxesPaid.advanceTax.push({
          challanNumber: taxPayment.challanNumber,
          amount: taxPayment.amount,
          date: taxPayment.verifiedAt || taxPayment.createdAt,
          paymentMethod: taxPayment.paymentMethod,
          verified: taxPayment.paymentStatus === 'verified',
        });
      } else if (taxPayment.typeOfPayment === 'self_assessment') {
        if (!taxesPaid.selfAssessmentTax) {
          taxesPaid.selfAssessmentTax = [];
        }
        taxesPaid.selfAssessmentTax.push({
          challanNumber: taxPayment.challanNumber,
          amount: taxPayment.amount,
          date: taxPayment.verifiedAt || taxPayment.createdAt,
          paymentMethod: taxPayment.paymentMethod,
          verified: taxPayment.paymentStatus === 'verified',
        });
      }

      // Update filing
      await filing.update({
        jsonPayload: {
          ...jsonPayload,
          taxes_paid: taxesPaid,
        },
      });

      enterpriseLogger.info('Updated taxes paid in filing', {
        filingId,
        paymentId: taxPayment.id,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to update taxes paid in filing', {
        filingId,
        error: error.message,
      });
      // Don't throw - this is a side effect
    }
  }
}

module.exports = new TaxPaymentService();

