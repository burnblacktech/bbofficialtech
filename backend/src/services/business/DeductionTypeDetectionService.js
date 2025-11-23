// =====================================================
// DEDUCTION TYPE DETECTION SERVICE
// OCR-based detection of deduction types (LIC, PPF, etc.)
// =====================================================

const Tesseract = require('tesseract.js');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class DeductionTypeDetectionService {
  constructor() {
    this.deductionPatterns = {
      LIC_PREMIUM: [
        /life\s*insurance\s*corporation/i,
        /lic\s*premium/i,
        /policy\s*premium/i,
        /insurance\s*premium/i
      ],
      PPF_INVESTMENT: [
        /public\s*provident\s*fund/i,
        /ppf\s*account/i,
        /ppf\s*investment/i,
        /ppf\s*deposit/i
      ],
      EPF_CONTRIBUTION: [
        /employees\s*provident\s*fund/i,
        /epf\s*contribution/i,
        /provident\s*fund\s*contribution/i
      ],
      ELSS_MUTUAL_FUND: [
        /equity\s*linked\s*savings\s*scheme/i,
        /elss\s*mutual\s*fund/i,
        /tax\s*saving\s*fund/i
      ],
      NSC: [
        /national\s*savings\s*certificate/i,
        /nsc\s*investment/i,
        /nsc\s*deposit/i
      ],
      SUKANYA_SAMRIDDHI: [
        /sukanya\s*samriddhi/i,
        /sukanya\s*yojana/i,
        /girl\s*child\s*scheme/i
      ],
      HOME_LOAN_PRINCIPAL: [
        /home\s*loan/i,
        /housing\s*loan/i,
        /principal\s*repayment/i,
        /loan\s*repayment/i
      ],
      TUITION_FEES: [
        /tuition\s*fees/i,
        /education\s*fees/i,
        /school\s*fees/i,
        /college\s*fees/i
      ]
    };

    this.isOCRAvailable = this.checkOCRAvailability();
  }

  checkOCRAvailability() {
    try {
      return !!Tesseract;
    } catch (error) {
      enterpriseLogger.warn('OCR not available', { error: error.message });
      return false;
    }
  }

  async detectDeductionType(documentPath) {
    try {
      if (!this.isOCRAvailable) {
        return this.mockDetection(documentPath);
      }

      const ocrResult = await this.performOCR(documentPath);
      const detectedType = this.identifyDeductionType(ocrResult.text);
      const extractedData = this.extractDeductionData(ocrResult.text, detectedType);

      enterpriseLogger.info('Deduction type detected', {
        detectedType,
        confidence: ocrResult.confidence
      });

      return {
        type: detectedType,
        confidence: ocrResult.confidence,
        extractedData,
        rawText: ocrResult.text
      };
    } catch (error) {
      enterpriseLogger.error('Deduction type detection failed', {
        error: error.message
      });
      throw new AppError(`Deduction type detection failed: ${error.message}`, 500);
    }
  }

  async performOCR(documentPath) {
    try {
      const result = await Tesseract.recognize(documentPath, 'eng', {
        logger: m => enterpriseLogger.debug('OCR progress', { message: m })
      });

      return {
        text: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      enterpriseLogger.error('OCR processing failed', {
        error: error.message
      });
      throw error;
    }
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

  extractDeductionData(text, type) {
    const extractedData = {
      amount: this.extractAmount(text),
      date: this.extractDate(text),
      reference: this.extractReference(text),
      institution: this.extractInstitution(text, type)
    };

    return extractedData;
  }

  extractAmount(text) {
    // Extract amount patterns like "Rs. 50,000" or "₹50000"
    const amountPatterns = [
      /(?:rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:amount|paid|premium|investment):\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
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
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/
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
      /ref\s*no:?\s*([A-Z0-9]+)/i
    ];

    for (const pattern of referencePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  extractInstitution(text, type) {
    const institutionPatterns = {
      LIC_PREMIUM: /Life\s*Insurance\s*Corporation/i,
      PPF_INVESTMENT: /(?:State\s*Bank|HDFC|ICICI|Axis\s*Bank)/i,
      ELSS_MUTUAL_FUND: /(?:SBI\s*Mutual\s*Fund|HDFC\s*AMC|ICICI\s*Prudential)/i
    };

    const pattern = institutionPatterns[type];
    if (pattern) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  mockDetection(documentPath) {
    // Mock detection for development/testing
    const mockTypes = ['LIC_PREMIUM', 'PPF_INVESTMENT', 'EPF_CONTRIBUTION', 'ELSS_MUTUAL_FUND'];
    const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];

    return {
      type: randomType,
      confidence: 0.85,
      extractedData: {
        amount: 50000,
        date: new Date().toISOString().split('T')[0],
        reference: 'MOCK123456',
        institution: 'Mock Institution'
      },
      rawText: 'Mock OCR text'
    };
  }

  validateDetection(detection) {
    if (!detection.type || detection.type === 'UNKNOWN') {
      throw new AppError('Unable to determine deduction type', 400);
    }

    if (detection.confidence < 0.5) {
      enterpriseLogger.warn('Low confidence detection', {
        type: detection.type,
        confidence: detection.confidence
      });
    }

    return true;
  }
}

module.exports = new DeductionTypeDetectionService();

