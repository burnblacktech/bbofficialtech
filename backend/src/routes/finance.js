/**
 * finance.js
 * Finance routes — Income, Expense, Investment CRUD + summaries,
 * Financial Readiness Score, Dashboard Summary, Tax Tips.
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Op, fn, col, literal } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const {
  IncomeEntry,
  ExpenseEntry,
  InvestmentEntry,
  User,
  ITRFiling,
  AuditEvent,
  VaultDocument,
  UserProfile,
} = require('../models');
const {
  EXPENSE_TO_DEDUCTION,
  INVESTMENT_TO_DEDUCTION,
  DEDUCTION_LIMITS,
} = require('../constants/deductionMappings');
const { READINESS_WEIGHTS } = require('../constants/readinessWeights');

// ── Shared helpers ──────────────────────────────────────

const FY_REGEX = /^\d{4}-\d{2}$/;

const fyQuerySchema = Joi.object({
  fy: Joi.string().pattern(FY_REGEX).required(),
});

/**
 * Validate request body with a Joi schema.
 * Throws AppError(400) on failure.
 */
function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new AppError(
      error.details.map((d) => d.message).join('; '),
      400,
      'VALIDATION_ERROR',
    );
  }
  return value;
}


// =====================================================
// INCOME ENDPOINTS
// =====================================================

const incomeCreateSchema = Joi.object({
  sourceType: Joi.string()
    .valid('salary', 'freelance', 'rental', 'interest', 'dividend', 'capital_gain', 'other')
    .required(),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  dateReceived: Joi.date().iso().required(),
  description: Joi.string().max(500).allow('', null).optional(),
  financialYear: Joi.string().pattern(FY_REGEX).required(),
});

const incomeUpdateSchema = Joi.object({
  sourceType: Joi.string()
    .valid('salary', 'freelance', 'rental', 'interest', 'dividend', 'capital_gain', 'other')
    .optional(),
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  dateReceived: Joi.date().iso().optional(),
  description: Joi.string().max(500).allow('', null).optional(),
}).min(1);

// GET /income?fy=2024-25
router.get('/income', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const entries = await IncomeEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      order: [['date_received', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

// GET /income/summary?fy=2024-25
router.get('/income/summary', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const entries = await IncomeEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      attributes: [
        'sourceType',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['sourceType'],
      raw: true,
    });

    const totalIncome = entries.reduce((sum, e) => sum + parseFloat(e.total || 0), 0);

    res.json({
      success: true,
      data: {
        totalIncome,
        bySourceType: entries.map((e) => ({
          sourceType: e.sourceType,
          total: parseFloat(e.total),
          count: parseInt(e.count, 10),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /income
router.post('/income', authenticateToken, async (req, res, next) => {
  try {
    const data = validate(incomeCreateSchema, req.body);
    const entry = await IncomeEntry.create({
      ...data,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// PUT /income/:id
router.put('/income/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await IncomeEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Income entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot edit an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    const data = validate(incomeUpdateSchema, req.body);
    await entry.update(data);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// DELETE /income/:id
router.delete('/income/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await IncomeEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Income entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot delete an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    await entry.destroy();
    res.json({ success: true, message: 'Income entry deleted' });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// EXPENSE ENDPOINTS
// =====================================================

const expenseCreateSchema = Joi.object({
  category: Joi.string()
    .valid('rent', 'medical', 'donations', 'education_loan', 'insurance', 'other')
    .required(),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  datePaid: Joi.date().iso().required(),
  description: Joi.string().max(500).allow('', null).optional(),
  financialYear: Joi.string().pattern(FY_REGEX).required(),
});

const expenseUpdateSchema = Joi.object({
  category: Joi.string()
    .valid('rent', 'medical', 'donations', 'education_loan', 'insurance', 'other')
    .optional(),
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  datePaid: Joi.date().iso().optional(),
  description: Joi.string().max(500).allow('', null).optional(),
}).min(1);

// GET /expenses?fy=2024-25
router.get('/expenses', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const entries = await ExpenseEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      order: [['date_paid', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

// GET /expenses/summary?fy=2024-25
router.get('/expenses/summary', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const entries = await ExpenseEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['category'],
      raw: true,
    });

    const totalExpenses = entries.reduce((sum, e) => sum + parseFloat(e.total || 0), 0);

    res.json({
      success: true,
      data: {
        totalExpenses,
        byCategory: entries.map((e) => {
          const deductionSection = EXPENSE_TO_DEDUCTION[e.category] || null;
          return {
            category: e.category,
            total: parseFloat(e.total),
            count: parseInt(e.count, 10),
            deductionSection,
            limit: deductionSection ? DEDUCTION_LIMITS[deductionSection] : null,
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /expenses
router.post('/expenses', authenticateToken, async (req, res, next) => {
  try {
    const data = validate(expenseCreateSchema, req.body);
    const deductionSection = EXPENSE_TO_DEDUCTION[data.category] || null;
    const entry = await ExpenseEntry.create({
      ...data,
      deductionSection,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// PUT /expenses/:id
router.put('/expenses/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await ExpenseEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Expense entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot edit an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    const data = validate(expenseUpdateSchema, req.body);
    // Re-map deduction section if category changed
    if (data.category) {
      data.deductionSection = EXPENSE_TO_DEDUCTION[data.category] || null;
    }
    await entry.update(data);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// DELETE /expenses/:id
router.delete('/expenses/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await ExpenseEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Expense entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot delete an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    await entry.destroy();
    res.json({ success: true, message: 'Expense entry deleted' });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// INVESTMENT ENDPOINTS
// =====================================================

const investmentCreateSchema = Joi.object({
  investmentType: Joi.string()
    .valid('ppf', 'elss', 'nps', 'lic', 'sukanya', 'tax_fd', 'ulip', 'other_80c', '80ccd_1b_nps')
    .required(),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  dateOfInvestment: Joi.date().iso().required(),
  referenceNumber: Joi.string().max(100).allow('', null).optional(),
  financialYear: Joi.string().pattern(FY_REGEX).required(),
});

const investmentUpdateSchema = Joi.object({
  investmentType: Joi.string()
    .valid('ppf', 'elss', 'nps', 'lic', 'sukanya', 'tax_fd', 'ulip', 'other_80c', '80ccd_1b_nps')
    .optional(),
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Amount must be a positive number',
  }),
  dateOfInvestment: Joi.date().iso().optional(),
  referenceNumber: Joi.string().max(100).allow('', null).optional(),
}).min(1);

// GET /investments?fy=2024-25
router.get('/investments', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const entries = await InvestmentEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      order: [['deduction_section', 'ASC'], ['date_of_investment', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    // Group by deduction section
    const grouped = {};
    for (const entry of entries) {
      const section = entry.deductionSection;
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(entry);
    }

    res.json({ success: true, data: { entries, grouped } });
  } catch (error) {
    next(error);
  }
});

// GET /investments/summary?fy=2024-25
router.get('/investments/summary', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const entries = await InvestmentEntry.findAll({
      where: { userId: req.user.userId, financialYear: fy },
      attributes: [
        'deductionSection',
        [fn('SUM', col('amount')), 'totalInvested'],
        [fn('COUNT', col('id')), 'entries'],
      ],
      group: ['deductionSection'],
      raw: true,
    });

    // Assumed 30% tax rate for tax saved estimate
    const TAX_RATE = 0.3;

    const sections = entries.map((e) => {
      const totalInvested = parseFloat(e.totalInvested || 0);
      const limit = DEDUCTION_LIMITS[e.deductionSection] || null;
      const remaining = limit !== null ? Math.max(0, limit - totalInvested) : null;
      const isLimitReached = limit !== null && totalInvested >= limit;
      const deductible = limit !== null ? Math.min(totalInvested, limit) : totalInvested;
      const taxSaved = Math.round(deductible * TAX_RATE);

      return {
        section: e.deductionSection,
        totalInvested,
        limit,
        remaining,
        isLimitReached,
        entries: parseInt(e.entries, 10),
        taxSaved,
      };
    });

    const totalTaxSaved = sections.reduce((sum, s) => sum + s.taxSaved, 0);

    res.json({ success: true, data: { sections, totalTaxSaved } });
  } catch (error) {
    next(error);
  }
});

// POST /investments
router.post('/investments', authenticateToken, async (req, res, next) => {
  try {
    const data = validate(investmentCreateSchema, req.body);
    const deductionSection = INVESTMENT_TO_DEDUCTION[data.investmentType];
    if (!deductionSection) {
      throw new AppError('Unknown investment type', 400, 'VALIDATION_ERROR');
    }
    const entry = await InvestmentEntry.create({
      ...data,
      deductionSection,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// PUT /investments/:id
router.put('/investments/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await InvestmentEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Investment entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot edit an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    const data = validate(investmentUpdateSchema, req.body);
    // Re-map deduction section if investmentType changed
    if (data.investmentType) {
      data.deductionSection = INVESTMENT_TO_DEDUCTION[data.investmentType];
      if (!data.deductionSection) {
        throw new AppError('Unknown investment type', 400, 'VALIDATION_ERROR');
      }
    }
    await entry.update(data);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// DELETE /investments/:id
router.delete('/investments/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await InvestmentEntry.findOne({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!entry) throw new AppError('Investment entry not found', 404, 'NOT_FOUND');
    if (entry.usedInFilingId) {
      throw new AppError('Cannot delete an entry used in a submitted filing', 403, 'ENTRY_LOCKED');
    }
    await entry.destroy();
    res.json({ success: true, message: 'Investment entry deleted' });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// FINANCIAL READINESS SCORE
// =====================================================

const READINESS_LABELS = {
  pan_verified: 'PAN Verified',
  income_logged: 'Income Logged',
  form16_present: 'Form 16 Uploaded',
  investments_logged: 'Investments Logged',
  expenses_logged: 'Expenses Logged',
  documents_uploaded: 'Documents Uploaded',
  profile_complete: 'Profile Complete',
};

const READINESS_ACTIONS = {
  pan_verified: { label: 'Verify PAN', actionPath: '/itr/pan-verification' },
  income_logged: { label: 'Log income', actionPath: '/finance/income' },
  form16_present: { label: 'Upload Form 16', actionPath: '/vault' },
  investments_logged: { label: 'Log investments', actionPath: '/finance/investments' },
  expenses_logged: { label: 'Log expenses', actionPath: '/finance/expenses' },
  documents_uploaded: { label: 'Upload documents', actionPath: '/vault' },
  profile_complete: { label: 'Complete profile', actionPath: '/settings#profile' },
};

// GET /readiness?fy=2024-25
router.get('/readiness', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const userId = req.user.userId;

    // Gather data in parallel
    const [user, profile, incomeCount, investmentCount, expenseCount, docCount, form16Count] =
      await Promise.all([
        User.findByPk(userId),
        UserProfile.findOne({ where: { userId } }),
        IncomeEntry.count({ where: { userId, financialYear: fy } }),
        InvestmentEntry.count({ where: { userId, financialYear: fy } }),
        ExpenseEntry.count({ where: { userId, financialYear: fy } }),
        VaultDocument.count({ where: { userId, financialYear: fy } }),
        VaultDocument.count({ where: { userId, financialYear: fy, category: 'salary' } }),
      ]);

    // Determine component statuses
    const profileFields = ['fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'panNumber'];
    const filledProfileFields = profileFields.filter((f) => {
      if (f === 'fullName' || f === 'email') return user && user[f];
      if (f === 'panNumber') return user && user.panNumber;
      if (f === 'dateOfBirth') return (user && user.dateOfBirth) || (profile && profile.dateOfBirth);
      return user && user[f];
    });
    const profileRatio = filledProfileFields.length / profileFields.length;

    const componentStatus = {
      pan_verified: user && user.panVerified ? 'complete' : 'missing',
      income_logged: incomeCount > 0 ? 'complete' : 'missing',
      form16_present: form16Count > 0 ? 'complete' : 'missing',
      investments_logged: investmentCount > 0 ? 'complete' : 'missing',
      expenses_logged: expenseCount > 0 ? 'complete' : 'missing',
      documents_uploaded: docCount > 0 ? (docCount >= 3 ? 'complete' : 'partial') : 'missing',
      profile_complete: profileRatio >= 1 ? 'complete' : profileRatio > 0 ? 'partial' : 'missing',
    };

    const STATUS_MULTIPLIER = { complete: 1.0, partial: 0.5, missing: 0.0 };

    const components = Object.entries(READINESS_WEIGHTS).map(([key, weight]) => ({
      key,
      label: READINESS_LABELS[key],
      weight: Math.round(weight * 100),
      status: componentStatus[key],
    }));

    const percentage = Math.round(
      Object.entries(READINESS_WEIGHTS).reduce(
        (sum, [key, weight]) => sum + weight * STATUS_MULTIPLIER[componentStatus[key]],
        0,
      ) * 100,
    );

    // Top missing: highest-weight non-complete components
    const topMissing = components
      .filter((c) => c.status !== 'complete')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((c) => ({
        key: c.key,
        label: READINESS_ACTIONS[c.key].label,
        actionPath: READINESS_ACTIONS[c.key].actionPath,
      }));

    res.json({ success: true, data: { percentage, components, topMissing } });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

/**
 * Parse FY string "2024-25" into start/end dates for monthly breakdown.
 */
function fyToDateRange(fy) {
  const [startYear] = fy.split('-').map(Number);
  return {
    start: new Date(startYear, 3, 1),   // April 1
    end: new Date(startYear + 1, 2, 31), // March 31
  };
}

// GET /dashboard-summary?fy=2024-25
router.get('/dashboard-summary', authenticateToken, async (req, res, next) => {
  try {
    const { fy } = validate(fyQuerySchema, req.query);
    const userId = req.user.userId;

    // Parallel data fetch
    const [
      incomeEntries,
      expenseEntries,
      investmentEntries,
      filings,
      recentActivity,
      user,
    ] = await Promise.all([
      IncomeEntry.findAll({ where: { userId, financialYear: fy }, raw: true }),
      ExpenseEntry.findAll({ where: { userId, financialYear: fy }, raw: true }),
      InvestmentEntry.findAll({ where: { userId, financialYear: fy }, raw: true }),
      ITRFiling.findAll({
        where: { createdBy: userId },
        attributes: ['id', 'assessmentYear', 'itrType', 'lifecycleState', 'progress', 'taxLiability', 'refundAmount', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      AuditEvent.findAll({
        where: { actorId: userId },
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
      User.findByPk(userId),
    ]);

    // Financial summary
    const totalIncome = incomeEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const totalExpenses = expenseEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    // Deductions from expenses + investments
    const expenseDeductions = expenseEntries.reduce((s, e) => {
      if (!e.deductionSection) return s;
      return s + parseFloat(e.amount || 0);
    }, 0);
    const investmentDeductions = investmentEntries.reduce((s, e) => {
      const limit = DEDUCTION_LIMITS[e.deductionSection] || Infinity;
      return s + Math.min(parseFloat(e.amount || 0), limit);
    }, 0);
    const totalDeductions = expenseDeductions + investmentDeductions;

    // Simple estimated tax (30% of taxable income, floored at 0)
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const estimatedTax = Math.round(taxableIncome * 0.3);
    const tdsPaid = 0; // TDS data comes from 26AS/AIS — placeholder

    // Monthly overview (Apr-Mar, 12 months)
    const { start } = fyToDateRange(fy);
    const monthlyOverview = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const monthNum = monthDate.getMonth(); // 0-indexed
      const year = monthDate.getFullYear();
      const monthLabel = monthDate.toLocaleString('en-IN', { month: 'short' });

      const monthIncome = incomeEntries
        .filter((e) => {
          const d = new Date(e.dateReceived || e.date_received);
          return d.getMonth() === monthNum && d.getFullYear() === year;
        })
        .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

      const monthExpense = expenseEntries
        .filter((e) => {
          const d = new Date(e.datePaid || e.date_paid);
          return d.getMonth() === monthNum && d.getFullYear() === year;
        })
        .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

      return { month: monthLabel, year, income: monthIncome, expense: monthExpense };
    });

    // Investment progress by section
    const investmentBySection = {};
    for (const e of investmentEntries) {
      const sec = e.deductionSection || e.deduction_section;
      if (!investmentBySection[sec]) investmentBySection[sec] = 0;
      investmentBySection[sec] += parseFloat(e.amount || 0);
    }
    const investmentProgress = Object.entries(investmentBySection).map(([section, total]) => ({
      section,
      totalInvested: total,
      limit: DEDUCTION_LIMITS[section] || null,
      progress: DEDUCTION_LIMITS[section] ? Math.min(1, total / DEDUCTION_LIMITS[section]) : 1,
    }));

    // User profile type based on income distribution
    const salaryIncome = incomeEntries
      .filter((e) => (e.sourceType || e.source_type) === 'salary')
      .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const freelanceIncome = incomeEntries
      .filter((e) => (e.sourceType || e.source_type) === 'freelance')
      .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    let userProfile = 'default';
    if (totalIncome > 0) {
      if (salaryIncome / totalIncome > 0.5) userProfile = 'salaried';
      else if (freelanceIncome / totalIncome > 0.5) userProfile = 'freelancer';
    }

    // Deadline info (July 31 of FY end year for non-audit cases)
    const [startYear] = fy.split('-').map(Number);
    const deadlineDate = new Date(startYear + 1, 6, 31); // July 31
    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    const deadlineInfo =
      daysRemaining > 0 && daysRemaining <= 120
        ? { date: deadlineDate.toISOString().split('T')[0], daysRemaining }
        : daysRemaining <= 0
          ? { date: deadlineDate.toISOString().split('T')[0], daysRemaining, isPast: true }
          : null;

    res.json({
      success: true,
      data: {
        financialSummary: { totalIncome, totalDeductions, estimatedTax, tdsPaid },
        monthlyOverview,
        investmentProgress,
        filings,
        recentActivity,
        userProfile,
        deadlineInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// TAX TIPS
// =====================================================

const TAX_TIPS = [
  {
    id: 'tip_80c',
    context: ['income', 'investments'],
    targetSection: '80C',
    title: 'Maximize Section 80C',
    message: 'Investments in PPF, ELSS, LIC can save up to ₹46,800 in taxes.',
    learnMore: {
      title: 'Section 80C Deductions',
      body: 'Section 80C allows deductions up to ₹1,50,000 per financial year for investments in PPF, ELSS mutual funds, LIC premiums, Sukanya Samriddhi, tax-saving FDs, and ULIP. This is the most commonly used deduction section.',
      section: 'Section 80C',
    },
  },
  {
    id: 'tip_80ccd',
    context: ['investments'],
    targetSection: '80CCD(1B)',
    title: 'NPS Extra Benefit',
    message: 'NPS contributions up to ₹50,000 get additional deduction under 80CCD(1B).',
    learnMore: {
      title: 'Section 80CCD(1B) — NPS',
      body: 'Over and above the ₹1,50,000 limit of Section 80C, you can claim an additional ₹50,000 deduction for contributions to the National Pension System under Section 80CCD(1B). This is available only under the old tax regime.',
      section: 'Section 80CCD(1B)',
    },
  },
  {
    id: 'tip_80d',
    context: ['expenses'],
    targetSection: '80D',
    title: 'Health Insurance Deduction',
    message: 'Medical insurance premiums qualify for deduction under Section 80D.',
    learnMore: {
      title: 'Section 80D — Medical Insurance',
      body: 'Premiums paid for health insurance for self, spouse, children, and parents qualify for deduction. Up to ₹25,000 for self/family and an additional ₹25,000 (₹50,000 for senior citizen parents) for parents.',
      section: 'Section 80D',
    },
  },
  {
    id: 'tip_hra',
    context: ['expenses', 'income'],
    targetSection: 'HRA',
    title: 'Claim HRA Exemption',
    message: 'Paying rent? Log it to claim HRA exemption and reduce taxable salary.',
    learnMore: {
      title: 'HRA Exemption',
      body: 'If you receive House Rent Allowance as part of your salary and pay rent, you can claim HRA exemption. The exempt amount is the minimum of: actual HRA received, rent paid minus 10% of basic salary, or 50%/40% of basic salary (metro/non-metro).',
      section: 'HRA (Section 10(13A))',
    },
  },
  {
    id: 'tip_80g',
    context: ['expenses'],
    targetSection: '80G',
    title: 'Donations Save Tax',
    message: 'Donations to approved charities qualify for 50% or 100% deduction.',
    learnMore: {
      title: 'Section 80G — Donations',
      body: 'Donations to certain funds and charitable institutions qualify for deduction under Section 80G. Some donations qualify for 100% deduction (PM Relief Fund, etc.) while others qualify for 50%. Keep donation receipts with the institution\'s PAN and 80G registration number.',
      section: 'Section 80G',
    },
  },
  {
    id: 'tip_80e',
    context: ['expenses'],
    targetSection: '80E',
    title: 'Education Loan Interest',
    message: 'Interest on education loans is fully deductible with no upper limit.',
    learnMore: {
      title: 'Section 80E — Education Loan',
      body: 'Interest paid on loans taken for higher education (for self, spouse, or children) is fully deductible under Section 80E. There is no upper limit on the deduction amount, and it is available for 8 years from the year you start repaying.',
      section: 'Section 80E',
    },
  },
];

const tipContextSchema = Joi.object({
  context: Joi.string().valid('income', 'expenses', 'investments').optional(),
  fy: Joi.string().pattern(FY_REGEX).optional(),
});

// GET /tax-tips?context=income&fy=2024-25
router.get('/tax-tips', authenticateToken, async (req, res, next) => {
  try {
    const { context, fy } = validate(tipContextSchema, req.query);
    const userId = req.user.userId;

    // Get user's dismissed tips
    const user = await User.findByPk(userId);
    const dismissedTips = (user && user.metadata && user.metadata.dismissedTips) || {};
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Filter tips by context and dismissal state
    let tips = TAX_TIPS;
    if (context) {
      tips = tips.filter((t) => t.context.includes(context));
    }
    tips = tips.filter((t) => {
      const dismissedAt = dismissedTips[t.id];
      if (!dismissedAt) return true;
      return now - new Date(dismissedAt).getTime() > THIRTY_DAYS;
    });

    // If FY provided, prioritize tips for sections with zero entries
    if (fy) {
      const [investmentSections, expenseCategories] = await Promise.all([
        InvestmentEntry.findAll({
          where: { userId, financialYear: fy },
          attributes: ['deductionSection'],
          group: ['deductionSection'],
          raw: true,
        }),
        ExpenseEntry.findAll({
          where: { userId, financialYear: fy },
          attributes: ['category'],
          group: ['category'],
          raw: true,
        }),
      ]);

      const filledSections = new Set([
        ...investmentSections.map((e) => e.deductionSection),
        ...expenseCategories.map((e) => EXPENSE_TO_DEDUCTION[e.category]).filter(Boolean),
      ]);

      // Sort: tips for empty sections first
      tips.sort((a, b) => {
        const aFilled = filledSections.has(a.targetSection) ? 1 : 0;
        const bFilled = filledSections.has(b.targetSection) ? 1 : 0;
        return aFilled - bFilled;
      });
    }

    res.json({ success: true, data: tips });
  } catch (error) {
    next(error);
  }
});

// POST /tax-tips/:tipId/dismiss
router.post('/tax-tips/:tipId/dismiss', authenticateToken, async (req, res, next) => {
  try {
    const { tipId } = req.params;
    const userId = req.user.userId;

    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const metadata = { ...(user.metadata || {}) };
    if (!metadata.dismissedTips) metadata.dismissedTips = {};
    metadata.dismissedTips[tipId] = new Date().toISOString();

    await user.update({ metadata });
    res.json({ success: true, message: 'Tip dismissed' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
