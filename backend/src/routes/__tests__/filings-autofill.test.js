/**
 * Unit tests for auto-fill endpoints in filings.js
 * POST /api/filings/:id/auto-fill
 * POST /api/filings/:id/auto-fill/resolve
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock models before requiring anything
jest.mock('../../models', () => ({
  ITRFiling: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  IncomeEntry: { findAll: jest.fn().mockResolvedValue([]) },
  ExpenseEntry: { findAll: jest.fn().mockResolvedValue([]) },
  InvestmentEntry: { findAll: jest.fn().mockResolvedValue([]) },
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-1', role: 'END_USER' };
    next();
  },
}));

jest.mock('../../services/core/FilingService', () => ({
  createFiling: jest.fn(),
  getFiling: jest.fn(),
  listFilings: jest.fn(),
}));

jest.mock('../../domain/SubmissionStateMachine', () => ({
  transition: jest.fn(),
}));

jest.mock('../../services/itr/ReviewRequirementService', () => ({
  deriveRequirement: jest.fn(),
  getRequirementExplanation: jest.fn(),
}));

jest.mock('../../services/ITRApplicabilityService', () => ({
  evaluate: jest.fn(),
}));

jest.mock('../../services/FilingExportService', () => ({
  exportFiling: jest.fn(),
  getExportFilename: jest.fn(),
}));

jest.mock('../../services/FinancialStoryService', () => ({
  maskPan: jest.fn(),
  extractIncomeSummary: jest.fn(),
  extractSalaryStory: jest.fn(),
  extractCapitalGainsStory: jest.fn(),
  extractBusinessStory: jest.fn(),
  extractOtherIncomeStory: jest.fn(),
  extractTDS: jest.fn(),
  deriveChecklist: jest.fn(),
  explainCArequirement: jest.fn(),
}));

jest.mock('../../services/itr/FilingSnapshotService', () => ({
  getLatestSnapshot: jest.fn(),
}));

jest.mock('../../services/itr/FilingSafetyService', () => ({
  getSafetyStatus: jest.fn(),
}));

jest.mock('../../services/tax/TaxRegimeAssembly', () => ({}));

jest.mock('../../services/itr/TaxRegimeCalculatorV2', () => ({
  compareRegimes: jest.fn(),
}));

jest.mock('../../services/ERIOutcomeService', () => ({
  getSubmissionStatus: jest.fn(),
}));

jest.mock('../../services/itr/FilingCompletenessService', () => ({
  validate: jest.fn(),
}));

jest.mock('../../services/import/AutoFillService', () => ({
  AutoFillService: {
    autoFill: jest.fn(),
  },
  AutoFillMapper: {},
}));

// Mock the import sub-routes to avoid loading real import routes
jest.mock('../import', () => {
  const express = require('express');
  return express.Router();
});

// ── Setup ────────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');
const { ITRFiling } = require('../../models');
const { AutoFillService } = require('../../services/import/AutoFillService');
const { AppError } = require('../../middleware/errorHandler');

// Build a minimal Express app with the filings router + error handler
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/filings', require('../filings'));
  // Simple error handler that mirrors the real one
  app.use((err, _req, res, _next) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_ERROR',
    });
  });
  return app;
}

const app = buildApp();

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DRAFT_FILING = {
  id: 'filing-1',
  createdBy: 'user-1',
  userId: 'user-1',
  taxpayerPan: 'ABCDE1234F',
  assessmentYear: '2024-25',
  lifecycleState: 'draft',
  jsonPayload: { income: { salary: { gross: 500000 } } },
  update: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

const SUBMITTED_FILING = {
  ...DRAFT_FILING,
  id: 'filing-2',
  lifecycleState: 'submitted_to_eri',
};

const OTHER_USER_FILING = {
  ...DRAFT_FILING,
  id: 'filing-3',
  createdBy: 'other-user',
  userId: 'other-user',
};

// ── Tests: POST /:id/auto-fill ──────────────────────────────────────────────

describe('POST /api/filings/:id/auto-fill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when filing not found', async () => {
    ITRFiling.findByPk.mockResolvedValue(null);

    const res = await request(app).post('/api/filings/bad-id/auto-fill').send();

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('should return 403 when user does not own filing', async () => {
    ITRFiling.findByPk.mockResolvedValue(OTHER_USER_FILING);

    const res = await request(app).post('/api/filings/filing-3/auto-fill').send();

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should return 400 when filing is not in draft state', async () => {
    ITRFiling.findByPk.mockResolvedValue(SUBMITTED_FILING);

    const res = await request(app).post('/api/filings/filing-2/auto-fill').send();

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('FILING_NOT_EDITABLE');
  });

  it('should return mapped payload and summary on success', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);
    AutoFillService.autoFill.mockResolvedValue({
      mappedPayload: { income: { salary: { gross: 1200000 } } },
      conflicts: [],
      summary: { fieldsPopulated: 5, totalIncome: 1200000, totalTDS: 120000, sources: ['26AS', 'AIS'] },
    });

    const res = await request(app).post('/api/filings/filing-1/auto-fill').send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mappedPayload).toBeDefined();
    expect(res.body.data.conflicts).toEqual([]);
    expect(res.body.data.summary.fieldsPopulated).toBe(5);
    expect(AutoFillService.autoFill).toHaveBeenCalledWith('filing-1', 'user-1');
  });

  it('should propagate PAN_NOT_VERIFIED error from AutoFillService', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);
    AutoFillService.autoFill.mockRejectedValue(
      new AppError('PAN must be verified', 400, 'PAN_NOT_VERIFIED'),
    );

    const res = await request(app).post('/api/filings/filing-1/auto-fill').send();

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PAN_NOT_VERIFIED');
  });

  it('should propagate ITR_SESSION_EXPIRED error from AutoFillService', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);
    AutoFillService.autoFill.mockRejectedValue(
      new AppError('Session expired', 401, 'ITR_SESSION_EXPIRED'),
    );

    const res = await request(app).post('/api/filings/filing-1/auto-fill').send();

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('ITR_SESSION_EXPIRED');
  });

  it('should propagate SUREPASS_SERVICE_UNAVAILABLE error from AutoFillService', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);
    AutoFillService.autoFill.mockRejectedValue(
      new AppError('Service unavailable', 503, 'SUREPASS_SERVICE_UNAVAILABLE'),
    );

    const res = await request(app).post('/api/filings/filing-1/auto-fill').send();

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('SUREPASS_SERVICE_UNAVAILABLE');
  });

  it('should return conflicts when auto-fill detects them', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);
    AutoFillService.autoFill.mockResolvedValue({
      mappedPayload: { income: { otherSources: { dividendIncome: 25000 } } },
      conflicts: [
        { field: 'income.otherSources.dividendIncome', existingValue: 10000, newValue: 25000, source: 'ais' },
      ],
      summary: { fieldsPopulated: 1, totalIncome: 25000, totalTDS: 0, sources: ['AIS'] },
    });

    const res = await request(app).post('/api/filings/filing-1/auto-fill').send();

    expect(res.status).toBe(200);
    expect(res.body.data.conflicts).toHaveLength(1);
    expect(res.body.data.conflicts[0].field).toBe('income.otherSources.dividendIncome');
  });
});

// ── Tests: POST /:id/auto-fill/resolve ──────────────────────────────────────

describe('POST /api/filings/:id/auto-fill/resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when resolutions is missing', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_RESOLUTION');
  });

  it('should return 400 when resolutions is empty array', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({ resolutions: [] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_RESOLUTION');
  });

  it('should return 400 when resolution has invalid keepValue', async () => {
    ITRFiling.findByPk.mockResolvedValue(DRAFT_FILING);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'invalid' }] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_RESOLUTION');
  });

  it('should return 404 when filing not found', async () => {
    ITRFiling.findByPk.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/filings/bad-id/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'existing' }] });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('should return 403 when user does not own filing', async () => {
    ITRFiling.findByPk.mockResolvedValue(OTHER_USER_FILING);

    const res = await request(app)
      .post('/api/filings/filing-3/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'existing' }] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should return 400 when filing is not in draft state', async () => {
    ITRFiling.findByPk.mockResolvedValue(SUBMITTED_FILING);

    const res = await request(app)
      .post('/api/filings/filing-2/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'existing' }] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('FILING_NOT_EDITABLE');
  });

  it('should apply "existing" resolution (keep current value)', async () => {
    const filing = {
      ...DRAFT_FILING,
      jsonPayload: {
        income: { salary: { gross: 500000 } },
        _autoFill: { lastMappedPayload: { income: { salary: { gross: 1200000 } } }, conflicts: [] },
      },
      update: jest.fn().mockResolvedValue(true),
    };
    ITRFiling.findByPk.mockResolvedValue(filing);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'existing' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // For 'existing', the value should remain unchanged
    const updatedPayload = filing.update.mock.calls[0][0].jsonPayload;
    expect(updatedPayload.income.salary.gross).toBe(500000);
  });

  it('should apply "new" resolution (use auto-fill value)', async () => {
    const filing = {
      ...DRAFT_FILING,
      jsonPayload: {
        income: { salary: { gross: 500000 } },
        _autoFill: { lastMappedPayload: { income: { salary: { gross: 1200000 } } }, conflicts: [] },
      },
      update: jest.fn().mockResolvedValue(true),
    };
    ITRFiling.findByPk.mockResolvedValue(filing);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'new' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const updatedPayload = filing.update.mock.calls[0][0].jsonPayload;
    expect(updatedPayload.income.salary.gross).toBe(1200000);
  });

  it('should record resolved conflicts in _autoFill metadata', async () => {
    const filing = {
      ...DRAFT_FILING,
      jsonPayload: {
        income: { salary: { gross: 500000 } },
        _autoFill: { lastMappedPayload: {}, conflicts: [] },
      },
      update: jest.fn().mockResolvedValue(true),
    };
    ITRFiling.findByPk.mockResolvedValue(filing);

    const res = await request(app)
      .post('/api/filings/filing-1/auto-fill/resolve')
      .send({ resolutions: [{ field: 'income.salary.gross', keepValue: 'existing' }] });

    expect(res.status).toBe(200);
    const updatedPayload = filing.update.mock.calls[0][0].jsonPayload;
    expect(updatedPayload._autoFill.conflicts).toHaveLength(1);
    expect(updatedPayload._autoFill.conflicts[0].field).toBe('income.salary.gross');
    expect(updatedPayload._autoFill.conflicts[0].resolution).toBe('existing');
  });
});
