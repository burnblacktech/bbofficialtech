// =====================================================
// BROKER CONTROLLER
// Handles broker file processing and API integration
// =====================================================

const brokerFileProcessingService = require('../services/business/BrokerFileProcessingService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xls', '.xlsx', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only .xls, .xlsx, and .csv files are allowed.', 400), false);
    }
  },
});

class BrokerController {
  constructor() {
    this.upload = upload;
  }

  // =====================================================
  // PROCESS BROKER FILE
  // =====================================================

  async processBrokerFile(req, res) {
    try {
      const userId = req.user.userId;
      const { broker } = req.body;

      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      if (!broker) {
        return res.status(400).json({
          error: 'Broker not specified',
        });
      }

      enterpriseLogger.info('Processing broker file', {
        userId,
        broker,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      const result = await brokerFileProcessingService.processFile(
        req.file.buffer,
        broker,
        userId,
      );

      res.json({
        success: true,
        data: result,
        message: 'Broker file processed successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Broker file processing failed', {
        userId: req.user.userId,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to process broker file',
        details: error.message,
      });
    }
  }

  // =====================================================
  // GET SUPPORTED BROKERS
  // =====================================================

  async getSupportedBrokers(req, res) {
    try {
      const brokers = [
        {
          id: 'zerodha',
          name: 'Zerodha',
          fileFormat: '.xls',
          apiAvailable: true,
          description: 'Upload P&L statement from Zerodha Console',
        },
        {
          id: 'angelone',
          name: 'Angel One',
          fileFormat: '.xls',
          apiAvailable: true,
          description: 'Upload capital gains report from Angel One',
        },
        {
          id: 'groww',
          name: 'Groww',
          fileFormat: '.xls',
          apiAvailable: false,
          description: 'Upload transaction statement from Groww',
        },
        {
          id: 'upstox',
          name: 'Upstox',
          fileFormat: '.xls',
          apiAvailable: true,
          description: 'Upload P&L report from Upstox',
        },
        {
          id: 'icici',
          name: 'ICICI Direct',
          fileFormat: '.xls',
          apiAvailable: false,
          description: 'Upload capital gains statement from ICICI Direct',
        },
      ];

      res.json({
        success: true,
        data: { brokers },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get supported brokers', {
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to get supported brokers',
      });
    }
  }

  // =====================================================
  // BROKER API AUTHENTICATION (Future)
  // =====================================================

  async authenticateBrokerAPI(req, res) {
    try {
      const userId = req.user.userId;
      const { broker, credentials } = req.body;

      // This would integrate with actual broker APIs
      // For now, return mock response
      const mockResponse = {
        authenticated: true,
        accessToken: 'mock_access_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      enterpriseLogger.info('Broker API authenticated', {
        userId,
        broker,
      });

      res.json({
        success: true,
        data: mockResponse,
      });

    } catch (error) {
      enterpriseLogger.error('Broker API authentication failed', {
        userId: req.user.userId,
        error: error.message,
      });

      res.status(500).json({
        error: 'Broker API authentication failed',
        details: error.message,
      });
    }
  }

  // =====================================================
  // FETCH CAPITAL GAINS FROM BROKER API (Future)
  // =====================================================

  async fetchCapitalGainsFromAPI(req, res) {
    try {
      const userId = req.user.userId;
      const { broker } = req.params;
      const { startDate, endDate } = req.query;

      // This would integrate with actual broker APIs
      // For now, return mock data
      const mockData = {
        transactions: [
          {
            symbol: 'RELIANCE',
            buyDate: '2023-01-15',
            sellDate: '2024-02-20',
            buyPrice: 2500,
            sellPrice: 2800,
            quantity: 10,
            profit: 3000,
            type: 'long_term',
            exempt: true,
          },
        ],
        shortTerm: 0,
        longTerm: 0,
        exemptLongTerm: 3000,
      };

      enterpriseLogger.info('Capital gains fetched from broker API', {
        userId,
        broker,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: mockData,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to fetch capital gains from broker API', {
        userId: req.user.userId,
        broker: req.params.broker,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to fetch capital gains from broker API',
        details: error.message,
      });
    }
  }

  // =====================================================
  // GET BROKER API STATUS
  // =====================================================

  async getBrokerAPIStatus(req, res) {
    try {
      const { broker } = req.params;

      const status = {
        available: true,
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 1000) + 100, // Mock response time
      };

      res.json({
        success: true,
        data: { status },
      });

    } catch (error) {
      enterpriseLogger.error('Failed to get broker API status', {
        broker: req.params.broker,
        error: error.message,
      });

      res.status(500).json({
        error: 'Failed to get broker API status',
      });
    }
  }
}

module.exports = new BrokerController();
