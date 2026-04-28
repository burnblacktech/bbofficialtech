/**
 * Unit tests for AutoFillService and AutoFillMapper
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../models/ITRFiling');
jest.mock('../../common/SurePassITRClient', () => ({
  getSession: jest.fn(),
  authenticate: jest.fn(),
  fetch26AS: jest.fn(),
  fetchAIS: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const ITRFiling = require('../../../models/ITRFiling');
const surePassClient = require('../../common/SurePassITRClient');
const { AutoFillService, AutoFillMapper } = require('../AutoFillService');

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_FILING = {
  id: 'filing-1',
  createdBy: 'user-1',
  userId: 'user-1',
  taxpayerPan: 'ABCDE1234F',
  assessmentYear: '2024-25',
  jsonPayload: {},
};

const MOCK_SESSION = {
  clientId: 'client-123',
  pan: 'ABCDE1234F',
  expiresAt: Date.now() + 30 * 60 * 1000,
};

const MOCK_RAW_26AS = {
  assessment_year: '2024-2025',
  tds_data: [
    {
      name_of_deductor: 'ACME CORP',
      tan_of_deductor: 'DELA12345A',
      section: '192',
      amount_paid: '1200000',
      tax_deducted: '120000',
      transaction_date: '31-Mar-2024',
    },
    {
      name_of_deductor: 'STATE BANK',
      tan_of_deductor: 'MUMB67890B',
      section: '194A',
      amount_paid: '50000',
      tax_deducted: '5000',
      transaction_date: '30-Jun-2023',
    },
    {
      name_of_deductor: 'CONTRACTOR INC',
      tan_of_deductor: 'DELC11111C',
      section: '194C',
      amount_paid: '200000',
      tax_deducted: '2000',
      transaction_date: '15-Jan-2024',
    },
  ],
};

const MOCK_RAW_AIS = {
  financial_year: '2023-2024',
  sft_data: [
    {
      information_code: 'SFT-015',
      information_description: 'Dividend',
      reported_by_source: '25000',
      accepted_by_taxpayer: '25000',
      payer_name: 'INVESTMENTS LTD',
      payer_tan: 'DELI22222A',
    },
    {
      information_code: 'SFT-004',
      information_description: 'Interest from savings',
      reported_by_source: '15000',
      accepted_by_taxpayer: '14500',
      payer_name: 'STATE BANK',
      payer_tan: 'MUMB67890B',
    },
  ],
};

// ── AutoFillMapper Tests ─────────────────────────────────────────────────────

describe('AutoFillMapper', () => {
  describe('mapFrom26AS', () => {
    it('should return empty object for null input', () => {
      expect(AutoFillMapper.mapFrom26AS(null)).toEqual({});
    });

    it('should map section 192 entries to salary employers', () => {
      const SurePass26ASTransformer = require('../transformers/SurePass26ASTransformer');
      const normalized = SurePass26ASTransformer.transform(MOCK_RAW_26AS, 'ABCDE1234F');
      const result = AutoFillMapper.mapFrom26AS(normalized, {});

      expect(result.income).toBeDefined();
      expect(result.income.salary).toBeDefined();
      expect(result.income.salary.employers).toBeDefined();

      const salaryEmployer = result.income.salary.employers.find(
        e => e.tan === 'DELA12345A',
      );
      expect(salaryEmployer).toBeDefined();
      expect(salaryEmployer.name).toBe('ACME CORP');
      expect(salaryEmployer.tdsDeducted).toBe(120000);
    });

    it('should map section 194A and other non-salary entries to TDS entries', () => {
      const SurePass26ASTransformer = require('../transformers/SurePass26ASTransformer');
      const normalized = SurePass26ASTransformer.transform(MOCK_RAW_26AS, 'ABCDE1234F');
      const result = AutoFillMapper.mapFrom26AS(normalized, {});

      expect(result.taxes).toBeDefined();
      expect(result.taxes.tds).toBeDefined();
      expect(result.taxes.tds.nonSalaryEntries.length).toBe(2); // 194A + 194C

      const fdEntry = result.taxes.tds.nonSalaryEntries.find(
        e => e.sectionCode === '194A',
      );
      expect(fdEntry).toBeDefined();
      expect(fdEntry.deductorName).toBe('STATE BANK');
      expect(fdEntry.tdsDeducted).toBe(5000);
    });

    it('should enrich existing employer when TAN matches', () => {
      const SurePass26ASTransformer = require('../transformers/SurePass26ASTransformer');
      const normalized = SurePass26ASTransformer.transform(MOCK_RAW_26AS, 'ABCDE1234F');
      const existingPayload = {
        income: {
          salary: {
            employers: [{ name: 'Acme Corp', tan: 'DELA12345A', grossSalary: 1000000 }],
          },
        },
      };
      const result = AutoFillMapper.mapFrom26AS(normalized, existingPayload);

      const employer = result.income.salary.employers.find(e => e.tan === 'DELA12345A');
      expect(employer.grossSalary).toBe(1000000); // preserved
      expect(employer.tdsDeducted).toBe(120000); // enriched from 26AS
    });
  });

  describe('mapFromAIS', () => {
    it('should return empty object for null input', () => {
      expect(AutoFillMapper.mapFromAIS(null)).toEqual({});
    });

    it('should map SFT-015 to dividend income', () => {
      const SurePassAISTransformer = require('../transformers/SurePassAISTransformer');
      const normalized = SurePassAISTransformer.transform(MOCK_RAW_AIS, 'ABCDE1234F');
      const result = AutoFillMapper.mapFromAIS(normalized, {});

      expect(result.income).toBeDefined();
      expect(result.income.otherSources).toBeDefined();
      expect(result.income.otherSources.dividendIncome).toBe(25000);
    });

    it('should map SFT-004 to savings interest', () => {
      const SurePassAISTransformer = require('../transformers/SurePassAISTransformer');
      const normalized = SurePassAISTransformer.transform(MOCK_RAW_AIS, 'ABCDE1234F');
      const result = AutoFillMapper.mapFromAIS(normalized, {});

      expect(result.income.otherSources.savingsInterest).toBe(14500);
    });
  });

  describe('detectConflicts', () => {
    it('should return empty array when no conflicts', () => {
      const existing = { income: { salary: { gross: 100000 } } };
      const incoming = { income: { salary: { gross: 100000 } } };
      expect(AutoFillMapper.detectConflicts(existing, incoming)).toEqual([]);
    });

    it('should return empty array for null inputs', () => {
      expect(AutoFillMapper.detectConflicts(null, {})).toEqual([]);
      expect(AutoFillMapper.detectConflicts({}, null)).toEqual([]);
    });

    it('should detect differing numeric values', () => {
      const existing = { income: { otherSources: { dividendIncome: 20000 } } };
      const incoming = { income: { otherSources: { dividendIncome: 25000 } } };
      const conflicts = AutoFillMapper.detectConflicts(existing, incoming);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].field).toBe('income.otherSources.dividendIncome');
      expect(conflicts[0].existingValue).toBe(20000);
      expect(conflicts[0].newValue).toBe(25000);
    });

    it('should ignore differences less than ₹1', () => {
      const existing = { income: { otherSources: { savingsInterest: 14500.4 } } };
      const incoming = { income: { otherSources: { savingsInterest: 14500.8 } } };
      expect(AutoFillMapper.detectConflicts(existing, incoming)).toEqual([]);
    });

    it('should not flag fields that only exist in incoming', () => {
      const existing = {};
      const incoming = { income: { otherSources: { dividendIncome: 25000 } } };
      expect(AutoFillMapper.detectConflicts(existing, incoming)).toEqual([]);
    });

    it('should detect string value conflicts', () => {
      const existing = { income: { salary: { employers: [{ name: 'Old Corp' }] } } };
      const incoming = { income: { salary: { employers: [{ name: 'New Corp' }] } } };
      const conflicts = AutoFillMapper.detectConflicts(existing, incoming);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].existingValue).toBe('Old Corp');
      expect(conflicts[0].newValue).toBe('New Corp');
    });
  });

  describe('mergePayloads', () => {
    it('should deep-merge nested objects', () => {
      const base = { income: { salary: { gross: 100000 } } };
      const overlay = { income: { otherSources: { dividendIncome: 25000 } } };
      const result = AutoFillMapper.mergePayloads(base, overlay);

      expect(result.income.salary.gross).toBe(100000);
      expect(result.income.otherSources.dividendIncome).toBe(25000);
    });

    it('should concatenate arrays', () => {
      const base = { taxes: { tds: { nonSalaryEntries: [{ id: 1 }] } } };
      const overlay = { taxes: { tds: { nonSalaryEntries: [{ id: 2 }] } } };
      const result = AutoFillMapper.mergePayloads(base, overlay);

      expect(result.taxes.tds.nonSalaryEntries).toHaveLength(2);
    });

    it('should handle null base', () => {
      const overlay = { income: { salary: { gross: 100000 } } };
      expect(AutoFillMapper.mergePayloads(null, overlay)).toEqual(overlay);
    });
  });
});

// ── AutoFillService Tests ────────────────────────────────────────────────────

describe('AutoFillService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('autoFill', () => {
    it('should throw FILING_NOT_FOUND for missing filing', async () => {
      ITRFiling.findByPk.mockResolvedValue(null);

      await expect(AutoFillService.autoFill('bad-id', 'user-1'))
        .rejects.toMatchObject({ code: 'FILING_NOT_FOUND' });
    });

    it('should throw FORBIDDEN when user does not own filing', async () => {
      ITRFiling.findByPk.mockResolvedValue({ ...MOCK_FILING, createdBy: 'other-user', userId: 'other-user' });

      await expect(AutoFillService.autoFill('filing-1', 'user-1'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('should throw PAN_NOT_VERIFIED when PAN is missing', async () => {
      ITRFiling.findByPk.mockResolvedValue({ ...MOCK_FILING, taxpayerPan: null });

      await expect(AutoFillService.autoFill('filing-1', 'user-1'))
        .rejects.toMatchObject({ code: 'PAN_NOT_VERIFIED' });
    });

    it('should throw ITR_SESSION_EXPIRED when no SurePass session', async () => {
      ITRFiling.findByPk.mockResolvedValue(MOCK_FILING);
      surePassClient.getSession.mockReturnValue(null);

      await expect(AutoFillService.autoFill('filing-1', 'user-1'))
        .rejects.toMatchObject({ code: 'ITR_SESSION_EXPIRED' });
    });

    it('should throw SUREPASS_SERVICE_UNAVAILABLE when both fetches fail', async () => {
      ITRFiling.findByPk.mockResolvedValue(MOCK_FILING);
      surePassClient.getSession.mockReturnValue(MOCK_SESSION);
      surePassClient.fetch26AS.mockRejectedValue(new Error('26AS down'));
      surePassClient.fetchAIS.mockRejectedValue(new Error('AIS down'));

      await expect(AutoFillService.autoFill('filing-1', 'user-1'))
        .rejects.toMatchObject({ code: 'SUREPASS_SERVICE_UNAVAILABLE' });
    });

    it('should return mapped payload and summary on success', async () => {
      ITRFiling.findByPk.mockResolvedValue(MOCK_FILING);
      surePassClient.getSession.mockReturnValue(MOCK_SESSION);
      surePassClient.fetch26AS.mockResolvedValue(MOCK_RAW_26AS);
      surePassClient.fetchAIS.mockResolvedValue(MOCK_RAW_AIS);

      const result = await AutoFillService.autoFill('filing-1', 'user-1');

      expect(result).toHaveProperty('mappedPayload');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('summary');
      expect(result.summary.sources).toContain('26AS');
      expect(result.summary.sources).toContain('AIS');
      expect(result.summary.fieldsPopulated).toBeGreaterThan(0);
      expect(result.summary.totalTDS).toBeGreaterThan(0);
    });

    it('should succeed with only 26AS when AIS fails', async () => {
      ITRFiling.findByPk.mockResolvedValue(MOCK_FILING);
      surePassClient.getSession.mockReturnValue(MOCK_SESSION);
      surePassClient.fetch26AS.mockResolvedValue(MOCK_RAW_26AS);
      surePassClient.fetchAIS.mockRejectedValue(new Error('AIS down'));

      const result = await AutoFillService.autoFill('filing-1', 'user-1');

      expect(result.summary.sources).toContain('26AS');
      expect(result.summary.sources).not.toContain('AIS');
    });

    it('should detect conflicts with existing payload data', async () => {
      const filingWithData = {
        ...MOCK_FILING,
        jsonPayload: {
          income: {
            otherSources: { dividendIncome: 10000 }, // differs from AIS 25000
          },
        },
      };
      ITRFiling.findByPk.mockResolvedValue(filingWithData);
      surePassClient.getSession.mockReturnValue(MOCK_SESSION);
      surePassClient.fetch26AS.mockResolvedValue(MOCK_RAW_26AS);
      surePassClient.fetchAIS.mockResolvedValue(MOCK_RAW_AIS);

      const result = await AutoFillService.autoFill('filing-1', 'user-1');

      expect(result.conflicts.length).toBeGreaterThan(0);
      const divConflict = result.conflicts.find(c => c.field.includes('dividendIncome'));
      expect(divConflict).toBeDefined();
      expect(divConflict.existingValue).toBe(10000);
      expect(divConflict.newValue).toBe(25000);
    });
  });
});
