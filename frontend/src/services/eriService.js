// =====================================================
// ERI (E-Return Intermediary) SERVICE
// Frontend service for direct e-filing integration
// =====================================================

import apiClient from './core/APIClient';

class ERIService {
  constructor() {
    this.basePath = '/api/eri';
  }

  /**
   * Check ERI service health
   */
  async healthCheck() {
    try {
      const response = await apiClient.get(`${this.basePath}/health`);
      return response.data;
    } catch (error) {
      console.error('ERI health check failed:', error);
      throw error;
    }
  }

  /**
   * Validate PAN with IT Department
   */
  async validatePAN(pan) {
    try {
      const response = await apiClient.post(`${this.basePath}/validate-pan`, { pan });
      return response.data;
    } catch (error) {
      console.error('ERI PAN validation failed:', error);
      throw error;
    }
  }

  /**
   * Get prefilled ITR data from IT Department
   */
  async getPrefilledData(pan, assessmentYear) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/prefill/${pan}/${assessmentYear}`
      );
      return response.data;
    } catch (error) {
      console.error('ERI prefill fetch failed:', error);
      throw error;
    }
  }

  /**
   * Submit ITR directly to IT Department
   */
  async submitITR(itrData, itrType, assessmentYear) {
    try {
      const response = await apiClient.post(`${this.basePath}/submit`, {
        itrData,
        itrType,
        assessmentYear,
      });
      return response.data;
    } catch (error) {
      console.error('ERI ITR submission failed:', error);
      throw error;
    }
  }

  /**
   * Get filing status from IT Department
   */
  async getFilingStatus(acknowledgmentNumber) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/status/${acknowledgmentNumber}`
      );
      return response.data;
    } catch (error) {
      console.error('ERI status check failed:', error);
      throw error;
    }
  }

  /**
   * Initiate e-verification
   * @param {string} acknowledgmentNumber - ITR acknowledgment number
   * @param {string} method - Verification method (AADHAAR_OTP, NET_BANKING, DEMAT, ATM)
   */
  async initiateEVerification(acknowledgmentNumber, method) {
    try {
      const response = await apiClient.post(`${this.basePath}/everify/initiate`, {
        acknowledgmentNumber,
        method,
      });
      return response.data;
    } catch (error) {
      console.error('ERI e-verification initiation failed:', error);
      throw error;
    }
  }

  /**
   * Complete e-verification with OTP
   */
  async completeEVerification(transactionId, otp) {
    try {
      const response = await apiClient.post(`${this.basePath}/everify/complete`, {
        transactionId,
        otp,
      });
      return response.data;
    } catch (error) {
      console.error('ERI e-verification completion failed:', error);
      throw error;
    }
  }

  /**
   * Download ITR-V acknowledgment PDF
   */
  async downloadITRV(acknowledgmentNumber) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/itrv/${acknowledgmentNumber}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ITR-V_${acknowledgmentNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('ERI ITR-V download failed:', error);
      throw error;
    }
  }

  /**
   * Get Form 26AS data from IT Department
   */
  async getForm26AS(pan, assessmentYear) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/form26as/${pan}/${assessmentYear}`
      );
      return response.data;
    } catch (error) {
      console.error('ERI Form 26AS fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get AIS (Annual Information Statement) from IT Department
   */
  async getAIS(pan, assessmentYear) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/ais/${pan}/${assessmentYear}`
      );
      return response.data;
    } catch (error) {
      console.error('ERI AIS fetch failed:', error);
      throw error;
    }
  }

  /**
   * Check if ERI service is available
   */
  async isAvailable() {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get available e-verification methods
   */
  getVerificationMethods() {
    return [
      {
        id: 'AADHAAR_OTP',
        label: 'Aadhaar OTP',
        description: 'Verify using OTP sent to Aadhaar-linked mobile',
        icon: 'smartphone',
        recommended: true,
      },
      {
        id: 'NET_BANKING',
        label: 'Net Banking',
        description: 'Verify through your bank\'s e-filing EVC option',
        icon: 'building',
        recommended: false,
      },
      {
        id: 'DEMAT',
        label: 'Demat Account',
        description: 'Verify through your demat account',
        icon: 'trending-up',
        recommended: false,
      },
      {
        id: 'ATM',
        label: 'ATM (Offline)',
        description: 'Generate EVC through ATM',
        icon: 'credit-card',
        recommended: false,
      },
    ];
  }
}

export const eriService = new ERIService();
export default eriService;

