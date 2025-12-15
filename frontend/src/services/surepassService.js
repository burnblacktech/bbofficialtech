// SurePass API Service for PAN Verification
// Provides real-time PAN validation with additional details

import apiClient from './core/APIClient';
import { getApiBaseUrl } from '../utils/apiConfig';

class SurePassService {
  constructor() {
    // No direct SurePass credentials needed - all calls go through our backend API
    this.serviceName = 'SurePassService';
    this.baseURL = getApiBaseUrl();
  }

  // Verify PAN number using our backend API (which calls SurePass)
  async verifyPAN(panNumber) {
    try {
      const response = await apiClient.post('/v2/surepass/verify', {
        pan: panNumber,
        userId: localStorage.getItem('userId'),
        isCAFiling: false,
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          data: {
            pan: data.data.pan || panNumber,
            name: data.data.name || '',
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            status: data.data.status || 'active',
            category: data.data.category || '',
            aadhaarLinked: data.data.aadhaarLinked || false,
            lastUpdated: data.data.lastUpdated || new Date().toISOString(),
            verifiedBy: data.data.verifiedBy || 'SurePass',
            verificationTimestamp: data.data.verificationTimestamp || new Date().toISOString(),
          },
          message: data.message || 'PAN verified successfully',
        };
      } else {
        return {
          success: false,
          error: data.error || 'PAN verification failed',
          code: data.code || 'VERIFICATION_FAILED',
        };
      }
    } catch (error) {
      console.error('SurePass API Error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Network error or API unavailable',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // Validate PAN format before API call
  validatePANFormat(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  // Get PAN verification status with retry logic
  async verifyPANWithRetry(panNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.verifyPAN(panNumber);

        if (result.success) {
          return result;
        }

        // If it's a network error and we have retries left, wait and retry
        if (result.code === 'NETWORK_ERROR' && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: 'Maximum retry attempts exceeded',
            code: 'MAX_RETRIES_EXCEEDED',
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Get additional PAN details using our backend API
  async getPANDetails(panNumber) {
    try {
      const response = await apiClient.post('/v2/surepass/details', {
        pan: panNumber,
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          data: {
            address: data.data.address || '',
            city: data.data.city || '',
            state: data.data.state || '',
            pincode: data.data.pincode || '',
            country: data.data.country || 'India',
            additionalInfo: data.data.additionalInfo || {},
          },
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to retrieve PAN details',
        };
      }
    } catch (error) {
      console.error('SurePass Details API Error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch additional details',
      };
    }
  }

  // Batch PAN verification using our backend API
  async verifyMultiplePANs(panNumbers) {
    try {
      const response = await apiClient.post('/v2/surepass/batch-verify', {
        panNumbers: panNumbers,
      });

      const data = response.data;

      if (data.success) {
        return data.data; // Return the results array directly
      } else {
        return panNumbers.map(pan => ({
          pan,
          success: false,
          error: data.error || 'Batch verification failed',
        }));
      }
    } catch (error) {
      console.error('SurePass Batch API Error:', error);
      return panNumbers.map(pan => ({
        pan,
        success: false,
        error: error.response?.data?.error || error.message,
      }));
    }
  }

  // Check API health using our backend
  async checkAPIHealth() {
    try {
      const response = await apiClient.get('/v2/surepass/health');
      const data = response.data;
      return data.success && data.surepassStatus === 'online';
    } catch (error) {
      console.error('SurePass Health Check Error:', error);
      return false;
    }
  }
}

// Create singleton instance
const surepassService = new SurePassService();

export default surepassService;
