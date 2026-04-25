const ITR1ComputationService = require('../ITR1ComputationService');

describe('ITR1ComputationService', () => {
  // ── computeTDS ──

  describe('computeTDS', () => {
    it('should sum nonSalaryEntries when present', () => {
      const payload = {
        income: { salary: { employers: [{ tdsDeducted: 50000 }] } },
        taxes: {
          tds: {
            nonSalaryEntries: [
              { deductorTan: 'ABCD12345E', tdsClaimed: 3000 },
              { deductorTan: 'XYZW98765A', tdsClaimed: 7000 },
            ],
          },
          advanceTax: 1000,
          selfAssessmentTax: 500,
        },
      };
      const result = ITR1ComputationService.computeTDS(payload);
      expect(result.fromSalary).toBe(50000);
      expect(result.fromNonSalary).toBe(10000);
      expect(result.fromFD).toBe(0);
      expect(result.fromOther).toBe(0);
      expect(result.total).toBe(50000 + 10000 + 1000 + 500);
    });

    it('should fall back to fromFD + fromOther when no nonSalaryEntries', () => {
      const payload = {
        income: { salary: { employers: [{ tdsDeducted: 20000 }] } },
        taxes: {
          tds: { fromFD: 4000, fromOther: 2000 },
          advanceTax: 0,
          selfAssessmentTax: 0,
        },
      };
      const result = ITR1ComputationService.computeTDS(payload);
      expect(result.fromSalary).toBe(20000);
      expect(result.fromFD).toBe(4000);
      expect(result.fromOther).toBe(2000);
      expect(result.fromNonSalary).toBe(6000);
      expect(result.total).toBe(26000);
    });

    it('should fall back when nonSalaryEntries is empty array', () => {
      const payload = {
        income: { salary: { employers: [] } },
        taxes: {
          tds: { nonSalaryEntries: [], fromFD: 1000, fromOther: 500 },
        },
      };
      const result = ITR1ComputationService.computeTDS(payload);
      expect(result.fromNonSalary).toBe(1500);
      expect(result.fromFD).toBe(1000);
      expect(result.fromOther).toBe(500);
    });
  });

  // ── computeSalaryExemptions ──

  describe('computeSalaryExemptions', () => {
    it('should fully exempt all amounts for GOV', () => {
      const salaryData = {
        employers: [{
          gratuityReceived: 3000000,
          leaveEncashmentReceived: 5000000,
          commutedPensionReceived: 2000000,
        }],
      };
      const result = ITR1ComputationService.computeSalaryExemptions(salaryData, 'GOV');
      expect(result).toBe(3000000 + 5000000 + 2000000);
    });

    it('should cap gratuity at 20L for OTH', () => {
      const salaryData = {
        employers: [{
          gratuityReceived: 3000000,
          leaveEncashmentReceived: 0,
          commutedPensionReceived: 0,
        }],
      };
      const result = ITR1ComputationService.computeSalaryExemptions(salaryData, 'OTH');
      expect(result).toBe(2000000);
    });

    it('should cap leave encashment at 25L for PSU', () => {
      const salaryData = {
        employers: [{
          gratuityReceived: 0,
          leaveEncashmentReceived: 3000000,
          commutedPensionReceived: 0,
        }],
      };
      const result = ITR1ComputationService.computeSalaryExemptions(salaryData, 'PSU');
      expect(result).toBe(2500000);
    });

    it('should exempt 1/3 commuted pension when gratuity received (OTH)', () => {
      const salaryData = {
        employers: [{
          gratuityReceived: 100000,
          leaveEncashmentReceived: 0,
          commutedPensionReceived: 900000,
        }],
      };
      const result = ITR1ComputationService.computeSalaryExemptions(salaryData, 'OTH');
      // gratuity: min(100000, 2000000) = 100000
      // commuted pension: round(900000 * 1/3) = 300000
      expect(result).toBe(100000 + 300000);
    });

    it('should exempt 1/2 commuted pension when no gratuity (OTH)', () => {
      const salaryData = {
        employers: [{
          gratuityReceived: 0,
          leaveEncashmentReceived: 0,
          commutedPensionReceived: 900000,
        }],
      };
      const result = ITR1ComputationService.computeSalaryExemptions(salaryData, 'OTH');
      expect(result).toBe(450000);
    });

    it('should return 0 when no employers', () => {
      expect(ITR1ComputationService.computeSalaryExemptions(null, 'GOV')).toBe(0);
      expect(ITR1ComputationService.computeSalaryExemptions({ employers: [] }, 'GOV')).toBe(0);
    });
  });

  // ── computeSalary with entertainment allowance ──

  describe('computeSalary - entertainment allowance', () => {
    it('should compute entertainment allowance deduction for GOV', () => {
      const salaryData = {
        employers: [{
          grossSalary: 800000,
          entertainmentAllowance: 10000,
          basicPlusDA: 500000,
          tdsDeducted: 0,
          allowances: {},
          deductions: { professionalTax: 2500 },
        }],
      };
      const result = ITR1ComputationService.computeSalary(salaryData, 'GOV');
      // min(10000, 5000, 0.20 * 500000=100000) = 5000
      expect(result.entertainmentAllowanceDeduction).toBe(5000);
    });

    it('should not compute entertainment allowance for OTH', () => {
      const salaryData = {
        employers: [{
          grossSalary: 800000,
          entertainmentAllowance: 10000,
          basicPlusDA: 500000,
          tdsDeducted: 0,
          allowances: {},
          deductions: { professionalTax: 2500 },
        }],
      };
      const result = ITR1ComputationService.computeSalary(salaryData, 'OTH');
      expect(result.entertainmentAllowanceDeduction).toBe(0);
    });

    it('should cap entertainment allowance at 20% of basicPlusDA when that is smallest', () => {
      const salaryData = {
        employers: [{
          grossSalary: 300000,
          entertainmentAllowance: 10000,
          basicPlusDA: 10000, // 20% = 2000
          tdsDeducted: 0,
          allowances: {},
          deductions: {},
        }],
      };
      const result = ITR1ComputationService.computeSalary(salaryData, 'GOV');
      // min(10000, 5000, 2000) = 2000
      expect(result.entertainmentAllowanceDeduction).toBe(2000);
    });
  });

  // ── computeDeductions with categorized 80G ──

  describe('computeDeductions - categorized 80G', () => {
    it('should compute categorized 80G donations', () => {
      // Set gross total for ATI computation
      ITR1ComputationService._lastGrossTotal = 1000000;

      const deductionData = {
        donations80G: [
          { doneeName: 'PM Relief', amount: 50000, category: '100_no_limit' },
          { doneeName: 'Local Trust', amount: 200000, category: '100_with_limit' },
          { doneeName: 'NGO A', amount: 30000, category: '50_no_limit' },
          { doneeName: 'NGO B', amount: 300000, category: '50_with_limit' },
        ],
      };
      const result = ITR1ComputationService.computeDeductions(deductionData);
      // 10% of ATI = 100000
      // 100% no limit: 50000
      // 100% with limit: min(200000, 100000) = 100000
      // 50% no limit: round(0.5 * 30000) = 15000
      // 50% with limit: round(0.5 * min(300000, 100000)) = 50000
      expect(result.breakdown.section80G).toBe(50000 + 100000 + 15000 + 50000);
    });

    it('should fall back to flat donations when no donations80G', () => {
      const deductionData = { donations: 25000 };
      const result = ITR1ComputationService.computeDeductions(deductionData);
      expect(result.breakdown.section80G).toBe(25000);
    });
  });

  // ── Backward compatibility: full compute ──

  describe('backward compatibility', () => {
    it('should compute correctly with old-style payload (no new fields)', () => {
      const payload = {
        personalInfo: { pan: 'ABCDE1234F' },
        income: {
          salary: {
            employers: [{ name: 'Acme', grossSalary: 1000000, tdsDeducted: 100000, allowances: {}, deductions: { professionalTax: 2400 } }],
          },
          houseProperty: { type: 'NONE' },
          otherSources: { savingsInterest: 10000 },
        },
        deductions: { ppf: 50000, donations: 5000 },
        taxes: { tds: { fromFD: 1000, fromOther: 500 }, advanceTax: 0, selfAssessmentTax: 0 },
      };
      const result = ITR1ComputationService.compute(payload);
      expect(result.income.salary.grossSalary).toBe(1000000);
      expect(result.tds.fromNonSalary).toBe(1500);
      expect(result.tds.total).toBe(100000 + 1500);
      expect(result.income.salary.salaryExemptions).toBe(0);
      expect(result.income.salary.entertainmentAllowanceDeduction).toBe(0);
    });
  });
});
