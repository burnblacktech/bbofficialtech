// =====================================================
// FINANCE DOMAIN
// Pure domain logic for finance operations
// Reads ITR context (read-only), writes finance records only
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { Invoice, Payment, TaxPayment, RefundTracking } = require('../models');
const { ITRFiling } = require('../models');

class FinanceDomain {
  /**
   * Estimate fees for an ITR filing
   * Called when filing reaches COMPUTED state
   * @param {string} filingId - Filing ID
   * @param {object} context - ITR context (read-only)
   * @returns {Promise<object>} Fee estimate
   */
  async estimateFees(filingId, context = {}) {
    try {
      // Read ITR filing (read-only)
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'itrType', 'assessmentYear', 'jsonPayload'],
      });

      if (!filing) {
        throw new Error(`Filing ${filingId} not found`);
      }

      // Base pricing
      const baseAmount = 500; // Base ITR filing fee
      const itrTypeMultiplier = {
        'ITR-1': 1,
        'ITR-2': 1.5,
        'ITR-3': 2,
        'ITR-4': 1.5,
      };

      // Calculate base fee
      let estimatedAmount = baseAmount * (itrTypeMultiplier[filing.itrType] || 1);

      // Complexity adjustments (read from jsonPayload, don't modify)
      const formData = filing.jsonPayload || {};
      const hasCapitalGains = !!(formData.income?.capitalGains || formData.income?.capital_gains);
      const hasBusinessIncome = !!(formData.income?.businessIncome || formData.income?.business_income);
      const hasForeignIncome = !!(formData.income?.foreignIncome || formData.income?.foreign_income);

      // Add complexity surcharges
      if (hasCapitalGains) {
        estimatedAmount += 200;
      }
      if (hasBusinessIncome) {
        estimatedAmount += 300;
      }
      if (hasForeignIncome) {
        estimatedAmount += 250;
      }

      // CA involvement (if applicable)
      if (context.caInvolved) {
        estimatedAmount += 500;
      }

      // Manual overrides (from context)
      if (context.manualOverride) {
        estimatedAmount = context.manualOverride.amount;
      }

      enterpriseLogger.info('Fee estimated', {
        filingId,
        itrType: filing.itrType,
        estimatedAmount,
        factors: {
          hasCapitalGains,
          hasBusinessIncome,
          hasForeignIncome,
          caInvolved: context.caInvolved,
        },
      });

      return {
        filingId,
        estimatedAmount,
        currency: 'INR',
        breakdown: {
          baseAmount,
          itrTypeMultiplier: itrTypeMultiplier[filing.itrType] || 1,
          complexitySurcharges: {
            capitalGains: hasCapitalGains ? 200 : 0,
            businessIncome: hasBusinessIncome ? 300 : 0,
            foreignIncome: hasForeignIncome ? 250 : 0,
          },
          caInvolvement: context.caInvolved ? 500 : 0,
          manualOverride: context.manualOverride || null,
        },
      };
    } catch (error) {
      enterpriseLogger.error('Fee estimation failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Generate invoice for an ITR filing
   * Called when filing reaches LOCKED state
   * @param {string} filingId - Filing ID
   * @param {object} feeEstimate - Fee estimate from estimateFees()
   * @returns {Promise<object>} Invoice
   */
  async generateInvoice(filingId, feeEstimate) {
    try {
      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({
        where: { filingId },
      });

      if (existingInvoice) {
        enterpriseLogger.info('Invoice already exists for filing', {
          filingId,
          invoiceId: existingInvoice.id,
        });
        return existingInvoice;
      }

      // Read ITR filing (read-only)
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'userId', 'itrType', 'assessmentYear'],
      });

      if (!filing) {
        throw new Error(`Filing ${filingId} not found`);
      }

      // Generate invoice
      const invoiceNumber = Invoice.generateInvoiceNumber();
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const invoice = await Invoice.create({
        userId: filing.userId,
        filingId: filing.id,
        invoiceNumber,
        invoiceDate: invoiceDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'draft',
        paymentStatus: 'pending',
        subtotal: feeEstimate.estimatedAmount,
        taxAmount: 0, // GST can be added later
        discountAmount: 0,
        totalAmount: feeEstimate.estimatedAmount,
        currency: 'INR',
        description: `ITR Filing for ${filing.itrType} - Assessment Year ${filing.assessmentYear}`,
        lineItems: [
          {
            description: `ITR Filing Service - ${filing.itrType}`,
            quantity: 1,
            unitPrice: feeEstimate.estimatedAmount,
            amount: feeEstimate.estimatedAmount,
          },
        ],
        metadata: {
          feeBreakdown: feeEstimate.breakdown,
          itrType: filing.itrType,
          assessmentYear: filing.assessmentYear,
        },
      });

      enterpriseLogger.info('Invoice generated', {
        filingId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      });

      return invoice;
    } catch (error) {
      enterpriseLogger.error('Invoice generation failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Finalize invoice (mark as sent)
   * Called when filing reaches FILED state
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} Updated invoice
   */
  async finalizeInvoice(filingId) {
    try {
      const invoice = await Invoice.findOne({
        where: { filingId },
      });

      if (!invoice) {
        enterpriseLogger.warn('No invoice found to finalize', { filingId });
        return null;
      }

      // Mark as sent (not paid yet)
      if (invoice.status === 'draft') {
        await invoice.sendInvoice();
      }

      enterpriseLogger.info('Invoice finalized', {
        filingId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      });

      return invoice;
    } catch (error) {
      enterpriseLogger.error('Invoice finalization failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Record payment for an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} Payment record
   */
  async recordPayment(invoiceId, paymentData) {
    try {
      const invoice = await Invoice.findByPk(invoiceId);

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Create payment record
      const payment = await Payment.create({
        invoiceId: invoice.id,
        amount: paymentData.amount || invoice.totalAmount,
        method: paymentData.method || 'razorpay',
        status: paymentData.status || 'pending',
        gatewayRef: paymentData.gatewayRef || null,
        metadata: paymentData.metadata || {},
      });

      // Update invoice payment status
      if (payment.status === 'completed') {
        await invoice.markAsPaid(
          payment.method,
          payment.gatewayRef || payment.id,
          payment.amount
        );
      }

      enterpriseLogger.info('Payment recorded', {
        invoiceId,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      enterpriseLogger.error('Payment recording failed', {
        invoiceId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Track tax payment (challan)
   * @param {string} filingId - Filing ID
   * @param {object} taxPaymentData - Tax payment data
   * @returns {Promise<object>} Tax payment record
   */
  async trackTaxPayment(filingId, taxPaymentData) {
    try {
      // Read ITR filing (read-only)
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'userId', 'assessmentYear'],
      });

      if (!filing) {
        throw new Error(`Filing ${filingId} not found`);
      }

      // Create tax payment record
      const taxPayment = await TaxPayment.create({
        filingId: filing.id,
        userId: filing.userId,
        assessmentYear: filing.assessmentYear,
        typeOfPayment: taxPaymentData.typeOfPayment || 'self_assessment',
        amount: taxPaymentData.amount,
        paymentMethod: taxPaymentData.paymentMethod || 'razorpay',
        paymentStatus: taxPaymentData.paymentStatus || 'pending',
        challanNumber: taxPaymentData.challanNumber || null,
        razorpayOrderId: taxPaymentData.razorpayOrderId || null,
        razorpayPaymentId: taxPaymentData.razorpayPaymentId || null,
        itdTransactionId: taxPaymentData.itdTransactionId || null,
        challanData: taxPaymentData.challanData || {},
        paymentDetails: taxPaymentData.paymentDetails || {},
      });

      enterpriseLogger.info('Tax payment tracked', {
        filingId,
        taxPaymentId: taxPayment.id,
        amount: taxPayment.amount,
        challanNumber: taxPayment.challanNumber,
      });

      return taxPayment;
    } catch (error) {
      enterpriseLogger.error('Tax payment tracking failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Track refund for an ITR filing
   * Called when filing reaches ACKNOWLEDGED state
   * @param {string} filingId - Filing ID
   * @param {object} refundData - Refund data
   * @returns {Promise<object>} Refund tracking record
   */
  async trackRefund(filingId, refundData = {}) {
    try {
      // Read ITR filing (read-only)
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'jsonPayload', 'taxComputation'],
      });

      if (!filing) {
        throw new Error(`Filing ${filingId} not found`);
      }

      // Calculate expected refund from tax computation
      const taxComputation = filing.taxComputation || {};
      const expectedAmount = refundData.expectedAmount || taxComputation.refund || 0;

      // Check if refund tracking already exists
      let refundTracking = await RefundTracking.findOne({
        where: { filingId },
      });

      if (refundTracking) {
        // Update existing record
        await refundTracking.update({
          expectedAmount,
          status: refundData.status || 'processing',
          bankAccount: refundData.bankAccount || null,
          refundReference: refundData.refundReference || null,
          interestAmount: refundData.interestAmount || 0,
        });
      } else {
        // Create new record
        refundTracking = await RefundTracking.create({
          filingId: filing.id,
          expectedAmount,
          status: refundData.status || 'processing',
          bankAccount: refundData.bankAccount || null,
          refundReference: refundData.refundReference || null,
          interestAmount: refundData.interestAmount || 0,
          timeline: [
            {
              status: 'processing',
              date: new Date().toISOString(),
              note: 'Refund tracking initiated',
            },
          ],
        });
      }

      enterpriseLogger.info('Refund tracked', {
        filingId,
        refundTrackingId: refundTracking.id,
        expectedAmount,
        status: refundTracking.status,
      });

      return refundTracking;
    } catch (error) {
      enterpriseLogger.error('Refund tracking failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Reconcile finance records for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} Reconciliation report
   */
  async reconcile(filingId) {
    try {
      // Read ITR filing (read-only)
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['id', 'userId', 'itrType', 'assessmentYear', 'taxComputation'],
      });

      if (!filing) {
        throw new Error(`Filing ${filingId} not found`);
      }

      // Get all finance records
      const invoice = await Invoice.findOne({ where: { filingId } });
      const payments = await Payment.findAll({
        where: { invoiceId: invoice?.id || null },
      });
      const taxPayments = await TaxPayment.findAll({ where: { filingId } });
      const refundTracking = await RefundTracking.findOne({ where: { filingId } });

      // Calculate totals
      const totalServiceFee = invoice?.totalAmount || 0;
      const totalServicePayments = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalTaxPayments = taxPayments
        .filter(tp => tp.paymentStatus === 'completed' || tp.paymentStatus === 'verified')
        .reduce((sum, tp) => sum + parseFloat(tp.amount), 0);
      const expectedRefund = refundTracking?.expectedAmount || 0;

      const reconciliation = {
        filingId,
        invoice: invoice ? {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          status: invoice.status,
          paymentStatus: invoice.paymentStatus,
        } : null,
        servicePayments: {
          total: totalServicePayments,
          count: payments.length,
          records: payments.map(p => ({
            id: p.id,
            amount: p.amount,
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
          })),
        },
        taxPayments: {
          total: totalTaxPayments,
          count: taxPayments.length,
          records: taxPayments.map(tp => ({
            id: tp.id,
            amount: tp.amount,
            challanNumber: tp.challanNumber,
            status: tp.paymentStatus,
            createdAt: tp.createdAt,
          })),
        },
        refund: refundTracking ? {
          expectedAmount: refundTracking.expectedAmount,
          status: refundTracking.status,
          refundReference: refundTracking.refundReference,
        } : null,
        summary: {
          serviceFeeDue: totalServiceFee - totalServicePayments,
          serviceFeePaid: totalServicePayments,
          taxPaid: totalTaxPayments,
          refundExpected: expectedRefund,
        },
      };

      enterpriseLogger.info('Reconciliation completed', {
        filingId,
        summary: reconciliation.summary,
      });

      return reconciliation;
    } catch (error) {
      enterpriseLogger.error('Reconciliation failed', {
        filingId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new FinanceDomain();

