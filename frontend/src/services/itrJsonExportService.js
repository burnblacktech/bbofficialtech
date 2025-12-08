// =====================================================
// ITR JSON EXPORT SERVICE
// Generates government-compliant JSON for ITR filing
// Essential for manual filing while ERI API license is pending
// =====================================================

import { authService } from './';

class ITRJsonExportService {
  constructor() {
    this.apiEndpoint = '/api/itr/export';
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

      // Generate government-compliant JSON structure
      const jsonPayload = this.generateGovernmentJson(itrData, itrType, assessmentYear, user);

      // Call backend to generate downloadable JSON
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
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

      // Generate client-side JSON as backup
      const clientJson = this.generateClientJson(itrData, itrType, assessmentYear, user);

      return {
        success: true,
        downloadUrl: result.downloadUrl,
        jsonPayload: clientJson,
        fileName: this.generateFileName(itrType, assessmentYear),
        metadata: {
          itrType,
          assessmentYear,
          generatedAt: new Date().toISOString(),
          fileSize: JSON.stringify(clientJson).length,
          checksum: this.generateChecksum(clientJson),
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
      if (formData.businessIncome?.businesses && Array.isArray(formData.businessIncome.businesses)) {
        // ITR-3: Calculate total from businesses array
        const totalBusinessIncome = formData.businessIncome.businesses.reduce((sum, biz) => {
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
        transformed.businessIncomeDetails = formData.businessIncome;
      } else {
        transformed.income.businessIncome = parseFloat(formData.income.businessIncome || 0);
      }

      // Professional income - handle both ITR-3 structure and simple structure
      if (formData.professionalIncome?.professions && Array.isArray(formData.professionalIncome.professions)) {
        // ITR-3: Calculate total from professions array
        const totalProfessionalIncome = formData.professionalIncome.professions.reduce((sum, prof) => {
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
        transformed.professionalIncomeDetails = formData.professionalIncome;
      } else {
        transformed.income.professionalIncome = parseFloat(formData.income.professionalIncome || 0);
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
   * Generate government-compliant JSON structure
   * Follows Income Tax Department schema requirements
   */
  generateGovernmentJson(itrData, itrType, assessmentYear, user) {
    const currentDate = new Date().toISOString();

    // Transform formData to expected structure
    const transformedData = this.transformFormDataToExportFormat(itrData, itrType);

    // Base structure for all ITR types
    const baseJson = {
      // Header information
      'ITR_Form': itrType,
      'Assessment_Year': assessmentYear,
      'Filing_Type': 'Original',
      'Date_of_Filing': currentDate.split('T')[0], // YYYY-MM-DD format
      'Acknowledgement_Number': '', // To be generated by tax department

      // Taxpayer information
      'Taxpayer_Information': {
        'PAN': transformedData.personal?.pan || user.pan || '',
        'Name': {
          'First_Name': transformedData.personal?.firstName || user.firstName || '',
          'Middle_Name': transformedData.personal?.middleName || '',
          'Last_Name': transformedData.personal?.lastName || user.lastName || '',
        },
        'Date_of_Birth': transformedData.personal?.dateOfBirth || user.dateOfBirth || '',
        'Gender': transformedData.personal?.gender || user.gender || '',
        'Residential_Status': transformedData.personal?.residentialStatus || 'RESIDENT',
        'Contact_Information': {
          'Email_ID': transformedData.personal?.email || user.email || '',
          'Mobile_Number': transformedData.personal?.phone || user.phone || '',
          'Address': {
            'Flat_Door_Block_No': transformedData.personal?.address?.flat || '',
            'Premises_Name_Building': transformedData.personal?.address?.building || '',
            'Road_Street': transformedData.personal?.address?.street || '',
            'Area_Locality': transformedData.personal?.address?.area || '',
            'City_Town': transformedData.personal?.address?.city || '',
            'State': transformedData.personal?.address?.state || '',
            'PIN_Code': transformedData.personal?.address?.pincode || '',
            'Country': transformedData.personal?.address?.country || 'INDIA',
          },
        },
      },

      // Bank account details
      'Bank_Account_Details': {
        'Account_Number': transformedData.bank?.accountNumber || '',
        'Account_Type': transformedData.bank?.accountType || 'SAVINGS',
        'Bank_Name': transformedData.bank?.bankName || '',
        'Branch_Name': transformedData.bank?.branchName || '',
        'IFSC_Code': transformedData.bank?.ifscCode || '',
        'MICR_Code': transformedData.bank?.micrCode || '',
      },

      // Income details
      'Income_Details': {
        'Income_from_Salary': this.formatAmount(transformedData.income?.salaryIncome || 0),
        'Income_from_House_Property': this.formatAmount(transformedData.income?.housePropertyIncome || 0),
        'Income_from_Other_Sources': this.formatAmount(transformedData.income?.otherIncome || 0),
        'Business_Income': this.formatAmount(transformedData.income?.businessIncome || 0),
        'Capital_Gains': this.formatAmount(transformedData.income?.capitalGains || 0),
        'Total_Gross_Income': 0, // Will be calculated
      },

      // Deductions
      'Deductions': {
        'Section_80C': this.formatAmount(transformedData.deductions?.section80C || 0),
        'Section_80D': this.formatAmount(transformedData.deductions?.section80D || 0),
        'Section_80E': this.formatAmount(transformedData.deductions?.section80E || 0),
        'Section_80G': this.formatAmount(transformedData.deductions?.section80G || 0),
        'Section_80TTA': this.formatAmount(transformedData.deductions?.section80TTA || 0),
        'Total_Deductions': 0, // Will be calculated
      },

      // Tax calculation
      'Tax_Calculation': {
        'Total_Income': 0, // Will be calculated
        'Total_Tax_Liability': 0, // Will be calculated
        'Education_Cess': 0, // Will be calculated
        'Total_Tax_Payable': 0, // Will be calculated
        'TDS_TCS': this.formatAmount(transformedData.tds?.totalTDS || 0),
        'Advance_Tax': this.formatAmount(transformedData.taxes?.advanceTax || 0),
        'Self_Assessment_Tax': this.formatAmount(transformedData.taxes?.selfAssessmentTax || 0),
        'Total_Tax_Paid': 0, // Will be calculated
      },

      // Verification
      'Verification': {
        'Declaration': 'I declare that the information furnished above is true to the best of my knowledge and belief.',
        'Place': transformedData.verification?.place || user.address?.city || '',
        'Date': currentDate.split('T')[0],
        'Signature_Type': transformedData.verification?.signatureType || 'ELECTRONIC',
      },
    };

    // Calculate derived values
    this.calculateDerivedValues(baseJson);

    // Add ITR type specific fields
    this.addITRTypeSpecificFields(baseJson, transformedData, itrType);

    return baseJson;
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
          'Income_from_Salary_Detailed': itrData.income?.salaryDetails || {},
          'Income_from_House_Property_Detailed': itrData.income?.housePropertyDetails || {},
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
   */
  validateJsonForExport(itrData, itrType) {
    // Transform data first to validate against expected structure
    const transformedData = this.transformFormDataToExportFormat(itrData, itrType);

    const errors = [];

    // Required fields validation
    const requiredFields = {
      personal: ['pan'],
      income: ['salaryIncome'],
    };

    for (const [section, fields] of Object.entries(requiredFields)) {
      if (!transformedData[section]) {
        errors.push(`Missing required section: ${section}`);
        continue;
      }

      for (const field of fields) {
        if (!transformedData[section][field] && transformedData[section][field] !== 0) {
          errors.push(`Missing required field: ${section}.${field}`);
        }
      }
    }

    // PAN format validation (ITD requirement)
    if (transformedData.personal?.pan) {
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panPattern.test(transformedData.personal.pan)) {
        errors.push('Invalid PAN format. PAN must be in format: ABCDE1234F');
      }
    }

    // Date format validation (ITD requires DD/MM/YYYY)
    if (transformedData.personal?.dateOfBirth) {
      const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!datePattern.test(transformedData.personal.dateOfBirth)) {
        errors.push('Date of birth must be in DD/MM/YYYY format');
      }
    }

    // Number format validation (should be numbers, not strings)
    const numericFields = ['salaryIncome', 'housePropertyIncome', 'otherIncome', 'totalIncome'];
    for (const field of numericFields) {
      if (transformedData.income?.[field] !== undefined) {
        const value = transformedData.income[field];
        if (typeof value === 'string' && isNaN(parseFloat(value))) {
          errors.push(`Invalid number format for income.${field}: ${value}`);
        }
      }
    }

    // ITR-specific validations
    if (itrType === 'ITR-1' || itrType === 'ITR1') {
      // ITR-1: Total income should not exceed ₹50L
      const totalIncome = parseFloat(transformedData.income?.salaryIncome || 0) +
                         parseFloat(transformedData.income?.housePropertyIncome || 0) +
                         parseFloat(transformedData.income?.otherIncome || 0);
      if (totalIncome > 5000000) {
        errors.push('Total income exceeds ₹50 lakh limit for ITR-1. Please use ITR-2.');
      }
    }

    // Character encoding validation (check for special characters that might cause issues)
    const textFields = ['firstName', 'lastName', 'address'];
    for (const field of textFields) {
      if (transformedData.personal?.[field]) {
        const value = transformedData.personal[field];
        // Check for problematic characters (non-ASCII characters excluding null)
        if (/[^\u0020-\u007F]/.test(value) && !this.isValidUnicode(value)) {
          errors.push(`Special characters in ${field} may cause encoding issues`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error('JSON validation failed:\n' + errors.join('\n'));
    }

    return true;
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
