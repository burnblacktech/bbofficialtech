// =====================================================
// DOCUMENT PROCESSING SERVICE - SALARY SLIPS & RENT RECEIPTS
// OCR-based extraction and categorization for tax filing
// =====================================================

import { apiClient } from './core/APIClient';

class DocumentProcessingService {
  constructor() {
    this.documentTypes = {
      SALARY_SLIP: 'salary_slip',
      SALARY_CERTIFICATE: 'salary_certificate',
      FORM_16: 'form_16',
      RENT_RECEIPT: 'rent_receipt',
      RENT_AGREEMENT: 'rent_agreement',
      BANK_STATEMENT: 'bank_statement',
      INTEREST_CERTIFICATE: 'interest_certificate',
      TAX_SAVING_CERTIFICATE: 'tax_saving_certificate',
      MEDICAL_BILL: 'medical_bill',
      EDUCATION_FEE_RECEIPT: 'education_fee_receipt'
    };

    this.extractionPatterns = {
      salarySlip: {
        employer: {
          name: [
            /(?:Company Name|Employer|Organization)[\s:]*(.+)/i,
            /([^]*)(?:Private\s*Limited|Ltd\.?|Pvt\.?|LLP|Inc\.?|Corp\.?)/i
          ],
          address: [
            /(?:Address|Registered Office)[\s:]*(.+)/i,
            /([A-Za-z\s,]+(?:Road|Street|Building|Tower)\s*[\w\s,#-]+)/i
          ]
        },
        employee: {
          name: [
            /(?:Employee Name|Name)[\s:]*(.+)/i,
            /(?:Staff Name|Person Name)[\s:]*(.+)/i
          ],
          pan: [
            /(?:PAN|Permanent\s*Account\s*Number)[\s:]*([A-Z]{5}[0-9]{4}[A-Z])/i,
            /Pan[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i
          ],
          employeeId: [
            /(?:Employee\s*ID|EID|Staff\s*ID)[\s:]*(\w+)/i,
            /Emp\.?\s*Code[:\s]*(\w+)/i
          ],
          designation: [
            /(?:Designation|Position|Job\s*Title)[\s:]*(.+)/i,
            /(?:Role|Grade)[\s:]*(.+)/i
          ]
        },
        financial: {
          basicSalary: [
            /(?:Basic\s*Salary|Basic\s*Pay|Basic)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Basic[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          hra: [
            /(?:HRA|House\s*Rent\s*Allowance)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /House\s*Rent[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          specialAllowance: [
            /(?:Special\s*Allowance|Other\s*Allowance)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Allowance[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          grossSalary: [
            /(?:Gross\s*Salary|Total\s*Earnings|Gross\s*Pay)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Gross[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          netSalary: [
            /(?:Net\s*Salary|Take\s*Home|Net\s*Pay)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Net[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          tds: [
            /(?:TDS|Income\s*Tax|Tax\s*Deducted)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /TDS[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          pf: [
            /(?:PF|Provident\s*Fund|EPF)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /PF[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          esi: [
            /(?:ESI|Employee\s*State\s*Insurance)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /ESI[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ],
          professionalTax: [
            /(?:Professional\s*Tax|PT)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Prof\.?\s*Tax[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
          ]
        },
        period: {
          month: [
            /(?:Month|Period)[\s:]*(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
            /([A-Za-z]+)\s*\d{4}/i
          ],
          year: [
            /(?:Year|FY|Financial\s*Year)[\s:]*(\d{4}|\d{2}-\d{2})/i,
            /\b(20\d{2})\b/
          ],
          payDate: [
            /(?:Pay\s*Date|Date)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
            /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/
          ]
        }
      },
      rentReceipt: {
        landlord: {
          name: [
            /(?:Landlord|Owner|Lessor)[\s:]*(.+)/i,
            /Received\s*from[:\s]*(.+)/i
          ],
          pan: [
            /(?:Landlord\s*PAN|Owner\s*PAN)[\s:]*([A-Z]{5}[0-9]{4}[A-Z])/i,
            /PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i
          ],
          address: [
            /(?:Landlord\s*Address|Owner\s*Address)[\s:]*(.+)/i,
            /Address[:\s]*(.+)/i
          ]
        },
        tenant: {
          name: [
            /(?:Tenant|Payer)[\s:]*(.+)/i,
            /Paid\s*by[:\s]*(.+)/i
          ]
        },
        property: {
          address: [
            /(?:Property\s*Address|Premises\s*Address)[\s:]*(.+)/i,
            /(?:House|Flat|Room)\s*No\.?\s*([^,\n]*)/i
          ],
          type: [
            /(?:Property\s*Type|Type\s*of\s*Accommodation)[\s:]*(.+)/i,
            /(?:Apartment|House|Flat|PG|Hostel)/i
          ]
        },
        financial: {
          rentAmount: [
            /(?:Rent\s*Amount|Monthly\s*Rent|Amount)[\s:]*₹?\s*([\d,]+(?:\.\d+)?)/i,
            /Rs\.?\s*([\d,]+(?:\.\d+)?)/i,
            /₹\s*([\d,]+(?:\.\d+)?)/i
          ],
          period: {
            from: [
              /(?:Period|From)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
              /Rent\s*for[:\s]*(.+)/i
            ],
            to: [
              /(?:To|Until)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
            ]
          },
          mode: [
            /(?:Mode\s*of\s*Payment|Payment\s*Mode)[\s:]*(Cash|Cheque|Online|Transfer|NEFT|RTGS|UPI)/i
          ]
        },
        verification: {
          receiptNo: [
            /(?:Receipt\s*No|Receipt\s*Number)[\s:]*(\w+)/i,
            /Receipt[:\s]*(\w+)/i
          ],
          date: [
            /(?:Date|Receipt\s*Date)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
          ],
          amount: [
            /(?:Amount|Sum)[\s:]*(\d+)/i
          ]
        }
      }
    };
  }

  /**
   * Process document for tax data extraction
   */
  async processDocument(file, documentType, options = {}) {
    try {
      console.log(`📄 Processing ${documentType} document...`);

      const processingId = this.generateProcessingId();
      const processingStart = Date.now();

      // Validate file and document type
      const validation = this.validateDocument(file, documentType);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          processingId
        };
      }

      // Step 1: Extract text using OCR
      const ocrResult = await this.extractTextFromDocument(file, documentType);
      if (!ocrResult.success) {
        return {
          success: false,
          error: `OCR extraction failed: ${ocrResult.error}`,
          processingId
        };
      }

      // Step 2: Parse and extract relevant information
      const extractedData = await this.parseDocumentText(
        ocrResult.text,
        documentType,
        options
      );

      // Step 3: Validate and sanitize extracted data
      const validatedData = this.validateExtractedData(extractedData, documentType);

      // Step 4: Calculate tax implications
      const taxImplications = this.calculateTaxImplications(validatedData, documentType);

      // Step 5: Generate recommendations
      const recommendations = this.generateRecommendations(validatedData, documentType);

      const processingResult = {
        success: true,
        processingId,
        documentType,
        processingTime: Date.now() - processingStart,
        ocrConfidence: ocrResult.confidence,
        extractedData: validatedData,
        taxImplications,
        recommendations,
        qualityScore: this.calculateQualityScore(validatedData, documentType),
        verifiedFields: this.getVerifiedFields(validatedData)
      };

      // Save processing result
      await this.saveProcessingResult(processingId, processingResult);

      console.log(`✅ Document processed successfully in ${processingResult.processingTime}ms`);
      return processingResult;

    } catch (error) {
      console.error('❌ Error processing document:', error);
      return {
        success: false,
        error: error.message,
        processingId: this.generateProcessingId()
      };
    }
  }

  /**
   * Extract text from document using OCR
   */
  async extractTextFromDocument(file, documentType) {
    try {
      console.log('🔍 Extracting text from document...');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('processingType', 'tax_extraction');

      // Send to backend OCR service
      const response = await apiClient.post('/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.success) {
        return {
          success: true,
          text: response.data.text,
          confidence: response.data.confidence,
          boundingBoxes: response.data.boundingBoxes,
          language: response.data.language || 'en'
        };
      }

      return { success: false, error: response.message };

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse document text for structured data
   */
  async parseDocumentText(text, documentType, options = {}) {
    try {
      console.log('📋 Parsing document text...');

      let extractedData = {};

      switch (documentType) {
        case this.documentTypes.SALARY_SLIP:
          extractedData = this.parseSalarySlip(text, options);
          break;
        case this.documentTypes.FORM_16:
          extractedData = this.parseForm16(text, options);
          break;
        case this.documentTypes.RENT_RECEIPT:
          extractedData = this.parseRentReceipt(text, options);
          break;
        case this.documentTypes.RENT_AGREEMENT:
          extractedData = this.parseRentAgreement(text, options);
          break;
        case this.documentTypes.INTEREST_CERTIFICATE:
          extractedData = this.parseInterestCertificate(text, options);
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      return extractedData;

    } catch (error) {
      console.error('❌ Error parsing document text:', error);
      return { error: error.message };
    }
  }

  /**
   * Parse salary slip for tax-relevant data
   */
  parseSalarySlip(text, options) {
    console.log('💰 Parsing salary slip...');

    const salaryData = {
      employer: {},
      employee: {},
      financial: {},
      period: {},
      deductions: {},
      allowances: {},
      metadata: {
        documentType: 'salary_slip',
        extractionDate: new Date().toISOString()
      }
    };

    const patterns = this.extractionPatterns.salarySlip;

    // Extract employer information
    for (const [key, keyPatterns] of Object.entries(patterns.employer)) {
      salaryData.employer[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract employee information
    for (const [key, keyPatterns] of Object.entries(patterns.employee)) {
      salaryData.employee[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract financial information
    for (const [key, keyPatterns] of Object.entries(patterns.financial)) {
      const value = this.extractWithPatterns(text, keyPatterns);
      if (value) {
        salaryData.financial[key] = this.parseAmount(value);
      }
    }

    // Extract period information
    for (const [key, keyPatterns] of Object.entries(patterns.period)) {
      salaryData.period[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract allowances and deductions
    const allLines = text.split('\n');
    for (const line of allLines) {
      const lowerLine = line.toLowerCase();

      // Look for allowances
      if (this.isAllowanceLine(lowerLine)) {
        const allowanceData = this.extractAllowance(line);
        if (allowanceData) {
          salaryData.allowances[allowanceData.type] = allowanceData.amount;
        }
      }

      // Look for deductions
      if (this.isDeductionLine(lowerLine)) {
        const deductionData = this.extractDeduction(line);
        if (deductionData) {
          salaryData.deductions[deductionData.type] = deductionData.amount;
        }
      }
    }

    // Calculate derived values
    salaryData.financial.totalAllowances = Object.values(salaryData.allowances)
      .reduce((sum, amount) => sum + amount, 0);

    salaryData.financial.totalDeductions = Object.values(salaryData.deductions)
      .reduce((sum, amount) => sum + amount, 0);

    salaryData.financial.annualSalary = this.calculateAnnualSalary(salaryData);

    return salaryData;
  }

  /**
   * Parse rent receipt for HRA claim
   */
  parseRentReceipt(text, options) {
    console.log('🏠 Parsing rent receipt...');

    const rentData = {
      landlord: {},
      tenant: {},
      property: {},
      financial: {},
      verification: {},
      metadata: {
        documentType: 'rent_receipt',
        extractionDate: new Date().toISOString()
      }
    };

    const patterns = this.extractionPatterns.rentReceipt;

    // Extract landlord information
    for (const [key, keyPatterns] of Object.entries(patterns.landlord)) {
      rentData.landlord[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract tenant information
    for (const [key, keyPatterns] of Object.entries(patterns.tenant)) {
      rentData.tenant[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract property information
    for (const [key, keyPatterns] of Object.entries(patterns.property)) {
      rentData.property[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Extract financial information
    for (const [key, keyPatterns] of Object.entries(patterns.financial)) {
      if (typeof keyPatterns === 'object' && !Array.isArray(keyPatterns)) {
        const periodData = {};
        for (const [subKey, subPatterns] of Object.entries(keyPatterns)) {
          periodData[subKey] = this.extractWithPatterns(text, subPatterns);
        }
        rentData.financial[key] = periodData;
      } else {
        const value = this.extractWithPatterns(text, keyPatterns);
        if (key === 'rentAmount') {
          rentData.financial[key] = this.parseAmount(value);
        } else {
          rentData.financial[key] = value;
        }
      }
    }

    // Extract verification information
    for (const [key, keyPatterns] of Object.entries(patterns.verification)) {
      rentData.verification[key] = this.extractWithPatterns(text, keyPatterns);
    }

    // Calculate derived values
    if (rentData.financial.rentAmount) {
      rentData.financial.annualRent = rentData.financial.rentAmount * 12;
      rentData.financial.hraEligible = this.calculateHRAEligibility(rentData);
    }

    return rentData;
  }

  /**
   * Parse Form 16 data
   */
  parseForm16(text, options) {
    console.log('📋 Parsing Form 16...');

    // Form 16 parsing would be more complex and structured
    // This is a simplified implementation

    const form16Data = {
      employer: {
        name: this.extractWithPatterns(text, [
          /(?:Employer\s*Name|Name\s*of\s*Employer)[\s:]*(.+)/i,
          /([^]*)(?:Pvt\.?|Ltd\.?|Private\s*Limited)/i
        ]),
        tan: this.extractWithPatterns(text, [
          /(?:TAN|Tax\s*Deduction\s*Account\s*Number)[\s:]*(\w{10})/i,
          /TAN[:\s]*(\w{10})/i
        ]),
        pan: this.extractWithPatterns(text, [
          /Employer\s*PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i
        ])
      },
      employee: {
        name: this.extractWithPatterns(text, [
          /(?:Employee\s*Name|Name\s*of\s*Employee)[\s:]*(.+)/i
        ]),
        pan: this.extractWithPatterns(text, [
          /Employee\s*PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i
        ])
      },
      financial: {
        grossSalary: this.parseAmount(this.extractWithPatterns(text, [
          /Gross\s*Salary[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ])),
        otherIncome: this.parseAmount(this.extractWithPatterns(text, [
          /Income\s*from\s*Other\s*Sources[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ])),
        deductions80C: this.parseAmount(this.extractWithPatterns(text, [
          /Deduction\s*under\s*Section\s*80C[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ])),
        totalIncome: this.parseAmount(this.extractWithPatterns(text, [
          /Total\s*Income[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ])),
        totalTax: this.parseAmount(this.extractWithPatterns(text, [
          /Total\s*Tax[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ])),
        tds: this.parseAmount(this.extractWithPatterns(text, [
          /Tax\s*Deducted\s*at\s*Source[:\s]*₹?\s*([\d,]+(?:\.\d+)?)/i
        ]))
      },
      assessmentYear: this.extractWithPatterns(text, [
        /Assessment\s*Year[:\s]*(\d{4}-\d{2})/i
      ])
    };

    return form16Data;
  }

  /**
   * Calculate tax implications of extracted data
   */
  calculateTaxImplications(extractedData, documentType) {
    const implications = {
      income: {},
      deductions: {},
      taxability: {},
      recommendations: []
    };

    switch (documentType) {
      case this.documentTypes.SALARY_SLIP:
        implications.income.salary = extractedData.financial.annualSalary || 0;
        implications.income.allowances = extractedData.financial.totalAllowances || 0;
        implications.deductions.pf = extractedData.financial.pf || 0;
        implications.deductions.professionalTax = extractedData.financial.professionalTax || 0;
        implications.taxability.tds = extractedData.financial.tds || 0;
        break;

      case this.documentTypes.RENT_RECEIPT:
        implications.deductions.hra = extractedData.financial.annualRent || 0;
        implications.taxability.hraEligible = extractedData.financial.hraEligible || false;
        break;

      case this.documentTypes.FORM_16:
        implications.income.total = extractedData.financial.totalIncome || 0;
        implications.deductions.section80C = extractedData.financial.deductions80C || 0;
        implications.taxability.totalTax = extractedData.financial.totalTax || 0;
        implications.taxability.tds = extractedData.financial.tds || 0;
        break;
    }

    return implications;
  }

  /**
   * Generate recommendations based on extracted data
   */
  generateRecommendations(extractedData, documentType) {
    const recommendations = [];

    switch (documentType) {
      case this.documentTypes.SALARY_SLIP:
        // Check if employee is utilizing all deductions
        if (extractedData.financial.pf < 150000) {
          recommendations.push({
            type: 'tax_optimization',
            priority: 'high',
            title: 'Maximize Section 80C Deductions',
            description: `Your PF contribution is ₹${extractedData.financial.pf}. Consider additional investments to reach the ₹1,50,000 limit.`,
            action: 'Explore ELSS, PPF, or tax-saving FDs'
          });
        }

        // Check HRA optimization
        if (!extractedData.allowances.hra || extractedData.allowances.hra < 50000) {
          recommendations.push({
            type: 'housing_benefit',
            priority: 'medium',
            title: 'Review HRA Structure',
            description: 'Consider negotiating your salary structure to optimize HRA benefits if you pay rent.',
            action: 'Discuss with HR about HRA optimization'
          });
        }
        break;

      case this.documentTypes.RENT_RECEIPT:
        // Check rent receipt compliance
        if (!extractedData.landlord.pan && extractedData.financial.annualRent > 100000) {
          recommendations.push({
            type: 'compliance',
            priority: 'high',
            title: 'Landlord PAN Required',
            description: 'For annual rent exceeding ₹1,00,000, landlord PAN is mandatory for HRA claim.',
            action: 'Request landlord PAN immediately'
          });
        }

        // Check rent amount for HRA optimization
        if (extractedData.financial.rentAmount > 0 && extractedData.financial.rentAmount < extractedData.financial.hraEligible) {
          recommendations.push({
            type: 'tax_optimization',
            priority: 'medium',
            title: 'Rent Amount Analysis',
            description: `Your rent is ₹${extractedData.financial.rentAmount} while eligible HRA could be higher.`,
            action: 'Consider HRA optimization strategies'
          });
        }
        break;
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  extractWithPatterns(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  parseAmount(amountString) {
    if (!amountString) return 0;

    // Remove currency symbols and commas
    const cleaned = amountString.replace(/[₹,\s]/g, '');

    // Convert to number
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
  }

  isAllowanceLine(line) {
    const allowanceKeywords = [
      'allowance', 'allow', 'conveyance', 'travel', 'medical', 'education',
      'special', 'dearness', 'hra', 'house rent', 'leave travel'
    ];
    return allowanceKeywords.some(keyword => line.includes(keyword));
  }

  isDeductionLine(line) {
    const deductionKeywords = [
      'deduction', 'deduct', 'pf', 'epf', 'esi', 'professional tax',
      'income tax', 'tds', 'loan', 'advance'
    ];
    return deductionKeywords.some(keyword => line.includes(keyword));
  }

  extractAllowance(line) {
    // Extract allowance type and amount from line
    const parts = line.split(/\s+/);
    const amountIndex = parts.findIndex(part => /^\d+/.test(part));

    if (amountIndex > 0) {
      const type = parts.slice(0, amountIndex).join(' ');
      const amount = this.parseAmount(parts[amountIndex]);
      return { type, amount };
    }

    return null;
  }

  extractDeduction(line) {
    // Extract deduction type and amount from line
    const parts = line.split(/\s+/);
    const amountIndex = parts.findIndex(part => /^\d+/.test(part));

    if (amountIndex > 0) {
      const type = parts.slice(0, amountIndex).join(' ');
      const amount = this.parseAmount(parts[amountIndex]);
      return { type, amount };
    }

    return null;
  }

  calculateAnnualSalary(salaryData) {
    if (salaryData.financial.grossSalary) {
      // If gross salary is provided, assume it's monthly and calculate annual
      return salaryData.financial.grossSalary * 12;
    }
    return 0;
  }

  calculateHRAEligibility(rentData) {
    // Simplified HRA eligibility calculation
    const rent = rentData.financial.rentAmount || 0;
    return rent > 0; // Basic eligibility - rent is being paid
  }

  validateDocument(file, documentType) {
    // Validate file type, size, and document type compatibility
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only PDF, JPEG, and PNG files are supported.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit.'
      };
    }

    return { isValid: true };
  }

  validateExtractedData(data, documentType) {
    // Validate and sanitize extracted data
    const validated = { ...data };

    // Remove empty values
    Object.keys(validated).forEach(key => {
      if (validated[key] === null || validated[key] === '') {
        delete validated[key];
      }
    });

    // Validate specific fields based on document type
    switch (documentType) {
      case this.documentTypes.SALARY_SLIP:
        if (!validated.employee?.name) {
          validated.warnings = validated.warnings || [];
          validated.warnings.push('Employee name not found in document');
        }
        break;
    }

    return validated;
  }

  calculateQualityScore(extractedData, documentType) {
    let score = 0;
    let maxScore = 0;

    // Check for critical fields
    switch (documentType) {
      case this.documentTypes.SALARY_SLIP:
        const criticalFields = ['employer.name', 'employee.name', 'financial.basicSalary'];
        criticalFields.forEach(field => {
          maxScore += 33.33;
          if (this.getNestedValue(extractedData, field)) {
            score += 33.33;
          }
        });
        break;
    }

    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getVerifiedFields(extractedData) {
    // Return list of fields that were successfully extracted and verified
    const verified = [];

    // Implementation would depend on verification logic
    return verified;
  }

  generateProcessingId() {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveProcessingResult(processingId, result) {
    try {
      await apiClient.post('/document-processing/save-result', {
        processingId,
        result
      });
    } catch (error) {
      console.error('Error saving processing result:', error);
    }
  }

  /**
   * Batch processing for multiple documents
   */
  async processBatchDocuments(files, documentType, options = {}) {
    console.log(`📁 Processing batch of ${files.length} ${documentType} documents...`);

    const results = [];
    const batchId = this.generateProcessingId();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.processDocument(file, documentType, {
        ...options,
        batchId,
        batchIndex: i
      });
      results.push(result);
    }

    // Generate batch summary
    const batchSummary = {
      batchId,
      documentType,
      totalDocuments: files.length,
      successfulProcessing: results.filter(r => r.success).length,
      failedProcessing: results.filter(r => !r.success).length,
      averageQualityScore: results
        .filter(r => r.success && r.qualityScore)
        .reduce((sum, r) => sum + r.qualityScore, 0) /
        results.filter(r => r.success && r.qualityScore).length || 0
    };

    return {
      batchId,
      results,
      summary: batchSummary
    };
  }
}

// Export singleton instance
export const documentProcessingService = new DocumentProcessingService();
export default documentProcessingService;