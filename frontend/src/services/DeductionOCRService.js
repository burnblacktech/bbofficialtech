// =====================================================
// DEDUCTION OCR SERVICE
// Client-side OCR processing for deduction type detection
// =====================================================

import { enterpriseLogger } from '../utils/logger';

export class DeductionOCRService {
  constructor() {
    this.deductionPatterns = {
      LIC_PREMIUM: [
        /life\s*insurance\s*corporation/i,
        /lic\s*premium/i,
        /policy\s*premium/i,
        /insurance\s*premium/i,
      ],
      PPF_INVESTMENT: [
        /public\s*provident\s*fund/i,
        /ppf\s*account/i,
        /ppf\s*investment/i,
        /ppf\s*deposit/i,
      ],
      EPF_CONTRIBUTION: [
        /employees\s*provident\s*fund/i,
        /epf\s*contribution/i,
        /provident\s*fund\s*contribution/i,
      ],
      ELSS_MUTUAL_FUND: [
        /equity\s*linked\s*savings\s*scheme/i,
        /elss\s*mutual\s*fund/i,
        /tax\s*saving\s*fund/i,
      ],
      NSC: [
        /national\s*savings\s*certificate/i,
        /nsc\s*investment/i,
        /nsc\s*deposit/i,
      ],
      SUKANYA_SAMRIDDHI: [
        /sukanya\s*samriddhi/i,
        /sukanya\s*yojana/i,
        /girl\s*child\s*scheme/i,
      ],
      HOME_LOAN_PRINCIPAL: [
        /home\s*loan/i,
        /housing\s*loan/i,
        /principal\s*repayment/i,
        /loan\s*repayment/i,
      ],
      TUITION_FEES: [
        /tuition\s*fees/i,
        /education\s*fees/i,
        /school\s*fees/i,
        /college\s*fees/i,
      ],
    };
  }

  async detectDeductionType(file) {
    try {
      // For now, use mock detection since client-side OCR is complex
      // In production, this would call the backend OCR service
      const mockResult = this.mockDetection(file);

      enterpriseLogger.info('Deduction type detected', {
        fileName: file.name,
        type: mockResult.type,
        confidence: mockResult.confidence,
      });

      return mockResult;
    } catch (error) {
      enterpriseLogger.error('Deduction type detection failed', {
        fileName: file.name,
        error: error.message,
      });
      throw error;
    }
  }

  mockDetection(file) {
    // Mock detection for development/testing
    const mockTypes = [
      'LIC_PREMIUM',
      'PPF_INVESTMENT',
      'EPF_CONTRIBUTION',
      'ELSS_MUTUAL_FUND',
      'NSC',
      'SUKANYA_SAMRIDDHI',
      'HOME_LOAN_PRINCIPAL',
      'TUITION_FEES',
    ];

    const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

    return {
      type: randomType,
      confidence: confidence,
      extractedData: {
        amount: Math.floor(Math.random() * 100000) + 10000, // 10k-110k
        date: this.generateRandomDate(),
        reference: `REF${Math.floor(Math.random() * 1000000)}`,
        institution: this.getInstitutionName(randomType),
      },
      rawText: 'Mock OCR text from document',
    };
  }

  generateRandomDate() {
    const start = new Date('2023-04-01');
    const end = new Date('2024-03-31');
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }

  getInstitutionName(type) {
    const institutions = {
      LIC_PREMIUM: 'Life Insurance Corporation of India',
      PPF_INVESTMENT: 'State Bank of India',
      EPF_CONTRIBUTION: 'Employee Provident Fund Organization',
      ELSS_MUTUAL_FUND: 'SBI Mutual Fund',
      NSC: 'Post Office',
      SUKANYA_SAMRIDDHI: 'State Bank of India',
      HOME_LOAN_PRINCIPAL: 'HDFC Bank',
      TUITION_FEES: 'Delhi Public School',
    };

    return institutions[type] || 'Unknown Institution';
  }

  identifyDeductionType(text) {
    for (const [type, patterns] of Object.entries(this.deductionPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return type;
        }
      }
    }
    return 'UNKNOWN';
  }

  extractAmount(text) {
    // Extract amount patterns like "Rs. 50,000" or "₹50000"
    const amountPatterns = [
      /(?:rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:amount|paid|premium|investment):\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1].replace(/,/g, '');
        return parseFloat(amount);
      }
    }
    return null;
  }

  extractDate(text) {
    // Extract date patterns like "31-03-2024" or "31/03/2024"
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  extractReference(text) {
    // Extract reference numbers like "Policy No: 123456"
    const referencePatterns = [
      /(?:policy|reference|receipt|transaction)\s*(?:no|number)?:?\s*([A-Z0-9]+)/i,
      /ref\s*no:?\s*([A-Z0-9]+)/i,
    ];

    for (const pattern of referencePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}

export default DeductionOCRService;
