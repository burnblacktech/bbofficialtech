// =====================================================
// BANK ACCOUNT SERVICE
// Bank account management operations using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class BankAccountService {
  /**
   * Get user's bank accounts
   * @returns {Promise<Array>} Bank accounts array
   */
  async getBankAccounts() {
    try {
      const response = await apiClient.get('/users/bank-accounts');
      // Response structure: { success: true, data: [...], message: '...' }
      return {
        success: response.data?.success,
        data: response.data?.data || [],
        message: response.data?.message,
      };
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Add a new bank account
   * @param {Object} bankAccountData - Bank account data
   * @param {string} bankAccountData.bankName - Bank name
   * @param {string} bankAccountData.accountNumber - Account number
   * @param {string} bankAccountData.ifsc - IFSC code
   * @param {string} bankAccountData.accountHolderName - Account holder name
   * @param {string} bankAccountData.accountType - Account type (savings/current)
   * @param {boolean} bankAccountData.isPrimary - Whether this is primary account
   * @returns {Promise<Object>} Created bank account
   */
  async addBankAccount(bankAccountData) {
    try {
      const response = await apiClient.post('/users/bank-accounts', bankAccountData);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Update a bank account
   * @param {string} accountId - Bank account ID
   * @param {Object} bankAccountData - Updated bank account data
   * @returns {Promise<Object>} Updated bank account
   */
  async updateBankAccount(accountId, bankAccountData) {
    try {
      const response = await apiClient.put(`/users/bank-accounts/${accountId}`, bankAccountData);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Delete a bank account
   * @param {string} accountId - Bank account ID
   * @returns {Promise<Object>} Success response
   */
  async deleteBankAccount(accountId) {
    try {
      const response = await apiClient.delete(`/users/bank-accounts/${accountId}`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Set a bank account as primary
   * @param {string} accountId - Bank account ID
   * @returns {Promise<Object>} Updated bank account
   */
  async setPrimaryAccount(accountId) {
    try {
      const response = await apiClient.patch(`/users/bank-accounts/${accountId}/set-primary`);
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }
}

export default new BankAccountService();

