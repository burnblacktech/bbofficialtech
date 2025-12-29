// =====================================================
// SUBMISSION SERVICE
// API service for ITR submission and E-verification
// =====================================================

import apiClient from '../../../services/core/APIClient';

class SubmissionService {
  constructor() {
    this.basePath = '/api/itr';
  }

  /**
   * Send Aadhaar OTP for E-verification
   */
  async sendAadhaarOTP(filingId, aadhaarNumber) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/aadhaar`,
        { aadhaarNumber },
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to send Aadhaar OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send Aadhaar OTP');
    }
  }

  /**
   * Verify Aadhaar OTP
   */
  async verifyAadhaarOTP(filingId, aadhaarNumber, otp) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/aadhaar/verify`,
        { aadhaarNumber, otp },
      );
      return {
        success: true,
        verified: true,
        verificationToken: response.data.verificationToken,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to verify Aadhaar OTP:', error);
      throw new Error(error.response?.data?.message || 'Aadhaar OTP verification failed');
    }
  }

  /**
   * Verify using Net Banking
   */
  async verifyNetBanking(filingId, bankDetails) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/netbanking`,
        { bankDetails, credentials: {} },
      );
      return {
        success: true,
        verified: true,
        verificationToken: response.data.verificationToken,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to verify Net Banking:', error);
      throw new Error(error.response?.data?.message || 'Net banking verification failed');
    }
  }

  /**
   * Verify using Demat Account
   */
  async verifyDemat(filingId, dematCredentials) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/demat`,
        { dematCredentials },
      );
      return {
        success: true,
        verified: true,
        verificationToken: response.data.verificationToken,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to verify Demat:', error);
      throw new Error(error.response?.data?.message || 'Demat verification failed');
    }
  }

  /**
   * Send Bank EVC
   */
  async sendBankEVC(filingId, bankDetails) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/bank-evc/send`,
        bankDetails,
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to send Bank EVC:', error);
      throw new Error(error.response?.data?.message || 'Failed to send Bank EVC');
    }
  }

  /**
   * Verify Bank EVC
   */
  async verifyBankEVC(filingId, bankDetails, evc) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/bank-evc/verify`,
        { bankDetails, evc },
      );
      return {
        success: true,
        verified: true,
        verificationToken: response.data.verificationToken,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to verify Bank EVC:', error);
      throw new Error(error.response?.data?.message || 'Bank EVC verification failed');
    }
  }

  /**
   * Verify using Digital Signature Certificate
   */
  async verifyDSC(filingId, dscFile) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      // For now, we'll send dscDetails object instead of file
      // In production, this would handle file upload properly
      const certificateName = dscFile.name || 'DSC Certificate';
      const certificateSerialNumber = `SN_${Date.now()}`;
      const certificateValidFrom = new Date().toISOString();
      const certificateValidTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const dscDetails = {
        'certificate_name': certificateName,
        'certificate_serial_number': certificateSerialNumber,
        'certificate_valid_from': certificateValidFrom,
        'certificate_valid_to': certificateValidTo,
      };

      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/everify/dsc`,
        { dscDetails },
      );
      return {
        success: true,
        verified: true,
        verificationToken: response.data.verificationToken,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to verify DSC:', error);
      throw new Error(error.response?.data?.message || 'DSC verification failed');
    }
  }

  /**
   * Get verification status for a filing
   */
  async getVerificationStatus(filingId) {
    try {
      const response = await apiClient.get(
        `${this.basePath}/filings/${filingId}/verification`,
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error('Failed to get verification status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get verification status');
    }
  }

  /**
   * Run pre-submission validation
   */
  async runPreSubmissionValidation(filingId, formData) {
    try {
      // Use draftId if provided, otherwise filingId
      const id = filingId;
      const response = await apiClient.post(
        `${this.basePath}/drafts/${id}/validate`,
        formData,
      );
      const payload = response?.data?.data || response?.data || {};
      return {
        success: true,
        ...payload,
      };
    } catch (error) {
      console.error('Validation failed:', error);
      // Return validation results even if API fails (for offline validation)
      return this.runLocalValidation(formData);
    }
  }

  /**
   * Local validation fallback
   */
  runLocalValidation(formData) {
    const errors = [];
    const warnings = [];
    const info = [];
    const sections = [];

    // Validate personal info
    if (!formData.personal_info && !formData.personalInfo) {
      errors.push({
        id: 'personal-info-missing',
        section: 'Personal Information',
        message: 'Personal information is required',
        field: 'personal_info',
      });
    }

    // Validate income
    const hasIncome =
      (formData.income?.salary && formData.income.salary.length > 0) ||
      (formData.income?.house_property && formData.income.house_property.length > 0) ||
      (formData.income?.capital_gains && formData.income.capital_gains.length > 0) ||
      (formData.income?.other_sources && formData.income.other_sources.length > 0);

    if (!hasIncome) {
      warnings.push({
        id: 'no-income',
        section: 'Income',
        message: 'No income sources declared',
        suggestion: 'Please add at least one income source',
      });
    }

    // Section status
    sections.push(
      {
        id: 'personal-info',
        name: 'Personal Information',
        description: 'Basic details and PAN',
        status: formData.personal_info || formData.personalInfo ? 'complete' : 'incomplete',
      },
      {
        id: 'income',
        name: 'Income',
        description: 'All income sources',
        status: hasIncome ? 'complete' : 'incomplete',
      },
      {
        id: 'deductions',
        name: 'Deductions',
        description: 'Chapter VI-A deductions',
        status: formData.deductions ? 'complete' : 'partial',
      },
      {
        id: 'taxes-paid',
        name: 'Taxes Paid',
        description: 'TDS and advance tax',
        status: formData.taxes_paid || formData.taxesPaid ? 'complete' : 'partial',
      },
      {
        id: 'bank-details',
        name: 'Bank Details',
        description: 'Refund account',
        status: formData.bank_details && formData.bank_details.length > 0 ? 'complete' : 'incomplete',
      },
    );

    return {
      errors,
      warnings,
      info,
      sections,
      canProceed: errors.length === 0,
    };
  }

  /**
   * Submit ITR filing
   */
  async submitITR(filingId, verificationToken) {
    const response = await apiClient.post(
      `${this.basePath}/filings/${filingId}/submit`,
      { verificationToken },
    );
    return {
      success: true,
      ...response.data,
    };
  }
}

export const submissionService = new SubmissionService();

