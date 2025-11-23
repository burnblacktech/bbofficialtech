// =====================================================
// PAYMENT SERVICE
// Payment processing using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class PaymentService {
  // Create payment order
  async createPaymentOrder(paymentData) {
    try {
      const response = await apiClient.post('/payments/create-order', paymentData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(paymentData) {
    try {
      const response = await apiClient.post('/payments/verify', paymentData);
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await apiClient.get(`/payments/status/${paymentId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get user payment history
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiClient.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Get pricing plans
  async getPricingPlans() {
    try {
      const response = await apiClient.get('/payments/plans');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Subscribe to plan
  async subscribeToPlan(planId, paymentMethod) {
    try {
      const response = await apiClient.post('/payments/subscribe', {
        planId,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await apiClient.post(`/payments/cancel/${subscriptionId}`);
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus() {
    try {
      const response = await apiClient.get('/payments/subscription');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(paymentMethodData) {
    try {
      const response = await apiClient.put('/payments/payment-method', paymentMethodData);
      return response.data;
    } catch (error) {
      errorHandler.handleValidationError(error);
      throw error;
    }
  }

  // Get invoice
  async getInvoice(invoiceId) {
    try {
      const response = await apiClient.get(`/payments/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  // Generate invoice for ITR filing
  async generateInvoice(filingId) {
    try {
      const response = await apiClient.post(`/payments/invoice/generate`, { filingId });
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId, reason, amount) {
    try {
      const response = await apiClient.post(`/payments/refund/${paymentId}`, {
        reason,
        amount
      });
      return response.data;
    } catch (error) {
      errorHandler.handleBusinessError(error);
      throw error;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;