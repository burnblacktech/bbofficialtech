/**
 * ITR Validation Rules
 * Government-compliant validation rules for Indian Income Tax Returns
 * Based on Income Tax Act, 1961 and latest amendments
 */

export const ITR_VALIDATION_RULES = {
    // Income Limits
    ITR1_MAX_INCOME: 5000000, // ₹50 lakhs

    // Deduction Limits
    SECTION_80C_LIMIT: 150000,
    SECTION_80CCD_1B_LIMIT: 50000, // NPS additional
    SECTION_80D_SELF_LIMIT: 25000,
    SECTION_80D_SELF_SENIOR: 50000,
    SECTION_80D_PARENTS_LIMIT: 25000,
    SECTION_80D_PARENTS_SENIOR: 50000,
    SECTION_80D_PREVENTIVE_LIMIT: 5000,
    SECTION_80G_CASH_LIMIT: 2000,
    SECTION_80E_NO_LIMIT: true,
    SECTION_80EE_LIMIT: 50000,
    SECTION_80EEA_LIMIT: 150000,
    SECTION_80EEB_LIMIT: 150000,
    SECTION_80TTA_LIMIT: 10000,
    SECTION_80TTB_LIMIT: 50000, // Senior citizens
    SECTION_80U_NORMAL: 75000,
    SECTION_80U_SEVERE: 125000,
    SECTION_80DD_NORMAL: 75000,
    SECTION_80DD_SEVERE: 125000,
    SECTION_80DDB_NORMAL: 40000,
    SECTION_80DDB_SENIOR: 100000,

    // Interest Exemptions
    SAVINGS_INTEREST_EXEMPT: 10000,
    SAVINGS_INTEREST_EXEMPT_SENIOR: 50000,

    // TDS Thresholds
    INTEREST_TDS_THRESHOLD: 40000,
    INTEREST_TDS_THRESHOLD_SENIOR: 50000,
    DIVIDEND_TDS_THRESHOLD: 5000,
    RENT_TDS_THRESHOLD: 240000, // Monthly ₹50,000

    // Capital Gains
    LTCG_EQUITY_EXEMPTION: 100000,
    LTCG_EQUITY_TAX_RATE: 0.10,
    STCG_EQUITY_TAX_RATE: 0.15,
    LTCG_PROPERTY_TAX_RATE: 0.20,
    EQUITY_HOLDING_PERIOD: 12, // months
    PROPERTY_HOLDING_PERIOD: 24, // months
    DEBT_MF_HOLDING_PERIOD: 36, // months

    // House Property
    HOUSE_PROPERTY_LOSS_LIMIT: 200000,
    SELF_OCCUPIED_INTEREST_LIMIT: 200000,
    STANDARD_DEDUCTION_RATE: 0.30,
    MAX_SELF_OCCUPIED_PROPERTIES: 2,

    // Agricultural Income
    AGRICULTURAL_INCOME_THRESHOLD: 5000,

    // Presumptive Taxation
    PRESUMPTIVE_BUSINESS_TURNOVER_LIMIT: 2000000, // ₹2 crores
    PRESUMPTIVE_BUSINESS_RATE: 0.08,
    PRESUMPTIVE_BUSINESS_DIGITAL_RATE: 0.06,
    PRESUMPTIVE_PROFESSIONAL_RECEIPTS_LIMIT: 5000000, // ₹50 lakhs
    PRESUMPTIVE_PROFESSIONAL_RATE: 0.50,
    GOODS_CARRIAGE_PER_VEHICLE_PER_MONTH: 7500,
    GOODS_CARRIAGE_MAX_VEHICLES: 10,

    // Audit Thresholds
    AUDIT_THRESHOLD_BUSINESS: 10000000, // ₹1 crore (₹10 crore for 44AB)
    AUDIT_THRESHOLD_PROFESSIONAL: 5000000, // ₹50 lakhs
    BOOKS_THRESHOLD: 2500000, // ₹25 lakhs

    // Gift Exemption
    GIFT_EXEMPTION_LIMIT: 50000,
};

/**
 * Validate numeric field against min/max limits
 */
export const validateAmount = (value, min = 0, max = Infinity, fieldName = 'Amount') => {
    const numValue = parseFloat(value) || 0;

    if (numValue < min) {
        return { valid: false, error: `${fieldName} cannot be less than ₹${min.toLocaleString('en-IN')}` };
    }

    if (numValue > max) {
        return { valid: false, error: `${fieldName} cannot exceed ₹${max.toLocaleString('en-IN')}` };
    }

    return { valid: true, error: null };
};

/**
 * Validate PAN format
 */
export const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!pan) {
        return { valid: false, error: 'PAN is required' };
    }

    if (!panRegex.test(pan.toUpperCase())) {
        return { valid: false, error: 'Invalid PAN format (e.g., ABCDE1234F)' };
    }

    return { valid: true, error: null };
};

/**
 * Validate date format and range
 */
export const validateDate = (date, minDate = null, maxDate = null, fieldName = 'Date') => {
    if (!date) {
        return { valid: false, error: `${fieldName} is required` };
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
        return { valid: false, error: `Invalid ${fieldName}` };
    }

    if (minDate && dateObj < new Date(minDate)) {
        return { valid: false, error: `${fieldName} cannot be before ${new Date(minDate).toLocaleDateString()}` };
    }

    if (maxDate && dateObj > new Date(maxDate)) {
        return { valid: false, error: `${fieldName} cannot be after ${new Date(maxDate).toLocaleDateString()}` };
    }

    return { valid: true, error: null };
};

/**
 * Calculate holding period in months
 */
export const calculateHoldingPeriod = (purchaseDate, saleDate) => {
    const purchase = new Date(purchaseDate);
    const sale = new Date(saleDate);

    const months = (sale.getFullYear() - purchase.getFullYear()) * 12 +
        (sale.getMonth() - purchase.getMonth());

    return months;
};

/**
 * Determine if capital gain is short-term or long-term
 */
export const determineCapitalGainType = (assetType, holdingPeriod) => {
    const thresholds = {
        equity: ITR_VALIDATION_RULES.EQUITY_HOLDING_PERIOD,
        mutualFundEquity: ITR_VALIDATION_RULES.EQUITY_HOLDING_PERIOD,
        mutualFundDebt: ITR_VALIDATION_RULES.DEBT_MF_HOLDING_PERIOD,
        property: ITR_VALIDATION_RULES.PROPERTY_HOLDING_PERIOD,
        other: ITR_VALIDATION_RULES.PROPERTY_HOLDING_PERIOD, // Default to 24 months
    };

    const threshold = thresholds[assetType] || thresholds.other;

    return holdingPeriod >= threshold ? 'LTCG' : 'STCG';
};

/**
 * Calculate indexed cost of acquisition
 * CII (Cost Inflation Index) values for recent years
 */
const CII_VALUES = {
    '2001-02': 100,
    '2023-24': 348,
    '2024-25': 363, // Assumed, update with actual
};

export const calculateIndexedCost = (purchaseYear, purchaseAmount, saleYear) => {
    const purchaseCII = CII_VALUES[purchaseYear] || 100;
    const saleCII = CII_VALUES[saleYear] || 363;

    return (purchaseAmount * saleCII) / purchaseCII;
};

/**
 * Validate Section 80C investments
 */
export const validateSection80C = (investments) => {
    const total = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    if (total > ITR_VALIDATION_RULES.SECTION_80C_LIMIT) {
        return {
            valid: false,
            error: `Total Section 80C investments cannot exceed ₹${ITR_VALIDATION_RULES.SECTION_80C_LIMIT.toLocaleString('en-IN')}`,
            total,
        };
    }

    return { valid: true, error: null, total };
};

/**
 * Validate Section 80D health insurance
 */
export const validateSection80D = (selfAmount, parentsAmount, isSelfSenior, isParentsSenior) => {
    const selfLimit = isSelfSenior ?
        ITR_VALIDATION_RULES.SECTION_80D_SELF_SENIOR :
        ITR_VALIDATION_RULES.SECTION_80D_SELF_LIMIT;

    const parentsLimit = isParentsSenior ?
        ITR_VALIDATION_RULES.SECTION_80D_PARENTS_SENIOR :
        ITR_VALIDATION_RULES.SECTION_80D_PARENTS_LIMIT;

    const errors = [];

    if (selfAmount > selfLimit) {
        errors.push(`Self/Family premium cannot exceed ₹${selfLimit.toLocaleString('en-IN')}`);
    }

    if (parentsAmount > parentsLimit) {
        errors.push(`Parents premium cannot exceed ₹${parentsLimit.toLocaleString('en-IN')}`);
    }

    const total = selfAmount + parentsAmount;
    const maxTotal = selfLimit + parentsLimit;

    if (total > maxTotal) {
        errors.push(`Total Section 80D cannot exceed ₹${maxTotal.toLocaleString('en-IN')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        total,
        maxTotal,
    };
};

/**
 * Validate house property loss
 */
export const validateHousePropertyLoss = (netIncome) => {
    if (netIncome < 0 && Math.abs(netIncome) > ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT) {
        return {
            valid: false,
            error: `Loss from house property cannot exceed ₹${ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT.toLocaleString('en-IN')}`,
            adjustedLoss: -ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT,
        };
    }

    return { valid: true, error: null };
};

/**
 * Calculate standard deduction for house property
 */
export const calculateStandardDeduction = (annualValue) => {
    return annualValue * ITR_VALIDATION_RULES.STANDARD_DEDUCTION_RATE;
};

/**
 * Validate cash transactions
 */
export const validateCashTransaction = (amount, limit = ITR_VALIDATION_RULES.SECTION_80G_CASH_LIMIT) => {
    if (amount > limit) {
        return {
            valid: false,
            error: `Cash transactions above ₹${limit.toLocaleString('en-IN')} are not allowed`,
        };
    }

    return { valid: true, error: null };
};

export default ITR_VALIDATION_RULES;
