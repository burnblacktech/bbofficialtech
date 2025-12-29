// =====================================================
// RENT RECEIPT OCR SERVICE
// Extracts data from rent receipt documents
// =====================================================

const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const enterpriseLogger = require('../../utils/logger');

class RentReceiptOCRService {
  /**
   * Process rent receipt document and extract structured data
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Extracted rent receipt data
   */
  async processDocument(fileBuffer, fileName) {
    let tempFilePath = null;

    try {
      // Create temporary file for OCR processing
      const tempDir = os.tmpdir();
      const tempFileName = `rent-receipt-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(fileName)}`;
      tempFilePath = path.join(tempDir, tempFileName);

      await fs.writeFile(tempFilePath, fileBuffer);

      enterpriseLogger.info('Starting rent receipt OCR', {
        fileName,
        tempFilePath,
      });

      // Perform OCR
      const ocrResult = await Tesseract.recognize(tempFilePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            enterpriseLogger.debug('OCR progress', {
              progress: Math.round(m.progress * 100),
            });
          }
        },
      });

      const extractedText = ocrResult.data.text;
      const confidence = ocrResult.data.confidence / 100; // Convert to 0-1 scale

      enterpriseLogger.info('OCR completed', {
        fileName,
        textLength: extractedText.length,
        confidence,
      });

      // Parse extracted text to structured data
      const extractedData = this.parseRentReceipt(extractedText);

      return {
        success: true,
        extractedData: {
          ...extractedData,
          rawText: extractedText,
        },
        confidence,
      };
    } catch (error) {
      enterpriseLogger.error('Rent receipt OCR failed', {
        fileName,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && (await fs.pathExists(tempFilePath))) {
        try {
          await fs.remove(tempFilePath);
        } catch (cleanupError) {
          enterpriseLogger.warn('Failed to cleanup temp file', {
            tempFilePath,
            error: cleanupError.message,
          });
        }
      }
    }
  }

  /**
   * Parse OCR text to extract rent receipt information
   * @param {string} text - OCR extracted text
   * @returns {Object} Structured rent receipt data
   */
  parseRentReceipt(text) {
    const normalizedText = text.toLowerCase();

    // Extract landlord name (look for patterns like "Received from", "From", "Landlord")
    const landlordPatterns = [
      /received\s+from[:\s]+([a-z\s]+?)(?:\n|$|for|rs|rupees)/i,
      /from[:\s]+([a-z\s]+?)(?:\n|$|for|rs|rupees)/i,
      /landlord[:\s]+([a-z\s]+?)(?:\n|$|for|rs|rupees)/i,
    ];

    let landlordName = null;
    for (const pattern of landlordPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        landlordName = match[1].trim();
        break;
      }
    }

    // Extract property address
    const addressPatterns = [
      /address[:\s]+([^\n]+)/i,
      /property[:\s]+address[:\s]+([^\n]+)/i,
      /located\s+at[:\s]+([^\n]+)/i,
    ];

    let propertyAddress = null;
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        propertyAddress = match[1].trim();
        break;
      }
    }

    // Extract rent amount (look for currency patterns)
    const rentPatterns = [
      /rent[:\s]+(?:of|rs\.?|rupees?)?[:\s]*([\d,]+)/i,
      /amount[:\s]+(?:rs\.?|rupees?)?[:\s]*([\d,]+)/i,
      /rs\.?\s*([\d,]+)/i,
      /rupees?\s*([\d,]+)/i,
    ];

    let rentAmount = null;
    for (const pattern of rentPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        rentAmount = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Extract period (month/year)
    const periodPatterns = [
      /(?:for|period|month)[:\s]+([a-z]+\s+\d{4})/i,
      /([a-z]+\s+\d{4})/i,
      /(\d{1,2}[-\/]\d{4})/i,
    ];

    let period = null;
    for (const pattern of periodPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        period = match[1].trim();
        break;
      }
    }

    // Extract receipt date
    const datePatterns = [
      /date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    ];

    let receiptDate = null;
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        receiptDate = match[1].trim();
        break;
      }
    }

    // Extract receipt number
    const receiptNoPatterns = [
      /receipt\s+(?:no|number)[:\s]+([a-z0-9\-]+)/i,
      /receipt[:\s]+([a-z0-9\-]+)/i,
    ];

    let receiptNumber = null;
    for (const pattern of receiptNoPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        receiptNumber = match[1].trim();
        break;
      }
    }

    // Extract TDS deducted
    const tdsPatterns = [
      /tds[:\s]+(?:deducted|rs\.?|rupees?)?[:\s]*([\d,]+)/i,
      /tax\s+deducted[:\s]+(?:rs\.?|rupees?)?[:\s]*([\d,]+)/i,
    ];

    let tdsDeducted = 0;
    for (const pattern of tdsPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        tdsDeducted = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    return {
      landlordName: landlordName || 'Extracted Landlord Name',
      propertyAddress: propertyAddress || 'Extracted Property Address',
      rentAmount: rentAmount || 0,
      period: period || null,
      receiptDate: receiptDate || null,
      receiptNumber: receiptNumber || null,
      tdsDeducted: tdsDeducted || 0,
    };
  }
}

module.exports = new RentReceiptOCRService();

