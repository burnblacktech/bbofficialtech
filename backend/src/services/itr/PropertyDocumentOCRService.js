// =====================================================
// PROPERTY DOCUMENT OCR SERVICE
// Extracts data from property documents (sale deed, registration, etc.)
// =====================================================

const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const enterpriseLogger = require('../../utils/logger');

class PropertyDocumentOCRService {
  /**
   * Process property document and extract structured data
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} documentType - Type of document (sale_deed, registration, etc.)
   * @returns {Promise<Object>} Extracted property data
   */
  async processDocument(fileBuffer, fileName, documentType = 'sale_deed') {
    let tempFilePath = null;

    try {
      // Create temporary file for OCR processing
      const tempDir = os.tmpdir();
      const tempFileName = `property-doc-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(fileName)}`;
      tempFilePath = path.join(tempDir, tempFileName);

      await fs.writeFile(tempFilePath, fileBuffer);

      enterpriseLogger.info('Starting property document OCR', {
        fileName,
        documentType,
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
      const extractedData = this.parsePropertyDocument(extractedText, documentType);

      return {
        success: true,
        extractedData: {
          ...extractedData,
          rawText: extractedText,
        },
        confidence,
      };
    } catch (error) {
      enterpriseLogger.error('Property document OCR failed', {
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
   * Parse OCR text to extract property information
   * @param {string} text - OCR extracted text
   * @param {string} documentType - Type of document
   * @returns {Object} Structured property data
   */
  parsePropertyDocument(text, documentType) {
    const normalizedText = text.toUpperCase();

    // Extract property address
    const addressPatterns = [
      /(?:ADDRESS|LOCATION|PROPERTY)[\s:]*([A-Z0-9\s,.-]+(?:STREET|ROAD|AVENUE|LANE|NAGAR|COLONY|VILLAGE|CITY|STATE|PIN)[A-Z0-9\s,.-]*)/i,
      /([A-Z0-9\s,.-]{20,100})/i,
    ];
    let propertyAddress = this.extractPattern(normalizedText, addressPatterns);

    // Extract owner/buyer name
    const ownerPatterns = [
      /(?:OWNER|BUYER|PURCHASER)[\s:]*([A-Z\s]{3,50})/i,
      /(?:NAME OF|NAME)[\s:]*([A-Z\s]{3,50})/i,
    ];
    const ownerName = this.extractPattern(normalizedText, ownerPatterns);

    // Extract seller name
    const sellerPatterns = [
      /(?:SELLER|VENDOR)[\s:]*([A-Z\s]{3,50})/i,
    ];
    const sellerName = this.extractPattern(normalizedText, sellerPatterns);

    // Extract registration number
    const regPatterns = [
      /(?:REGISTRATION|REG\.?|REG NO\.?)[\s:]*([A-Z0-9/-]{5,20})/i,
      /REG[:\s]*([A-Z0-9/-]{5,20})/i,
    ];
    const registrationNumber = this.extractPattern(normalizedText, regPatterns);

    // Extract registration date
    const datePatterns = [
      /(?:DATE|DATED|ON)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    ];
    const registrationDate = this.extractPattern(normalizedText, datePatterns);

    // Extract purchase/sale price
    const pricePatterns = [
      /(?:PRICE|AMOUNT|VALUE|CONSIDERATION)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i,
      /[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)[\s]*(?:RUPEES|RS\.?|₹)/i,
    ];
    const priceText = this.extractPattern(normalizedText, pricePatterns);
    const purchasePrice = priceText ? this.parseAmount(priceText) : null;

    // Extract property type
    const propertyTypePatterns = [
      /(?:RESIDENTIAL|COMMERCIAL|INDUSTRIAL|AGRICULTURAL|PLOT|LAND|FLAT|APARTMENT|HOUSE|VILLA)/i,
    ];
    const propertyType = this.extractPattern(normalizedText, propertyTypePatterns) || 'Residential';

    // Extract area
    const areaPatterns = [
      /(?:AREA|SIZE|SQUARE|SQ\.?)[\s:]*(\d+(?:[.,]\d+)?)[\s]*(?:SQ\.?[\s]*FT|SQUARE[\s]*FEET|SQFT|SQM|SQUARE[\s]*METERS?)/i,
      /(\d+(?:[.,]\d+)?)[\s]*(?:SQ\.?[\s]*FT|SQUARE[\s]*FEET|SQFT)/i,
    ];
    const areaText = this.extractPattern(normalizedText, areaPatterns);
    const area = areaText ? `${areaText} sq ft` : null;

    // Extract PAN
    const panPatterns = [
      /(?:PAN|PERMANENT[\s]*ACCOUNT)[\s:]*([A-Z]{5}\d{4}[A-Z])/i,
      /([A-Z]{5}\d{4}[A-Z])/,
    ];
    const sellerPAN = this.extractPattern(normalizedText, panPatterns);

    return {
      propertyAddress: propertyAddress || 'Extracted Property Address',
      ownerName: ownerName || 'Extracted Owner Name',
      sellerName: sellerName || 'Extracted Seller Name',
      registrationNumber: registrationNumber || 'REG-XXXXX',
      registrationDate: registrationDate || new Date().toISOString().split('T')[0],
      propertyType: propertyType,
      area: area || 'N/A',
      purchasePrice: purchasePrice ? purchasePrice.toString() : null,
      sellerPAN: sellerPAN || null,
      documentType,
    };
  }

  /**
   * Extract pattern from text
   * @param {string} text - Text to search
   * @param {Array<RegExp>} patterns - Array of regex patterns to try
   * @returns {string|null} Extracted value or null
   */
  extractPattern(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Parse amount string to number
   * @param {string} amountText - Amount as string (e.g., "50,00,000" or "5000000")
   * @returns {number} Parsed amount
   */
  parseAmount(amountText) {
    if (!amountText) return null;
    // Remove commas, spaces, and currency symbols
    const cleaned = amountText.replace(/[₹,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
}

module.exports = new PropertyDocumentOCRService();

