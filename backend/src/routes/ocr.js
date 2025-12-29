// =====================================================
// OCR ROUTES
// Document processing and OCR extraction
// =====================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const enterpriseLogger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only images (.jpg, .png) and PDF files are allowed.', 400), false);
    }
  },
});

/**
 * Process rent receipt OCR
 */
router.post('/rent-receipt', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    enterpriseLogger.info('Processing rent receipt OCR', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    // Use RentReceiptOCRService for actual OCR processing
    const RentReceiptOCRService = require('../services/itr/RentReceiptOCRService');
    const result = await RentReceiptOCRService.processDocument(
      req.file.buffer,
      req.file.originalname
    );

    if (result.success) {
      res.json({
        success: true,
        extractedData: {
          text: result.extractedData.rawText,
          landlord: result.extractedData.landlordName,
          address: result.extractedData.propertyAddress,
          rent: result.extractedData.rentAmount?.toString() || '0',
          period: result.extractedData.period || null,
          date: result.extractedData.receiptDate || null,
          receipt_no: result.extractedData.receiptNumber || null,
          tds: result.extractedData.tdsDeducted?.toString() || '0',
        },
        confidence: result.confidence,
        message: 'Rent receipt processed successfully',
      });
    } else {
      throw new Error('OCR processing failed');
    }

  } catch (error) {
    enterpriseLogger.error('Rent receipt OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process rent receipt',
    });
  }
});

/**
 * Process deduction document OCR
 */
router.post('/deduction', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    enterpriseLogger.info('Processing deduction document OCR', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    // Import deduction OCR service
    const DeductionOCRService = require('../services/business/DeductionOCRService');
    const result = await DeductionOCRService.processDocument(req.file);

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    enterpriseLogger.error('Deduction OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process deduction document',
    });
  }
});

/**
 * Process property document OCR (sale deed, registration, etc.)
 */
router.post('/property-document', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { propertyId, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    enterpriseLogger.info('Processing property document OCR', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      propertyId,
      documentType,
    });

    // Use PropertyDocumentOCRService for actual OCR processing
    const PropertyDocumentOCRService = require('../services/business/PropertyDocumentOCRService');
    const result = await PropertyDocumentOCRService.processDocument(
      req.file.buffer,
      req.file.originalname,
      documentType || 'sale_deed'
    );

    if (result.success) {
      res.json({
        success: true,
        extractedData: result.extractedData,
        confidence: result.confidence,
        message: 'Property document processed successfully',
      });
    } else {
      throw new Error('OCR processing failed');
    }

  } catch (error) {
    enterpriseLogger.error('Property document OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process property document',
    });
  }
});

/**
 * Batch process rent receipts
 */
router.post('/rent-receipts-batch', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { filingId, propertyId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    enterpriseLogger.info('Processing batch rent receipt OCR', {
      userId,
      fileCount: req.files.length,
      filingId,
      propertyId,
    });

    // Process each file using real OCR service
    const RentReceiptOCRService = require('../services/business/RentReceiptOCRService');
    const results = [];

    for (const file of req.files) {
      try {
        const result = await RentReceiptOCRService.processDocument(
          file.buffer,
          file.originalname
        );

        if (result.success) {
          results.push({
            fileName: file.originalname,
            success: true,
            extractedData: {
              text: result.extractedData.rawText,
              landlord: result.extractedData.landlordName,
              address: result.extractedData.propertyAddress,
              rent: result.extractedData.rentAmount?.toString() || '0',
              period: result.extractedData.period || null,
              date: result.extractedData.receiptDate || null,
              receipt_no: result.extractedData.receiptNumber || null,
              tds: result.extractedData.tdsDeducted?.toString() || '0',
            },
            confidence: result.confidence,
          });
        } else {
          throw new Error('OCR processing failed');
        }
      } catch (fileError) {
        enterpriseLogger.error('Rent receipt OCR failed for file', {
          fileName: file.originalname,
          error: fileError.message,
        });
        results.push({
          fileName: file.originalname,
          success: false,
          error: fileError.message,
        });
      }
    }

    res.json({
      success: true,
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: `Processed ${results.length} rent receipt(s)`,
    });

  } catch (error) {
    enterpriseLogger.error('Batch rent receipt OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process rent receipts',
    });
  }
});

/**
 * Process sale deed OCR
 */
router.post('/sale-deed', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId, assetType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    enterpriseLogger.info('Processing sale deed OCR', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      transactionId,
      assetType,
    });

    // Mock extracted data structure
    // In production, integrate with actual OCR service
    const mockExtractedData = {
      text: req.file.originalname,
      propertyAddress: 'Extracted Property Address',
      sellerName: 'Extracted Seller Name',
      buyerName: 'Extracted Buyer Name',
      registrationNumber: 'REG-12345',
      registrationDate: '01-01-2020',
      saleValue: '5000000',
      purchaseValue: '3000000',
      stampDuty: '250000',
      registrationFee: '50000',
      assetType: assetType || 'Property',
    };

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      success: true,
      extractedData: mockExtractedData,
      confidence: 0.80,
      message: 'Sale deed processed successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Sale deed OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process sale deed',
    });
  }
});

/**
 * Process broker statement OCR
 */
router.post('/broker-statement', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { brokerName, statementType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    enterpriseLogger.info('Processing broker statement OCR', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      brokerName,
      statementType,
    });

    // Mock extracted data structure
    // In production, integrate with actual OCR service
    const mockExtractedData = {
      text: req.file.originalname,
      brokerName: brokerName || 'Extracted Broker Name',
      statementPeriod: 'April 2023 - March 2024',
      transactions: [
        {
          scriptName: 'RELIANCE',
          buyDate: '01-04-2023',
          sellDate: '15-06-2023',
          quantity: 100,
          buyPrice: 2500,
          sellPrice: 2800,
          buyValue: 250000,
          sellValue: 280000,
          profit: 30000,
          stt: 280,
          brokerage: 500,
          stampDuty: 50,
          transactionType: 'STCG',
        },
      ],
      totalProfit: 30000,
      totalLoss: 0,
    };

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({
      success: true,
      extractedData: mockExtractedData,
      confidence: 0.78,
      message: 'Broker statement processed successfully',
    });

  } catch (error) {
    enterpriseLogger.error('Broker statement OCR failed', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process broker statement',
    });
  }
});

module.exports = router;

