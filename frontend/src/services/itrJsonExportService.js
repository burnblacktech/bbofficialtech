// =====================================================
// ITR JSON EXPORT SERVICE
// Generates government-compliant JSON for ITR filing
// Essential for manual filing while ERI API license is pending
// =====================================================

import { authService } from './';
import apiClient from './core/APIClient';
import { validateITRJson } from '../lib/itrSchemaValidator';
import { getApiBaseUrl } from '../utils/apiConfig';

class ITRJsonExportService {
  constructor() {
    // Will be constructed dynamically using getApiBaseUrl
    this.getApiEndpoint = () => `${getApiBaseUrl()}/itr/export`;
  }

  /**
   * Export ITR data as government-compliant JSON
   * @param {Object} itrData - Complete ITR form data
   * @param {string} itrType - Type of ITR (ITR-1, ITR-2, etc.)
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @returns {Promise<Object>} Export result with download URL
   */
  async exportToJson(itrData, itrType, assessmentYear = '2024-25') {
    try {
      // Get current user info for filing
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to export ITR data');
      }

      // Fetch Schedule FA for ITR-2 and ITR-3
      if (itrType === 'ITR-2' || itrType === 'ITR2' || itrType === 'ITR-3' || itrType === 'ITR3') {
        try {
          const filingId = itrData.filingId || itrData.id;
          if (filingId) {
            const token = apiClient.getAuthToken();
            if (token) {
              const scheduleFAResponse = await fetch(
                `/api/itr/filings/${filingId}/foreign-assets`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                },
              );
              if (scheduleFAResponse.ok) {
                const scheduleFAData = await scheduleFAResponse.json();
                if (scheduleFAData.success && scheduleFAData.assets) {
                  itrData.scheduleFA = {
                    assets: scheduleFAData.assets,
                    totalValue: scheduleFAData.totalValue || 0,
                    totals: scheduleFAData.totals || {},
                  };
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch Schedule FA:', error);
          // Continue without Schedule FA if fetch fails
        }
      }

      // Generate government-compliant JSON structure matching ITD official schema
      const jsonPayload = this.generateITDCompliantJson(itrData, itrType, assessmentYear, user);

      // Validate against ITD schema before export
      const validationResult = validateITRJson(jsonPayload, itrType);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map(e => e.message).join('; ');
        throw new Error(`JSON validation failed: ${errorMessages}`);
      }

      // Call backend to generate downloadable JSON
      const token = apiClient.getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itrData: jsonPayload,
          itrType,
          assessmentYear,
          userId: user.id,
          exportFormat: 'JSON',
          purpose: 'FILING',
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Use ITD-compliant JSON for download (already validated)
      return {
        success: true,
        downloadUrl: result.downloadUrl,
        jsonPayload: jsonPayload, // Use the validated ITD-compliant JSON
        fileName: this.generateFileName(itrType, assessmentYear),
        metadata: {
          itrType,
          assessmentYear,
          generatedAt: new Date().toISOString(),
          fileSize: JSON.stringify(jsonPayload).length,
          checksum: this.generateChecksum(jsonPayload),
          validated: true,
          validationErrors: [],
        },
      };

    } catch (error) {
      console.error('ITR JSON Export Error:', error);
      throw new Error(`Failed to export ITR data: ${error.message}`);
    }
  }

  /**
   * Transform formData structure to expected JSON format
   * Maps frontend formData structure to backend-expected structure
   */
  transformFormDataToExportFormat(formData, itrType) {
    const transformed = {
      personal: {},
      income: {},
      deductions: {},
      taxes: {},
      tds: {},
      bank: {},
      verification: formData.verification || {},
    };

    // Map personalInfo → personal
    if (formData.personalInfo) {
      const nameParts = (formData.personalInfo.name || '').split(' ');
      transformed.personal = {
        pan: formData.personalInfo.pan || '',
        firstName: nameParts[0] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
        dateOfBirth: formData.personalInfo.dateOfBirth || '',
        gender: formData.personalInfo.gender || '',
        residentialStatus: formData.personalInfo.residentialStatus || 'RESIDENT',
        email: formData.personalInfo.email || '',
        phone: formData.personalInfo.phone || '',
        address: {
          flat: formData.personalInfo.address || '',
          city: formData.personalInfo.city || '',
          state: formData.personalInfo.state || '',
          pincode: formData.personalInfo.pincode || '',
          country: 'INDIA',
        },
      };
    }

    // Map income structure
    if (formData.income) {
      // Calculate salary income
      transformed.income.salaryIncome = parseFloat(formData.income.salary || 0);

      // Calculate house property income
      let housePropertyIncome = 0;
      if (formData.income.houseProperty) {
        if (Array.isArray(formData.income.houseProperty)) {
          // Simple array format
          housePropertyIncome = formData.income.houseProperty.reduce((sum, prop) => {
            return sum + (parseFloat(prop.netRentalIncome || prop || 0) || 0);
          }, 0);
        } else if (formData.income.houseProperty.properties && Array.isArray(formData.income.houseProperty.properties)) {
          // ITR-2 structured format
          housePropertyIncome = formData.income.houseProperty.properties.reduce((sum, prop) => {
            const rentalIncome = parseFloat(prop.annualRentalIncome || 0);
            const municipalTaxes = parseFloat(prop.municipalTaxes || 0);
            const interestOnLoan = parseFloat(prop.interestOnLoan || 0);
            const netIncome = Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
            return sum + netIncome;
          }, 0);
        } else {
          // Simple number format
          housePropertyIncome = parseFloat(formData.income.houseProperty || 0);
        }
      }
      transformed.income.housePropertyIncome = housePropertyIncome;

      // Calculate capital gains
      let capitalGainsIncome = 0;
      if (formData.income.capitalGains) {
        if (typeof formData.income.capitalGains === 'object' && formData.income.capitalGains.stcgDetails && formData.income.capitalGains.ltcgDetails) {
          // ITR-2 structured format
          const stcgTotal = (formData.income.capitalGains.stcgDetails || []).reduce(
            (sum, entry) => sum + (parseFloat(entry.gainAmount || 0) || 0),
            0,
          );
          const ltcgTotal = (formData.income.capitalGains.ltcgDetails || []).reduce(
            (sum, entry) => sum + (parseFloat(entry.gainAmount || 0) || 0),
            0,
          );
          capitalGainsIncome = stcgTotal + ltcgTotal;
        } else {
          // Simple number format
          capitalGainsIncome = parseFloat(formData.income.capitalGains || 0);
        }
      }
      transformed.income.capitalGains = capitalGainsIncome;

      // Other income sources
      transformed.income.otherIncome = parseFloat(formData.income.otherIncome || 0);

      // Business income - handle both ITR-3 structure and simple structure
      // Use consolidated structure: formData.income.businessIncome (with fallback for backward compatibility)
      const businessIncome = formData.income?.businessIncome || formData.businessIncome;
      if (businessIncome?.businesses && Array.isArray(businessIncome.businesses)) {
        // ITR-3: Calculate total from businesses array
        const totalBusinessIncome = businessIncome.businesses.reduce((sum, biz) => {
          if (biz.pnl) {
            const pnl = biz.pnl;
            const directExpenses = this.calculateExpenseTotal(pnl.directExpenses);
            const indirectExpenses = this.calculateExpenseTotal(pnl.indirectExpenses);
            const depreciation = this.calculateExpenseTotal(pnl.depreciation);
            const netProfit = (pnl.grossReceipts || 0) +
              (pnl.openingStock || 0) -
              (pnl.closingStock || 0) -
              (pnl.purchases || 0) -
              directExpenses -
              indirectExpenses -
              depreciation -
              (pnl.otherExpenses || 0);
            return sum + netProfit;
          }
          return sum;
        }, 0);
        transformed.income.businessIncome = totalBusinessIncome;
        transformed.businessIncomeDetails = businessIncome;
      } else {
        transformed.income.businessIncome = parseFloat(businessIncome || 0);
      }

      // Professional income - handle both ITR-3 structure and simple structure
      // Use consolidated structure: formData.income.professionalIncome (with fallback for backward compatibility)
      const professionalIncome = formData.income?.professionalIncome || formData.professionalIncome;
      if (professionalIncome?.professions && Array.isArray(professionalIncome.professions)) {
        // ITR-3: Calculate total from professions array
        const totalProfessionalIncome = professionalIncome.professions.reduce((sum, prof) => {
          if (prof.pnl) {
            const pnl = prof.pnl;
            const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
            const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
            const netIncome = (pnl.professionalFees || 0) - expensesTotal - depreciationTotal;
            return sum + netIncome;
          }
          return sum;
        }, 0);
        transformed.income.professionalIncome = totalProfessionalIncome;
        transformed.professionalIncomeDetails = professionalIncome;
      } else {
        transformed.income.professionalIncome = parseFloat(professionalIncome || 0);
      }

      // Store structured data for ITR-2 specific fields
      if (itrType === 'ITR-2' || itrType === 'ITR2') {
        transformed.income.capitalGainsDetails = formData.income.capitalGains;
        transformed.income.housePropertyDetails = formData.income.houseProperty;
        transformed.income.foreignIncomeDetails = formData.income.foreignIncome;
        transformed.income.directorPartnerDetails = formData.income.directorPartner;
      }

      // Store ITR-3 specific structured data
      if (itrType === 'ITR-3' || itrType === 'ITR3') {
        transformed.income.capitalGainsDetails = formData.income.capitalGains;
        transformed.income.housePropertyDetails = formData.income.houseProperty;
        transformed.income.foreignIncomeDetails = formData.income.foreignIncome;
        transformed.income.directorPartnerDetails = formData.income.directorPartner;
        transformed.balanceSheetDetails = formData.balanceSheet;
        transformed.auditInfoDetails = formData.auditInfo;
      }

      // Store ITR-4 specific structured data (presumptive income)
      if (itrType === 'ITR-4' || itrType === 'ITR4') {
        transformed.income.presumptiveBusinessDetails = formData.income.presumptiveBusiness;
        transformed.income.presumptiveProfessionalDetails = formData.income.presumptiveProfessional;
        transformed.income.housePropertyDetails = formData.income.houseProperty;

        // Calculate presumptive income totals
        const presumptiveBusinessIncome = formData.income.presumptiveBusiness?.presumptiveIncome || 0;
        const presumptiveProfessionalIncome = formData.income.presumptiveProfessional?.presumptiveIncome || 0;
        transformed.income.businessIncome = presumptiveBusinessIncome;
        transformed.income.professionalIncome = presumptiveProfessionalIncome;
      }

      // Store ITR-2 specific structured data
      if (itrType === 'ITR-2' || itrType === 'ITR2') {
        // Extract capital gains details
        transformed.income.capitalGainsDetails = formData.income?.capitalGains || {
          hasCapitalGains: false,
          stcgDetails: [],
          ltcgDetails: [],
        };
        // Extract house property details (multiple properties allowed)
        transformed.income.housePropertyDetails = formData.income?.houseProperty || {
          properties: [],
        };
        // Extract foreign income details
        transformed.income.foreignIncomeDetails = formData.income?.foreignIncome || {
          hasForeignIncome: false,
          foreignIncomeDetails: [],
        };
        // Extract director/partner income details
        transformed.income.directorPartnerDetails = formData.income?.directorPartner || {
          isDirector: false,
          directorIncome: 0,
          isPartner: false,
          partnerIncome: 0,
        };
        // Ensure business and professional income are 0 for ITR-2
        transformed.income.businessIncome = 0;
        transformed.income.professionalIncome = 0;
      }

      // Store ITR-1 specific structured data
      if (itrType === 'ITR-1' || itrType === 'ITR1') {
        // Extract salary details from Form 16 or salary income
        transformed.income.salaryDetails = formData.income?.salaryDetails || {
          grossSalary: formData.income?.salary || 0,
          allowances: formData.income?.allowances || {},
          deductions: formData.income?.salaryDeductions || {},
        };
        // Extract house property details (only one property allowed for ITR-1)
        const houseProperties = formData.income?.houseProperty?.properties || [];
        transformed.income.housePropertyDetails = {
          properties: houseProperties.slice(0, 1), // Only first property for ITR-1
          totalIncome: houseProperties.length > 0 ? (houseProperties[0]?.annualValue || 0) : 0,
        };
        // Ensure business and capital gains are 0 for ITR-1
        transformed.income.businessIncome = 0;
        transformed.income.capitalGains = 0;
      }
    }

    // Map deductions
    if (formData.deductions) {
      transformed.deductions = {
        section80C: parseFloat(formData.deductions.section80C || 0),
        section80D: parseFloat(formData.deductions.section80D || 0),
        section80E: parseFloat(formData.deductions.section80E || 0),
        section80G: parseFloat(formData.deductions.section80G || 0),
        section80TTA: parseFloat(formData.deductions.section80TTA || 0),
        section80TTB: parseFloat(formData.deductions.section80TTB || 0),
        otherDeductions: formData.deductions.otherDeductions || {},
      };
    }

    // Map taxesPaid → taxes and tds
    if (formData.taxesPaid) {
      transformed.taxes = {
        advanceTax: parseFloat(formData.taxesPaid.advanceTax || 0),
        selfAssessmentTax: parseFloat(formData.taxesPaid.selfAssessmentTax || 0),
      };
      transformed.tds = {
        totalTDS: parseFloat(formData.taxesPaid.tds || 0),
      };
    }

    // Map bankDetails → bank
    if (formData.bankDetails) {
      transformed.bank = {
        accountNumber: formData.bankDetails.accountNumber || '',
        accountType: formData.bankDetails.accountType || 'SAVINGS',
        bankName: formData.bankDetails.bankName || '',
        branchName: formData.bankDetails.branchName || '',
        ifscCode: formData.bankDetails.ifsc || '',
        micrCode: formData.bankDetails.micr || '',
      };
    }

    return transformed;
  }

  /**
   * Generate ITD-compliant JSON structure
   * Routes to ITR-specific generation methods based on ITR type
   */
  generateITDCompliantJson(itrData, itrType, assessmentYear, user) {
    const normalizedITRType = this.normalizeITRType(itrType);

    switch (normalizedITRType) {
      case 'ITR-1':
      case 'ITR1':
        return this.generateITR1Json(itrData, assessmentYear, user);
      case 'ITR-2':
      case 'ITR2':
        return this.generateITR2Json(itrData, assessmentYear, user);
      case 'ITR-3':
      case 'ITR3':
        return this.generateITR3Json(itrData, assessmentYear, user);
      case 'ITR-4':
      case 'ITR4':
        return this.generateITR4Json(itrData, assessmentYear, user);
      default:
        throw new Error(`Unsupported ITR type: ${itrType}`);
    }
  }

  /**
   * Normalize ITR type string
   */
  normalizeITRType(itrType) {
    if (!itrType) return 'ITR-1';
    const normalized = itrType.toUpperCase().trim();
    if (normalized === 'ITR1') return 'ITR-1';
    if (normalized === 'ITR2') return 'ITR-2';
    if (normalized === 'ITR3') return 'ITR-3';
    if (normalized === 'ITR4') return 'ITR-4';
    return normalized;
  }

  /**
   * Generate ITR-1 (Sahaj) JSON - Official ITD Schema Format
   */
  generateITR1Json(itrData, assessmentYear, user) {
    const transformedData = this.transformFormDataToExportFormat(itrData, 'ITR-1');
    const personalInfo = transformedData.personal || {};
    const income = transformedData.income || {};
    const deductions = transformedData.deductions || {};
    const taxes = transformedData.taxes || {};
    const tds = transformedData.tds || {};
    const bank = transformedData.bank || {};

    // Calculate totals
    const grossSalary = parseFloat(income.salaryIncome || 0);
    const salary16ia = parseFloat(income.salary16ia || 0); // Standard deduction
    const professionalTax = parseFloat(income.professionalTax || 0);
    const netSalary = Math.max(0, grossSalary - salary16ia - professionalTax);

    const incomeFromHP = parseFloat(income.housePropertyIncome || 0);
    const incFromOthSources = parseFloat(income.otherIncome || 0);
    const grossTotIncome = grossSalary + incomeFromHP + incFromOthSources;

    const deductUndChapVIA = parseFloat(deductions.section80C || 0) +
                             parseFloat(deductions.section80D || 0) +
                             parseFloat(deductions.section80E || 0) +
                             parseFloat(deductions.section80G || 0) +
                             parseFloat(deductions.section80TTA || 0);
    const totalIncome = Math.max(0, grossTotIncome - deductUndChapVIA);

    // Calculate tax payable
    const taxPayableOnTI = this.calculateTaxPayable(totalIncome);

    // Format name
    const fullName = personalInfo.firstName && personalInfo.lastName
      ? `${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`.trim()
      : user.fullName || user.name || '';

    // Format DOB (ITD expects DD/MM/YYYY)
    const dob = this.formatDateForITD(personalInfo.dateOfBirth || user.dateOfBirth);

    // Format address
    const address = personalInfo.address || {};

    return {
      // eslint-disable-next-line camelcase
      Form_ITR1: {
        // eslint-disable-next-line camelcase
        PartA_GEN1: {
          PersonalInfo: {
            PAN: (personalInfo.pan || user.pan || '').toUpperCase(),
            AssesseeName: fullName,
            DOB: dob,
            AadhaarCardNo: personalInfo.aadhaar || user.aadhaarNumber || '',
          },
          FilingStatus: {
            ReturnFileSec: '139(1)', // Regular filing
            SesTypeReturn: 'ORIGINAL', // Original return
          },
          AddressDetails: {
            FlatDoorBuildingBlockNo: address.flat || address.addressLine1 || '',
            AreaLocality: address.area || address.addressLine2 || '',
            CityTownDistrict: address.city || '',
            StateCode: this.getStateCode(address.state || ''),
            PinCode: address.pincode || '',
          },
        },
        // eslint-disable-next-line camelcase
        PartB_TI: {
          Salaries: {
            GrossSalary: this.formatAmount(grossSalary),
            Salary16ia: this.formatAmount(salary16ia),
            ProfessionalTaxUs16iii: this.formatAmount(professionalTax),
            NetSalary: this.formatAmount(netSalary),
          },
          IncomeFromHP: {
            AnnualValue: this.formatAmount(incomeFromHP),
            NetAnnualValue: this.formatAmount(incomeFromHP),
            DeductionUs24: this.formatAmount(0),
            IncomeFromHP: this.formatAmount(incomeFromHP),
          },
          IncFromOthSources: {
            InterestIncome: this.formatAmount(incFromOthSources),
            OtherIncome: this.formatAmount(0),
            TotalOthSrcInc: this.formatAmount(incFromOthSources),
          },
        },
        // eslint-disable-next-line camelcase
        PartB_TTI: {
          GrossTotIncome: this.formatAmount(grossTotIncome),
          DeductUndChapVIA: this.formatAmount(deductUndChapVIA),
          TotalIncome: this.formatAmount(totalIncome),
          TaxPayableOnTI: this.formatAmount(taxPayableOnTI),
        },
        PartC: {
          TaxesPaid: {
            AdvanceTax: this.formatAmount(taxes.advanceTax || 0),
            SelfAssessmentTax: this.formatAmount(taxes.selfAssessmentTax || 0),
            TotalTaxesPaid: this.formatAmount((taxes.advanceTax || 0) + (taxes.selfAssessmentTax || 0)),
          },
          TDS: {
            TotalTDS: this.formatAmount(tds.totalTDS || 0),
          },
          BankDetails: {
            AccountNumber: bank.accountNumber || '',
            IFSCCode: bank.ifscCode || '',
            BankName: bank.bankName || '',
          },
        },
        PartD: {
          RefundOrTaxPayable: {
            RefundDue: this.formatAmount(Math.max(0, (tds.totalTDS || 0) + (taxes.advanceTax || 0) - taxPayableOnTI)),
            BalTaxPayable: this.formatAmount(Math.max(0, taxPayableOnTI - (tds.totalTDS || 0) - (taxes.advanceTax || 0))),
          },
        },
        Verification: {
          Declaration: 'I declare that the information furnished above is true to the best of my knowledge and belief.',
          Place: address.city || user.address?.city || '',
          Date: this.formatDateForITD(new Date().toISOString()),
        },
      },
    };
  }

  /**
   * Generate ITR-2 JSON - Official ITD Schema Format
   */
  generateITR2Json(itrData, assessmentYear, user) {
    const transformedData = this.transformFormDataToExportFormat(itrData, 'ITR-2');
    const personalInfo = transformedData.personal || {};
    const income = transformedData.income || {};

    // Format name and DOB
    const fullName = personalInfo.firstName && personalInfo.lastName
      ? `${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`.trim()
      : user.fullName || user.name || '';
    const dob = this.formatDateForITD(personalInfo.dateOfBirth || user.dateOfBirth);
    const address = personalInfo.address || {};

    return {
      // eslint-disable-next-line camelcase
      Form_ITR2: {
        // eslint-disable-next-line camelcase
        PartA_GEN: {
          PersonalInfo: {
            PAN: (personalInfo.pan || user.pan || '').toUpperCase(),
            AssesseeName: fullName,
            DOB: dob,
            AadhaarCardNo: personalInfo.aadhaar || user.aadhaarNumber || '',
          },
          FilingStatus: {
            ReturnFileSec: '139(1)',
            SesTypeReturn: 'ORIGINAL',
          },
          AddressDetails: {
            FlatDoorBuildingBlockNo: address.flat || address.addressLine1 || '',
            AreaLocality: address.area || address.addressLine2 || '',
            CityTownDistrict: address.city || '',
            StateCode: this.getStateCode(address.state || ''),
            PinCode: address.pincode || '',
          },
        },
        ScheduleS: {
          GrossSalary: this.formatAmount(income.salaryIncome || 0),
          NetSalary: this.formatAmount(income.salaryIncome || 0),
        },
        ScheduleHP: this.formatHousePropertySchedule(income.housePropertyDetails || income.houseProperty),
        ScheduleCG: this.formatCapitalGainsSchedule(income.capitalGainsDetails || income.capitalGains),
        ScheduleOS: {
          InterestIncome: this.formatAmount(income.otherIncome || 0),
          OtherIncome: this.formatAmount(0),
        },
        ScheduleVIA: this.formatDeductionsSchedule(transformedData.deductions || {}),
        // eslint-disable-next-line camelcase
        PartB_TI: {
          GrossTotIncome: this.formatAmount(
            (income.salaryIncome || 0) +
            (income.housePropertyIncome || 0) +
            (income.capitalGains || 0) +
            (income.otherIncome || 0),
          ),
        },
        // eslint-disable-next-line camelcase
        PartB_TTI: {
          TotalIncome: this.formatAmount(0), // Will be calculated
          TaxPayableOnTI: this.formatAmount(0), // Will be calculated
        },
        Schedule80G: {
          Total80G: this.formatAmount(transformedData.deductions?.section80G || 0),
        },
        ScheduleTDS1: {
          TotalTDS: this.formatAmount(transformedData.tds?.totalTDS || 0),
        },
        ScheduleTDS2: {},
        ScheduleIT: {
          AdvanceTax: this.formatAmount(transformedData.taxes?.advanceTax || 0),
          SelfAssessmentTax: this.formatAmount(transformedData.taxes?.selfAssessmentTax || 0),
        },
        ScheduleAL: {},
        ScheduleFA: this.formatScheduleFAForExport(itrData.scheduleFA),
        Verification: {
          Declaration: 'I declare that the information furnished above is true to the best of my knowledge and belief.',
          Place: address.city || user.address?.city || '',
          Date: this.formatDateForITD(new Date().toISOString()),
        },
      },
    };
  }

  /**
   * Generate ITR-3 JSON - Official ITD Schema Format
   */
  generateITR3Json(itrData, assessmentYear, user) {
    const transformedData = this.transformFormDataToExportFormat(itrData, 'ITR-3');
    const personalInfo = transformedData.personal || {};

    const fullName = personalInfo.firstName && personalInfo.lastName
      ? `${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`.trim()
      : user.fullName || user.name || '';
    const dob = this.formatDateForITD(personalInfo.dateOfBirth || user.dateOfBirth);
    const address = personalInfo.address || {};

    return {
      // eslint-disable-next-line camelcase
      Form_ITR3: {
        // eslint-disable-next-line camelcase
        PartA_GEN: {
          PersonalInfo: {
            PAN: (personalInfo.pan || user.pan || '').toUpperCase(),
            AssesseeName: fullName,
            DOB: dob,
            AadhaarCardNo: personalInfo.aadhaar || user.aadhaarNumber || '',
          },
          FilingStatus: {
            ReturnFileSec: '139(1)',
            SesTypeReturn: 'ORIGINAL',
          },
          AddressDetails: {
            FlatDoorBuildingBlockNo: address.flat || address.addressLine1 || '',
            AreaLocality: address.area || address.addressLine2 || '',
            CityTownDistrict: address.city || '',
            StateCode: this.getStateCode(address.state || ''),
            PinCode: address.pincode || '',
          },
        },
        ScheduleS: {
          GrossSalary: this.formatAmount(transformedData.income?.salaryIncome || 0),
        },
        ScheduleHP: this.formatHousePropertySchedule(transformedData.income?.housePropertyDetails),
        ScheduleBP: this.formatBusinessIncomeSchedule(transformedData.businessIncomeDetails || transformedData.income?.businessIncome),
        ScheduleCG: this.formatCapitalGainsSchedule(transformedData.income?.capitalGainsDetails),
        ScheduleOS: {
          InterestIncome: this.formatAmount(transformedData.income?.otherIncome || 0),
        },
        ScheduleVIA: this.formatDeductionsSchedule(transformedData.deductions || {}),
        ScheduleCYLA: {},
        ScheduleBFLA: {},
        // eslint-disable-next-line camelcase
        PartB_TI: {
          GrossTotIncome: this.formatAmount(0), // Calculated
        },
        // eslint-disable-next-line camelcase
        PartB_TTI: {
          TotalIncome: this.formatAmount(0), // Calculated
          TaxPayableOnTI: this.formatAmount(0), // Calculated
        },
        // eslint-disable-next-line camelcase
        PartA_BS: this.formatBalanceSheet(transformedData.balanceSheetDetails || itrData.balanceSheet),
        // eslint-disable-next-line camelcase
        PartA_PL: this.formatProfitLoss(transformedData.balanceSheetDetails || itrData.balanceSheet),
        Schedule80G: {
          Total80G: this.formatAmount(transformedData.deductions?.section80G || 0),
        },
        ScheduleTDS1: {
          TotalTDS: this.formatAmount(transformedData.tds?.totalTDS || 0),
        },
        ScheduleTDS2: {},
        ScheduleIT: {
          AdvanceTax: this.formatAmount(transformedData.taxes?.advanceTax || 0),
          SelfAssessmentTax: this.formatAmount(transformedData.taxes?.selfAssessmentTax || 0),
        },
        ScheduleAL: {},
        ScheduleFA: this.formatScheduleFAForExport(itrData.scheduleFA),
        Verification: {
          Declaration: 'I declare that the information furnished above is true to the best of my knowledge and belief.',
          Place: address.city || user.address?.city || '',
          Date: this.formatDateForITD(new Date().toISOString()),
        },
      },
    };
  }

  /**
   * Generate ITR-4 (Sugam) JSON - Official ITD Schema Format
   */
  generateITR4Json(itrData, assessmentYear, user) {
    const transformedData = this.transformFormDataToExportFormat(itrData, 'ITR-4');
    const personalInfo = transformedData.personal || {};
    const fullName = personalInfo.firstName && personalInfo.lastName
      ? `${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`.trim()
      : user.fullName || user.name || '';
    const dob = this.formatDateForITD(personalInfo.dateOfBirth || user.dateOfBirth);
    const address = personalInfo.address || {};

    const presumptiveBusiness = transformedData.income?.presumptiveBusinessDetails || transformedData.income?.presumptiveBusiness || {};
    const presumptiveProfessional = transformedData.income?.presumptiveProfessionalDetails || transformedData.income?.presumptiveProfessional || {};

    return {
      // eslint-disable-next-line camelcase
      Form_ITR4: {
        // eslint-disable-next-line camelcase
        PartA_GEN1: {
          PersonalInfo: {
            PAN: (personalInfo.pan || user.pan || '').toUpperCase(),
            AssesseeName: fullName,
            DOB: dob,
            AadhaarCardNo: personalInfo.aadhaar || user.aadhaarNumber || '',
          },
          FilingStatus: {
            ReturnFileSec: '139(1)',
            SesTypeReturn: 'ORIGINAL',
          },
          AddressDetails: {
            FlatDoorBuildingBlockNo: address.flat || address.addressLine1 || '',
            AreaLocality: address.area || address.addressLine2 || '',
            CityTownDistrict: address.city || '',
            StateCode: this.getStateCode(address.state || ''),
            PinCode: address.pincode || '',
          },
        },
        ScheduleBP: {
          NatOfBus44AD: presumptiveBusiness.hasPresumptiveBusiness ? 'YES' : 'NO',
          PresumpIncDtls: {
            TotPresumpBusInc: this.formatAmount(presumptiveBusiness.presumptiveIncome || 0),
            GrossTurnoverReceipts: this.formatAmount(presumptiveBusiness.grossTurnover || 0),
          },
          PresumpProfDtls: presumptiveProfessional.hasPresumptiveProfessional ? {
            PresumpProfInc: this.formatAmount(presumptiveProfessional.presumptiveIncome || 0),
            GrossReceipts: this.formatAmount(presumptiveProfessional.grossReceipts || 0),
          } : {},
          Section44AE: this.formatSection44AEForExport(itrData.goodsCarriage || itrData.income?.goodsCarriage),
        },
        ScheduleVIA: this.formatDeductionsSchedule(transformedData.deductions || {}),
        // eslint-disable-next-line camelcase
        PartB_TI: {
          GrossTotIncome: this.formatAmount(
            (presumptiveBusiness.presumptiveIncome || 0) +
            (presumptiveProfessional.presumptiveIncome || 0) +
            (transformedData.income?.housePropertyIncome || 0) +
            (transformedData.income?.salaryIncome || 0),
          ),
        },
        // eslint-disable-next-line camelcase
        PartB_TTI: {
          TotalIncome: this.formatAmount(0), // Calculated
          TaxPayableOnTI: this.formatAmount(0), // Calculated
        },
        PartC: {
          TaxesPaid: {
            AdvanceTax: this.formatAmount(transformedData.taxes?.advanceTax || 0),
            SelfAssessmentTax: this.formatAmount(transformedData.taxes?.selfAssessmentTax || 0),
          },
          TDS: {
            TotalTDS: this.formatAmount(transformedData.tds?.totalTDS || 0),
          },
        },
        Verification: {
          Declaration: 'I declare that the information furnished above is true to the best of my knowledge and belief.',
          Place: address.city || user.address?.city || '',
          Date: this.formatDateForITD(new Date().toISOString()),
        },
      },
    };
  }

  /**
   * Generate client-side JSON for immediate download
   */
  generateClientJson(itrData, itrType, assessmentYear, user) {
    const currentDate = new Date().toISOString();
    const transformedData = this.transformFormDataToExportFormat(itrData, itrType);

    return {
      // Metadata
      'metadata': {
        'itrType': itrType,
        'assessmentYear': assessmentYear,
        'generatedAt': currentDate,
        'generatedBy': 'BurnBlack ITR Platform',
        'version': '1.0',
        'purpose': 'TAX_FILING',
        'format': 'GOVT_COMPLIANT',
      },

      // Taxpayer information
      'taxpayer': {
        'pan': transformedData.personal?.pan || user.pan || '',
        'name': `${transformedData.personal?.firstName || user.firstName || ''} ${transformedData.personal?.lastName || user.lastName || ''}`,
        'email': transformedData.personal?.email || user.email || '',
        'phone': transformedData.personal?.phone || user.phone || '',
        'address': transformedData.personal?.address || user.address || {},
      },

      // Complete form data (transformed)
      'formData': transformedData,

      // Original form data for reference
      'originalFormData': itrData,

      // Calculations
      'calculations': {
        'grossIncome': this.calculateGrossIncome(itrData),
        'totalDeductions': this.calculateTotalDeductions(itrData),
        'taxableIncome': this.calculateTaxableIncome(itrData),
        'totalTax': this.calculateTotalTax(itrData),
      },

      // Download information
      'downloadInfo': {
        'fileName': this.generateFileName(itrType, assessmentYear),
        'instructions': [
          '1. Download this JSON file',
          '2. Visit Income Tax Department e-filing portal',
          '3. Go to "Upload Return" section',
          '4. Select "Upload JSON" option',
          '5. Upload this JSON file',
          '6. Verify the data and submit',
          '7. Download acknowledgement',
        ],
      },
    };
  }

  /**
   * Format date for ITD (DD/MM/YYYY format)
   */
  formatDateForITD(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString; // Return as-is if parsing fails
    }
  }

  /**
   * Get state code from state name
   */
  getStateCode(stateName) {
    if (!stateName) return '';
    // Common state codes mapping (simplified - can be expanded)
    const stateCodeMap = {
      'ANDHRA PRADESH': '37',
      'ARUNACHAL PRADESH': '12',
      'ASSAM': '18',
      'BIHAR': '10',
      'CHHATTISGARH': '22',
      'GOA': '30',
      'GUJARAT': '24',
      'HARYANA': '06',
      'HIMACHAL PRADESH': '02',
      'JAMMU AND KASHMIR': '01',
      'JHARKHAND': '20',
      'KARNATAKA': '29',
      'KERALA': '32',
      'MADHYA PRADESH': '23',
      'MAHARASHTRA': '27',
      'MANIPUR': '14',
      'MEGHALAYA': '17',
      'MIZORAM': '15',
      'NAGALAND': '13',
      'ODISHA': '21',
      'PUNJAB': '03',
      'RAJASTHAN': '08',
      'SIKKIM': '11',
      'TAMIL NADU': '33',
      'TELANGANA': '36',
      'TRIPURA': '16',
      'UTTAR PRADESH': '09',
      'UTTARAKHAND': '05',
      'WEST BENGAL': '19',
      'DELHI': '07',
      'PUDUCHERRY': '34',
    };
    const upperState = stateName.toUpperCase();
    return stateCodeMap[upperState] || '';
  }

  /**
   * Format house property schedule
   */
  formatHousePropertySchedule(houseProperty) {
    if (!houseProperty) {
      return {
        AnnualValue: this.formatAmount(0),
        NetAnnualValue: this.formatAmount(0),
        DeductionUs24: this.formatAmount(0),
        IncomeFromHP: this.formatAmount(0),
      };
    }

    if (Array.isArray(houseProperty.properties)) {
      // Multiple properties - sum them up
      const total = houseProperty.properties.reduce((sum, prop) => {
        const rentalIncome = parseFloat(prop.annualRentalIncome || 0);
        const municipalTaxes = parseFloat(prop.municipalTaxes || 0);
        const interestOnLoan = parseFloat(prop.interestOnLoan || 0);
        return sum + Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
      }, 0);
      return {
        AnnualValue: this.formatAmount(total),
        NetAnnualValue: this.formatAmount(total),
        DeductionUs24: this.formatAmount(0),
        IncomeFromHP: this.formatAmount(total),
      };
    }
    const annualValue = parseFloat(houseProperty.annualRentalIncome || houseProperty || 0);
    return {
      AnnualValue: this.formatAmount(annualValue),
      NetAnnualValue: this.formatAmount(annualValue),
      DeductionUs24: this.formatAmount(0),
      IncomeFromHP: this.formatAmount(annualValue),
    };
  }

  /**
   * Format Schedule FA (Foreign Assets) for export
   */
  formatScheduleFAForExport(scheduleFA) {
    if (!scheduleFA || !scheduleFA.assets || scheduleFA.assets.length === 0) {
      return {
        BankAccounts: [],
        EquityHoldings: [],
        ImmovableProperties: [],
        OtherAssets: [],
        TotalValue: this.formatAmount(0),
      };
    }

    const bankAccounts = [];
    const equityHoldings = [];
    const immovableProperties = [];
    const otherAssets = [];

    scheduleFA.assets.forEach((asset) => {
      const assetData = {
        Country: asset.country || '',
        ValuationDate: this.formatDateForITD(asset.valuationDate || asset.valuation_date),
        ValuationAmountINR: this.formatAmount(asset.valuationAmountInr || asset.valuation_amount_inr || 0),
        ValuationAmountForeign: this.formatAmount(asset.valuationAmountForeign || asset.valuation_amount_foreign || 0),
        Currency: asset.assetDetails?.currency || asset.asset_details?.currency || '',
      };

      switch (asset.assetType || asset.asset_type) {
        case 'bank_account':
          bankAccounts.push({
            ...assetData,
            BankName: asset.assetDetails?.bankName || asset.asset_details?.bankName || '',
            AccountNumber: asset.assetDetails?.accountNumber || asset.asset_details?.accountNumber || '',
            AccountType: asset.assetDetails?.accountType || asset.asset_details?.accountType || '',
          });
          break;
        case 'equity_holding':
          equityHoldings.push({
            ...assetData,
            CompanyName: asset.assetDetails?.companyName || asset.asset_details?.companyName || '',
            NumberOfShares: asset.assetDetails?.numberOfShares || asset.asset_details?.numberOfShares || 0,
          });
          break;
        case 'immovable_property':
          immovableProperties.push({
            ...assetData,
            PropertyAddress: asset.assetDetails?.address || asset.asset_details?.address || '',
            PropertyType: asset.assetDetails?.propertyType || asset.asset_details?.propertyType || '',
          });
          break;
        case 'other':
          otherAssets.push({
            ...assetData,
            AssetDescription: asset.assetDetails?.description || asset.asset_details?.description || '',
          });
          break;
      }
    });

    return {
      BankAccounts: bankAccounts,
      EquityHoldings: equityHoldings,
      ImmovableProperties: immovableProperties,
      OtherAssets: otherAssets,
      TotalValue: this.formatAmount(scheduleFA.totalValue || scheduleFA.totals?.totalValue || 0),
    };
  }

  /**
   * Format Section 44AE (Goods Carriage) for export
   */
  formatSection44AEForExport(goodsCarriage) {
    if (!goodsCarriage || !goodsCarriage.hasGoodsCarriage) {
      return {
        HasGoodsCarriage: false,
        Vehicles: [],
        TotalPresumptiveIncome: this.formatAmount(0),
        TotalVehicles: 0,
      };
    }

    const vehicles = (goodsCarriage.vehicles || []).map((vehicle) => {
      const monthsOwned = vehicle.monthsOwned || 12;
      let presumptiveIncome = 0;

      if (vehicle.type === 'heavy_goods') {
        const tons = vehicle.gvw || 12;
        presumptiveIncome = 1000 * tons * monthsOwned;
      } else {
        presumptiveIncome = 7500 * monthsOwned;
      }

      return {
        VehicleType: vehicle.type === 'heavy_goods' ? 'Heavy Goods Vehicle' : 'Other Goods Vehicle',
        RegistrationNumber: vehicle.registrationNo || vehicle.registrationNumber || '',
        GrossVehicleWeight: this.formatAmount(vehicle.gvw || 0),
        MonthsOwned: monthsOwned,
        OwnedOrLeased: vehicle.ownedOrLeased || 'owned',
        PresumptiveIncome: this.formatAmount(presumptiveIncome),
      };
    });

    return {
      HasGoodsCarriage: true,
      Vehicles: vehicles,
      TotalPresumptiveIncome: this.formatAmount(goodsCarriage.totalPresumptiveIncome || 0),
      TotalVehicles: goodsCarriage.totalVehicles || vehicles.length || 0,
    };
  }

  /**
   * Format capital gains schedule
   */
  formatCapitalGainsSchedule(capitalGains) {
    if (!capitalGains) {
      return {
        STCG: this.formatAmount(0),
        LTCG: this.formatAmount(0),
        TotalCapitalGains: this.formatAmount(0),
      };
    }
    if (capitalGains.stcgDetails && capitalGains.ltcgDetails) {
      const stcg = (capitalGains.stcgDetails || []).reduce((sum, entry) =>
        sum + parseFloat(entry.gainAmount || 0), 0);
      const ltcg = (capitalGains.ltcgDetails || []).reduce((sum, entry) =>
        sum + parseFloat(entry.gainAmount || 0), 0);
      return {
        STCG: this.formatAmount(stcg),
        LTCG: this.formatAmount(ltcg),
        TotalCapitalGains: this.formatAmount(stcg + ltcg),
      };
    }
    const total = parseFloat(capitalGains || 0);
    return {
      STCG: this.formatAmount(0),
      LTCG: this.formatAmount(total),
      TotalCapitalGains: this.formatAmount(total),
    };
  }

  /**
   * Format deductions schedule (Schedule VIA)
   */
  formatDeductionsSchedule(deductions) {
    return {
      Section80C: this.formatAmount(deductions.section80C || 0),
      Section80D: this.formatAmount(deductions.section80D || 0),
      Section80E: this.formatAmount(deductions.section80E || 0),
      Section80G: this.formatAmount(deductions.section80G || 0),
      Section80TTA: this.formatAmount(deductions.section80TTA || 0),
      Section80TTB: this.formatAmount(deductions.section80TTB || 0),
      TotalDeductions: this.formatAmount(
        (deductions.section80C || 0) +
        (deductions.section80D || 0) +
        (deductions.section80E || 0) +
        (deductions.section80G || 0) +
        (deductions.section80TTA || 0) +
        (deductions.section80TTB || 0),
      ),
    };
  }

  /**
   * Format business income schedule
   */
  formatBusinessIncomeSchedule(businessIncome) {
    if (!businessIncome) return {};
    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      const total = businessIncome.businesses.reduce((sum, biz) => {
        if (biz.pnl) {
          const pnl = biz.pnl;
          const directExpenses = this.calculateExpenseTotal(pnl.directExpenses);
          const indirectExpenses = this.calculateExpenseTotal(pnl.indirectExpenses);
          const depreciation = this.calculateExpenseTotal(pnl.depreciation);
          const netProfit = (pnl.grossReceipts || 0) +
            (pnl.openingStock || 0) -
            (pnl.closingStock || 0) -
            (pnl.purchases || 0) -
            directExpenses -
            indirectExpenses -
            depreciation -
            (pnl.otherExpenses || 0);
          return sum + netProfit;
        }
        return sum;
      }, 0);
      return {
        NetBusinessIncome: this.formatAmount(total),
      };
    }
    return {
      NetBusinessIncome: this.formatAmount(businessIncome || 0),
    };
  }

  /**
   * Format balance sheet
   */
  formatBalanceSheet(balanceSheet) {
    if (!balanceSheet || !balanceSheet.hasBalanceSheet) {
      return { maintained: false };
    }
    return {
      maintained: true,
      assets: balanceSheet.assets || {},
      liabilities: balanceSheet.liabilities || {},
    };
  }

  /**
   * Format profit and loss statement
   */
  formatProfitLoss(balanceSheet) {
    if (!balanceSheet || !balanceSheet.hasBalanceSheet) {
      return { maintained: false };
    }
    return {
      maintained: true,
      income: balanceSheet.income || {},
      expenses: balanceSheet.expenses || {},
    };
  }

  /**
   * Calculate tax payable based on income
   */
  calculateTaxPayable(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    if (taxableIncome <= 250000) return 0;
    if (taxableIncome <= 500000) {
      return (taxableIncome - 250000) * 0.05;
    }
    if (taxableIncome <= 1000000) {
      return 12500 + (taxableIncome - 500000) * 0.2;
    }
    return 112500 + (taxableIncome - 1000000) * 0.3;
  }

  /**
   * Calculate derived financial values
   */
  calculateDerivedValues(jsonData) {
    const incomeDetails = jsonData.Income_Details;
    const deductions = jsonData.Deductions;

    // Calculate total gross income
    // eslint-disable-next-line camelcase
    incomeDetails.Total_Gross_Income = this.formatAmount(
      parseFloat(incomeDetails.Income_from_Salary || 0) +
      parseFloat(incomeDetails.Income_from_House_Property || 0) +
      parseFloat(incomeDetails.Income_from_Other_Sources || 0) +
      parseFloat(incomeDetails.Business_Income || 0) +
      parseFloat(incomeDetails.Capital_Gains || 0),
    );

    // Calculate total deductions
    // eslint-disable-next-line camelcase
    deductions.Total_Deductions = this.formatAmount(
      parseFloat(deductions.Section_80C || 0) +
      parseFloat(deductions.Section_80D || 0) +
      parseFloat(deductions.Section_80E || 0) +
      parseFloat(deductions.Section_80G || 0) +
      parseFloat(deductions.Section_80TTA || 0),
    );

    // Calculate taxable income
    const taxableIncome = parseFloat(incomeDetails.Total_Gross_Income) - parseFloat(deductions.Total_Deductions);

    // Calculate tax (simplified calculation - actual tax slabs would be more complex)
    let taxLiability = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 250000) {
        taxLiability = 0;
      } else if (taxableIncome <= 500000) {
        taxLiability = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        taxLiability = 12500 + (taxableIncome - 500000) * 0.2;
      } else {
        taxLiability = 112500 + (taxableIncome - 1000000) * 0.3;
      }
    }

    // eslint-disable-next-line camelcase
    jsonData.Tax_Calculation.Total_Income = this.formatAmount(taxableIncome);
    // eslint-disable-next-line camelcase
    jsonData.Tax_Calculation.Total_Tax_Liability = this.formatAmount(taxLiability);
    // eslint-disable-next-line camelcase
    jsonData.Tax_Calculation.Education_Cess = this.formatAmount(taxLiability * 0.04); // 4% education cess
    // eslint-disable-next-line camelcase
    jsonData.Tax_Calculation.Total_Tax_Payable = this.formatAmount(
      parseFloat(jsonData.Tax_Calculation.Total_Tax_Liability) +
      parseFloat(jsonData.Tax_Calculation.Education_Cess),
    );

    // Calculate total tax paid
    // eslint-disable-next-line camelcase
    jsonData.Tax_Calculation.Total_Tax_Paid = this.formatAmount(
      parseFloat(jsonData.Tax_Calculation.TDS_TCS) +
      parseFloat(jsonData.Tax_Calculation.Advance_Tax) +
      parseFloat(jsonData.Tax_Calculation.Self_Assessment_Tax),
    );
  }

  /**
   * Add ITR type specific fields
   */
  addITRTypeSpecificFields(jsonData, itrData, itrType) {
    switch (itrType) {
      case 'ITR-1':
      case 'ITR1':
        // ITR-1 specific fields
        // eslint-disable-next-line camelcase
        jsonData.ITR1_Specific = {
          'Income_from_Salary_Detailed': itrData.income?.salaryDetails || {
            grossSalary: itrData.income?.salary || 0,
            allowances: {},
            deductions: {},
          },
          'Income_from_House_Property_Detailed': itrData.income?.housePropertyDetails || {
            properties: (itrData.income?.houseProperty?.properties || []).slice(0, 1),
            totalIncome: 0,
          },
          'Business_Income_Already_Covered': 'NO',
          'Capital_Gains_Already_Covered': 'NO',
        };
        break;

      case 'ITR-2':
      case 'ITR2':
        // ITR-2 specific fields (for capital gains, foreign income, multiple properties)
        // eslint-disable-next-line camelcase
        jsonData.ITR2_Specific = {
          'Capital_Gains_Detailed': itrData.income?.capitalGainsDetails || {},
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Foreign_Income_Details': itrData.income?.foreignIncomeDetails || {},
          'Director_Partner_Income': itrData.income?.directorPartnerDetails || {},
        };
        break;

      case 'ITR-3':
      case 'ITR3':
        // ITR-3 specific fields (for business/professional income, balance sheet, audit)
        // eslint-disable-next-line camelcase
        jsonData.ITR3_Specific = {
          'Business_Income_Details': this.formatBusinessIncomeForExport(itrData.businessIncomeDetails || itrData.businessIncome),
          'Professional_Income_Details': this.formatProfessionalIncomeForExport(itrData.professionalIncomeDetails || itrData.professionalIncome),
          'Balance_Sheet_Details': this.formatBalanceSheetForExport(itrData.balanceSheetDetails || itrData.balanceSheet),
          'Audit_Information': this.formatAuditInfoForExport(itrData.auditInfoDetails || itrData.auditInfo),
          'Capital_Gains_Detailed': itrData.income?.capitalGainsDetails || {},
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Foreign_Income_Details': itrData.income?.foreignIncomeDetails || {},
          'Director_Partner_Income': itrData.income?.directorPartnerDetails || {},
        };
        break;

      case 'ITR-4':
      case 'ITR4':
        // ITR-4 specific fields (presumptive income)
        // eslint-disable-next-line camelcase
        jsonData.ITR4_Specific = {
          'Presumptive_Business_Income': this.formatPresumptiveIncomeForExport(itrData.income?.presumptiveBusinessDetails || itrData.income?.presumptiveBusiness),
          'Presumptive_Professional_Income': this.formatPresumptiveIncomeForExport(itrData.income?.presumptiveProfessionalDetails || itrData.income?.presumptiveProfessional),
          'House_Property_Detailed': itrData.income?.housePropertyDetails || {},
          'Section_44AD_Applicable': itrData.income?.presumptiveBusinessDetails?.hasPresumptiveBusiness || false,
          'Section_44ADA_Applicable': itrData.income?.presumptiveProfessionalDetails?.hasPresumptiveProfessional || false,
        };
        break;
    }
  }

  /**
   * Helper methods for calculations
   */
  calculateGrossIncome(itrData) {
    // Transform data first to get correct structure
    const transformed = this.transformFormDataToExportFormat(itrData, 'ITR-1');
    return this.formatAmount(
      parseFloat(transformed.income?.salaryIncome || 0) +
      parseFloat(transformed.income?.housePropertyIncome || 0) +
      parseFloat(transformed.income?.otherIncome || 0) +
      parseFloat(transformed.income?.businessIncome || 0) +
      parseFloat(transformed.income?.capitalGains || 0),
    );
  }

  calculateTotalDeductions(itrData) {
    return this.formatAmount(
      parseFloat(itrData.deductions?.section80C || 0) +
      parseFloat(itrData.deductions?.section80D || 0) +
      parseFloat(itrData.deductions?.section80E || 0) +
      parseFloat(itrData.deductions?.section80G || 0),
    );
  }

  calculateTaxableIncome(itrData) {
    const grossIncome = parseFloat(this.calculateGrossIncome(itrData));
    const totalDeductions = parseFloat(this.calculateTotalDeductions(itrData));
    return this.formatAmount(Math.max(0, grossIncome - totalDeductions));
  }

  calculateTotalTax(itrData) {
    const taxableIncome = parseFloat(this.calculateTaxableIncome(itrData));
    let tax = 0;

    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.2;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.3;
    }

    return this.formatAmount(tax + (tax * 0.04)); // Include 4% education cess
  }

  /**
   * Format business income for export
   */
  formatBusinessIncomeForExport(businessIncome) {
    if (!businessIncome) return {};

    if (businessIncome.businesses && Array.isArray(businessIncome.businesses)) {
      return {
        businesses: businessIncome.businesses.map(biz => ({
          businessName: biz.businessName || '',
          businessNature: biz.businessNature || '',
          businessAddress: biz.businessAddress || '',
          businessPAN: biz.businessPAN || '',
          gstNumber: biz.gstNumber || '',
          profitLossStatement: {
            grossReceipts: this.formatAmount(biz.pnl?.grossReceipts || 0),
            openingStock: this.formatAmount(biz.pnl?.openingStock || 0),
            purchases: this.formatAmount(biz.pnl?.purchases || 0),
            closingStock: this.formatAmount(biz.pnl?.closingStock || 0),
            directExpenses: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.directExpenses)),
            indirectExpenses: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.indirectExpenses)),
            depreciation: this.formatAmount(this.calculateExpenseTotal(biz.pnl?.depreciation)),
            otherExpenses: this.formatAmount(biz.pnl?.otherExpenses || 0),
            netProfit: this.formatAmount(biz.pnl?.netProfit || 0),
          },
        })),
      };
    }

    return {
      netBusinessIncome: this.formatAmount(businessIncome),
    };
  }

  /**
   * Format professional income for export
   */
  formatProfessionalIncomeForExport(professionalIncome) {
    if (!professionalIncome) return {};

    if (professionalIncome.professions && Array.isArray(professionalIncome.professions)) {
      return {
        professions: professionalIncome.professions.map(prof => ({
          professionName: prof.professionName || '',
          professionType: prof.professionType || '',
          professionAddress: prof.professionAddress || '',
          registrationNumber: prof.registrationNumber || '',
          profitLossStatement: {
            professionalFees: this.formatAmount(prof.pnl?.professionalFees || 0),
            expenses: this.formatAmount(this.calculateExpenseTotal(prof.pnl?.expenses)),
            depreciation: this.formatAmount(this.calculateExpenseTotal(prof.pnl?.depreciation)),
            netIncome: this.formatAmount(prof.pnl?.netIncome || 0),
          },
        })),
      };
    }

    return {
      netProfessionalIncome: this.formatAmount(professionalIncome),
    };
  }

  /**
   * Format balance sheet for export
   */
  formatBalanceSheetForExport(balanceSheet) {
    if (!balanceSheet || !balanceSheet.hasBalanceSheet) {
      return { maintained: false };
    }

    return {
      maintained: true,
      assets: {
        currentAssets: {
          cash: this.formatAmount(balanceSheet.assets?.currentAssets?.cash || 0),
          bank: this.formatAmount(balanceSheet.assets?.currentAssets?.bank || 0),
          inventory: this.formatAmount(balanceSheet.assets?.currentAssets?.inventory || 0),
          receivables: this.formatAmount(balanceSheet.assets?.currentAssets?.receivables || 0),
          other: this.formatAmount(balanceSheet.assets?.currentAssets?.other || 0),
          total: this.formatAmount(balanceSheet.assets?.currentAssets?.total || 0),
        },
        fixedAssets: {
          building: this.formatAmount(balanceSheet.assets?.fixedAssets?.building || 0),
          machinery: this.formatAmount(balanceSheet.assets?.fixedAssets?.machinery || 0),
          vehicles: this.formatAmount(balanceSheet.assets?.fixedAssets?.vehicles || 0),
          furniture: this.formatAmount(balanceSheet.assets?.fixedAssets?.furniture || 0),
          other: this.formatAmount(balanceSheet.assets?.fixedAssets?.other || 0),
          total: this.formatAmount(balanceSheet.assets?.fixedAssets?.total || 0),
        },
        investments: this.formatAmount(balanceSheet.assets?.investments || 0),
        loansAdvances: this.formatAmount(balanceSheet.assets?.loansAdvances || 0),
        total: this.formatAmount(balanceSheet.assets?.total || 0),
      },
      liabilities: {
        currentLiabilities: {
          creditors: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.creditors || 0),
          bankOverdraft: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.bankOverdraft || 0),
          shortTermLoans: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.shortTermLoans || 0),
          other: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.other || 0),
          total: this.formatAmount(balanceSheet.liabilities?.currentLiabilities?.total || 0),
        },
        longTermLiabilities: {
          longTermLoans: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.longTermLoans || 0),
          other: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.other || 0),
          total: this.formatAmount(balanceSheet.liabilities?.longTermLiabilities?.total || 0),
        },
        capital: this.formatAmount(balanceSheet.liabilities?.capital || 0),
        total: this.formatAmount(balanceSheet.liabilities?.total || 0),
      },
    };
  }

  /**
   * Format audit information for export
   */
  formatAuditInfoForExport(auditInfo) {
    if (!auditInfo || !auditInfo.isAuditApplicable) {
      return { applicable: false };
    }

    return {
      applicable: true,
      auditReason: auditInfo.auditReason || '',
      auditReportNumber: auditInfo.auditReportNumber || '',
      auditReportDate: auditInfo.auditReportDate || '',
      caDetails: {
        caName: auditInfo.caDetails?.caName || '',
        membershipNumber: auditInfo.caDetails?.membershipNumber || '',
        firmName: auditInfo.caDetails?.firmName || '',
        firmAddress: auditInfo.caDetails?.firmAddress || '',
      },
      bookOfAccountsMaintained: auditInfo.bookOfAccountsMaintained || false,
      form3CDFiled: auditInfo.form3CDFiled || false,
    };
  }

  /**
   * Calculate expense total helper
   */
  calculateExpenseTotal(expenseCategory) {
    if (!expenseCategory || typeof expenseCategory !== 'object') {
      return 0;
    }
    if (typeof expenseCategory.total === 'number') {
      return expenseCategory.total;
    }
    return Object.entries(expenseCategory).reduce((sum, [key, value]) => {
      if (key === 'total') return sum;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  /**
   * Format amount as per government requirements
   */
  formatAmount(amount) {
    return parseFloat(amount || 0).toFixed(2);
  }

  /**
   * Generate filename for download
   */
  generateFileName(itrType, assessmentYear) {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${itrType}_${assessmentYear}_${currentDate}.json`;
  }

  /**
   * Generate checksum for integrity verification
   */
  generateChecksum(data) {
    // Simple hash function for checksum (in production, use SHA-256)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Download JSON file directly in browser
   */
  downloadJsonFile(jsonData, fileName) {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Validate JSON before export against ITD schema requirements
   * Uses the official ITD schema validator
   */
  validateJsonForExport(itrData, itrType) {
    try {
      // Generate ITD-compliant JSON first
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to validate ITR data');
      }

      const jsonPayload = this.generateITDCompliantJson(itrData, itrType, '2024-25', user);
      // Validate against ITD schema
      const validationResult = validateITRJson(jsonPayload, itrType);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map(e => `${e.path}: ${e.message}`).join('; ');
        throw new Error(`JSON validation failed: ${errorMessages}`);
      }

      // Check for warnings
      if (validationResult.warnings.length > 0) {
        console.warn('ITR JSON validation warnings:', validationResult.warnings);
      }

      return true;
    } catch (error) {
      // Re-throw with better error message
      if (error.message.includes('JSON validation failed')) {
        throw error;
      }
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  /**
   * Check if Unicode string is valid for ITD submission
   */
  isValidUnicode(str) {
    // ITD accepts basic Unicode characters (Devanagari script, etc.)
    // but some special characters may cause issues
    try {
      // Try to encode/decode to check validity
      const encoded = encodeURIComponent(str);
      decodeURIComponent(encoded);
      return true;
    } catch {
      return false;
    }
  }
}

export const itrJsonExportService = new ITRJsonExportService();
export default itrJsonExportService;
