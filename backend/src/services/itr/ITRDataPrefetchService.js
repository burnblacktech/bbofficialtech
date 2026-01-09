// =====================================================
// ITR DATA PREFETCH SERVICE
// Orchestrates data fetching from multiple sources (ERI, AIS, Form26AS)
// for auto-filling ITR forms
// =====================================================

const eriIntegrationService = require('../eri/ERIIntegrationService');
const { User, FamilyMember } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class ITRDataPrefetchService {
  constructor() {
    // ERIIntegrationService is exported as a singleton instance
    this.eriService = eriIntegrationService;
  }

  /**
   * Prefetch all available data for ITR filing
   * @param {string} userId - User ID
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @param {string} dob - Date of Birth for identity verification
   * @returns {Promise<object>} Consolidated prefetch data
   */
  async prefetchData(userId, pan, assessmentYear = '2024-25', dob) {
    try {
      enterpriseLogger.info('Starting ITR data prefetch', { userId, pan, assessmentYear, dobProvided: !!dob });

      const sources = {
        eri: { available: false, lastSync: null, data: null },
        ais: { available: false, lastSync: null, data: null },
        form26as: { available: false, lastSync: null, data: null },
        userProfile: { available: false, lastSync: null, data: null },
      };

      // Fetch from all sources in parallel
      const [eriData, aisData, form26asData, userProfileData] = await Promise.allSettled([
        this.fetchERIData(pan, assessmentYear, dob),
        this.fetchAISData(userId, pan, assessmentYear),
        this.fetchForm26ASData(userId, pan, assessmentYear),
        this.fetchUserProfileData(userId),
      ]);

      // HARD GATE: Verify DOB if provided and user is fetching for self
      if (userProfileData.status === 'fulfilled' && userProfileData.value && dob) {
        const profileDob = userProfileData.value.personalInfo?.dob;
        // Basic normalization for date comparison (YYYY-MM-DD)
        if (profileDob && dob) {
          const normalizedProfileDob = new Date(profileDob).toISOString().split('T')[0];
          const normalizedProvidedDob = new Date(dob).toISOString().split('T')[0];

          if (normalizedProfileDob !== normalizedProvidedDob) {
            enterpriseLogger.error('DOB mismatch in hard gate', {
              userId,
              profileDob: normalizedProfileDob,
              providedDob: normalizedProvidedDob
            });
            throw new AppError('Date of Birth does not match PAN records.', 400, 'IDENTITY_MISMATCH');
          }
        }
      }

      // Process ERI data
      if (eriData.status === 'fulfilled' && eriData.value) {
        sources.eri = {
          available: true,
          lastSync: new Date().toISOString(),
          data: eriData.value,
        };
      } else if (eriData.status === 'rejected') {
        const errorMsg = eriData.reason?.message || 'ERI connection failed';
        if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('invalid pan')) {
          throw new AppError('PAN format valid but not found in records.', 404, 'PAN_NOT_FOUND');
        }
      }

      // Process AIS data
      if (aisData.status === 'fulfilled' && aisData.value?.success) {
        sources.ais = {
          available: true,
          lastSync: new Date().toISOString(),
          data: aisData.value.data,
        };
      }

      // Process Form26AS data
      if (form26asData.status === 'fulfilled' && form26asData.value?.success) {
        sources.form26as = {
          available: true,
          lastSync: new Date().toISOString(),
          data: form26asData.value.data,
        };
      }

      // Process user profile data
      if (userProfileData.status === 'fulfilled' && userProfileData.value) {
        sources.userProfile = {
          available: true,
          lastSync: new Date().toISOString(),
          data: userProfileData.value,
        };
      }

      // Merge data from all sources with conflict resolution
      const mergedData = this.mergePrefetchData(sources);

      enterpriseLogger.info('ITR data prefetch completed', {
        userId,
        pan,
        sourcesAvailable: Object.values(sources).filter(s => s.available).length,
      });

      return {
        success: true,
        data: mergedData,
        sources,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      enterpriseLogger.error('ITR data prefetch failed', {
        userId,
        pan,
        assessmentYear,
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(`Data prefetch failed: ${error.message}`, 500, 'PREFETCH_FAILURE');
    }
  }

  /**
   * Fetch data from ERI API
   */
  async fetchERIData(pan, assessmentYear, dob) {
    try {
      const previousITRData = await this.eriService.fetchPreviousItrData(pan, assessmentYear, dob);
      return this.mapERIDataToITRFormat(previousITRData);
    } catch (error) {
      enterpriseLogger.warn('ERI data fetch failed', { pan, assessmentYear, error: error.message });
      return null;
    }
  }

  /**
   * Fetch data from AIS
   */
  async fetchAISData(userId, pan, assessmentYear) {
    try {
      // Note: This requires user authentication with Income Tax Portal
      // For now, return mock/empty data structure
      // In production, this would authenticate and fetch real AIS data
      return {
        success: false,
        message: 'AIS authentication required',
      };
    } catch (error) {
      enterpriseLogger.warn('AIS data fetch failed', { userId, pan, assessmentYear, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch data from Form 26AS
   */
  async fetchForm26ASData(userId, pan, assessmentYear) {
    try {
      // Note: This requires user authentication with Income Tax Portal
      // For now, return mock/empty data structure
      // In production, this would authenticate and fetch real Form26AS data
      return {
        success: false,
        message: 'Form26AS authentication required',
      };
    } catch (error) {
      enterpriseLogger.warn('Form26AS data fetch failed', { userId, pan, assessmentYear, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch user profile data
   */
  async fetchUserProfileData(userId) {
    try {
      const UserProfile = require('../../models/UserProfile');

      // Fetch user data
      const user = await User.findByPk(userId, {
        attributes: ['id', 'fullName', 'email', 'phone', 'dateOfBirth', 'panNumber'],
      });

      if (!user) {
        return null;
      }

      // Fetch user profile separately (since association might not be defined)
      const userProfile = await UserProfile.findOne({
        where: { userId: user.id },
        attributes: ['addressLine1', 'addressLine2', 'city', 'state', 'pincode'],
      });

      return {
        personalInfo: {
          full_name: user.fullName || '',
          pan: user.panNumber,
          email: user.email,
          phone: user.phone,
          dob: user.dateOfBirth,
          address: userProfile?.addressLine1 || '',
          addressLine2: userProfile?.addressLine2 || '',
          city: userProfile?.city || '',
          state: userProfile?.state || '',
          pincode: userProfile?.pincode || '',
        },
      };
    } catch (error) {
      enterpriseLogger.warn('User profile data fetch failed', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Map ERI data to ITR form format
   */
  mapERIDataToITRFormat(eriData) {
    if (!eriData) return null;

    return {
      personalInfo: {
        full_name: eriData.name || eriData.fullName,
        pan: eriData.pan,
        email: eriData.email,
        phone: eriData.phone,
        dob: eriData.dateOfBirth || eriData.dob,
        address: eriData.address,
      },
      income: {
        salary: eriData.salaryIncome || eriData.salary || 0,
        interestIncome: eriData.interestIncome || 0,
        dividendIncome: eriData.dividendIncome || 0,
        otherIncome: eriData.otherIncome || 0,
      },
      deductions: {
        section80C: eriData.deductions?.section80C || eriData.section80C || 0,
        section80D: eriData.deductions?.section80D || eriData.section80D || 0,
        section80G: eriData.deductions?.section80G || eriData.section80G || 0,
      },
      taxesPaid: {
        tds: eriData.tds || eriData.taxesPaid?.tds || 0,
        advanceTax: eriData.advanceTax || eriData.taxesPaid?.advanceTax || 0,
        selfAssessmentTax: eriData.selfAssessmentTax || eriData.taxesPaid?.selfAssessmentTax || 0,
      },
      bankDetails: {
        accountNumber: eriData.bankAccountNumber,
        ifsc: eriData.ifscCode,
        bankName: eriData.bankName,
        accountType: eriData.accountType || 'savings',
      },
    };
  }

  /**
   * Map AIS data to ITR form format
   */
  mapAISDataToITRFormat(aisData) {
    if (!aisData || !aisData.success) return null;

    return {
      income: {
        interestIncome: aisData.data?.interestIncome || 0,
        dividendIncome: aisData.data?.dividendIncome || 0,
        otherIncome: aisData.data?.otherIncome || 0,
      },
      taxesPaid: {
        tds: aisData.data?.totalTDS || aisData.data?.tdsDetails?.total || 0,
        advanceTax: aisData.data?.taxPaid?.advanceTax || 0,
      },
    };
  }

  /**
   * Map Form26AS data to ITR form format
   */
  mapForm26ASDataToITRFormat(form26asData) {
    if (!form26asData || !form26asData.success) return null;

    return {
      income: {
        interestIncome: form26asData.data?.interestIncome || 0,
        dividendIncome: form26asData.data?.dividendIncome || 0,
      },
      taxesPaid: {
        tds: form26asData.data?.totalTDS || form26asData.data?.tdsDetails?.total || 0,
        advanceTax: form26asData.data?.taxPaid?.advanceTax || 0,
      },
    };
  }

  /**
   * Merge data from all sources with conflict resolution
   * Priority: AIS > Form26AS > ERI > UserProfile
   */
  mergePrefetchData(sources) {
    const merged = {
      personalInfo: {},
      income: {},
      deductions: {},
      taxesPaid: {},
      bankDetails: {},
    };

    // Merge personal info (UserProfile > ERI)
    if (sources.userProfile?.data?.personalInfo) {
      Object.assign(merged.personalInfo, sources.userProfile.data.personalInfo);
    }
    if (sources.eri?.data?.personalInfo) {
      Object.assign(merged.personalInfo, sources.eri.data.personalInfo);
    }

    // Merge income (AIS > Form26AS > ERI)
    if (sources.ais?.data) {
      const aisMapped = this.mapAISDataToITRFormat({ success: true, data: sources.ais.data });
      if (aisMapped?.income) {
        Object.assign(merged.income, aisMapped.income);
      }
    }
    if (sources.form26as?.data) {
      const form26asMapped = this.mapForm26ASDataToITRFormat({ success: true, data: sources.form26as.data });
      if (form26asMapped?.income) {
        Object.assign(merged.income, form26asMapped.income);
      }
    }
    if (sources.eri?.data?.income) {
      Object.assign(merged.income, sources.eri.data.income);
    }

    // Merge taxes paid (AIS > Form26AS > ERI)
    if (sources.ais?.data) {
      const aisMapped = this.mapAISDataToITRFormat({ success: true, data: sources.ais.data });
      if (aisMapped?.taxesPaid) {
        Object.assign(merged.taxesPaid, aisMapped.taxesPaid);
      }
    }
    if (sources.form26as?.data) {
      const form26asMapped = this.mapForm26ASDataToITRFormat({ success: true, data: sources.form26as.data });
      if (form26asMapped?.taxesPaid) {
        Object.assign(merged.taxesPaid, form26asMapped.taxesPaid);
      }
    }
    if (sources.eri?.data?.taxesPaid) {
      Object.assign(merged.taxesPaid, sources.eri.data.taxesPaid);
    }

    // Merge deductions (ERI only, as AIS/Form26AS don't have this)
    if (sources.eri?.data?.deductions) {
      Object.assign(merged.deductions, sources.eri.data.deductions);
    }

    // Merge bank details (ERI > UserProfile)
    if (sources.eri?.data?.bankDetails) {
      Object.assign(merged.bankDetails, sources.eri.data.bankDetails);
    }

    return merged;
  }
}

module.exports = ITRDataPrefetchService;

