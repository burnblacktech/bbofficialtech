// =====================================================
// GUIDED SECTION FLOW (Collect Data)
// Single source of truth for section ordering + minimum required checks
// =====================================================

const ORDER = [
  'income', // V1: Numbers First
  // ITR-3
  'businessIncome',
  'professionalIncome',
  'balanceSheet',
  'auditInfo',
  // ITR-4
  'presumptiveIncome',
  'goodsCarriage',
  // ITR-2/3 (optional)
  'scheduleFA',
  // common
  'deductions',
  'taxesPaid',
  'taxComputation', // Outcome (Step 5)
  'taxOptimizer',
  // The Gate (Step 6)
  'personalInfo',
  'bankDetails',
];

function get(obj, path) {
  if (!obj) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return !Number.isNaN(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'boolean') return true;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return false;
}

function hasAnyIncomeSignal(formData, itrType) {
  const income = formData?.income || {};

  const salary = parseFloat(income.salary) || 0;
  if (salary > 0) return true;

  // Other sources total
  const otherSources = income.otherSources || formData?.otherSources || null;
  if (otherSources && typeof otherSources === 'object') {
    const otherTotal =
      parseFloat(otherSources.totalOtherSourcesIncome || 0) ||
      (parseFloat(otherSources.totalInterestIncome || 0) + parseFloat(otherSources.totalOtherIncome || 0));
    if (otherTotal > 0) return true;
  }

  // House property
  if (income.houseProperty?.properties?.length > 0) return true;

  // Capital gains (ITR-2/3)
  if (itrType === 'ITR-2' || itrType === 'ITR2' || itrType === 'ITR-3' || itrType === 'ITR3') {
    if (income.capitalGains && typeof income.capitalGains === 'object') {
      if (income.capitalGains.hasCapitalGains) return true;
      if ((income.capitalGains.stcgDetails || []).length > 0) return true;
      if ((income.capitalGains.ltcgDetails || []).length > 0) return true;
    }
  }

  // ITR-3 business/professional
  if (itrType === 'ITR-3' || itrType === 'ITR3') {
    if ((income.businessIncome?.businesses || []).length > 0) return true;
    if ((income.professionalIncome?.professions || []).length > 0) return true;
    const bizNum = typeof income.businessIncome === 'number' ? income.businessIncome : 0;
    const profNum = typeof income.professionalIncome === 'number' ? income.professionalIncome : 0;
    if (bizNum > 0 || profNum > 0) return true;
  }

  // ITR-4 presumptive
  if (itrType === 'ITR-4' || itrType === 'ITR4') {
    const pb = income.presumptiveBusiness || {};
    const pp = income.presumptiveProfessional || {};
    if (parseFloat(pb.presumptiveIncome) > 0) return true;
    if (parseFloat(pp.presumptiveIncome) > 0) return true;
    if (pb.hasPresumptiveBusiness) return true;
    if (pp.hasPresumptiveProfessional) return true;
  }

  return false;
}

function normalizeITR(itrType) {
  const raw = String(itrType || '').toUpperCase().trim();
  if (raw === 'ITR1' || raw === 'ITR-1') return 'ITR-1';
  if (raw === 'ITR2' || raw === 'ITR-2') return 'ITR-2';
  if (raw === 'ITR3' || raw === 'ITR-3') return 'ITR-3';
  if (raw === 'ITR4' || raw === 'ITR-4') return 'ITR-4';
  return 'ITR-1';
}

function hasAuditApplicabilitySignal(formData) {
  const businesses = get(formData, 'businessIncome.businesses') || get(formData, 'income.businessIncome.businesses') || [];
  const professions = get(formData, 'professionalIncome.professions') || get(formData, 'income.professionalIncome.professions') || [];

  // Business: turnover > 1cr OR profit < 8% of turnover
  if (Array.isArray(businesses) && businesses.length > 0) {
    const totalTurnover = businesses.reduce((sum, b) => sum + (parseFloat(b?.pnl?.grossReceipts) || 0), 0);
    if (totalTurnover > 10000000) return true;

    for (const b of businesses) {
      const turnover = parseFloat(b?.pnl?.grossReceipts) || 0;
      const profit = parseFloat(b?.pnl?.netProfit) || 0;
      if (turnover > 0) {
        const pct = (profit / turnover) * 100;
        if (pct < 8) return true;
      }
    }
  }

  // Profession: receipts > 50L OR profit < 50% of receipts
  if (Array.isArray(professions) && professions.length > 0) {
    const totalReceipts = professions.reduce((sum, p) => sum + (parseFloat(p?.pnl?.professionalFees) || 0), 0);
    if (totalReceipts > 5000000) return true;

    for (const p of professions) {
      const receipts = parseFloat(p?.pnl?.professionalFees) || 0;
      const profit = parseFloat(p?.pnl?.netIncome) || 0;
      if (receipts > 0) {
        const pct = (profit / receipts) * 100;
        if (pct < 50) return true;
      }
    }
  }

  return false;
}

export function shouldShowSection(sectionId, formData, itrType, opts = {}) {
  const itr = normalizeITR(itrType);

  // ITR-type hard exclusions first
  if (itr === 'ITR-1') {
    if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'scheduleFA', 'presumptiveIncome', 'goodsCarriage'].includes(sectionId)) {
      return false;
    }
  }

  if (itr === 'ITR-2') {
    if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'presumptiveIncome', 'goodsCarriage'].includes(sectionId)) {
      return false;
    }
  }

  if (itr === 'ITR-3') {
    if (['presumptiveIncome', 'goodsCarriage'].includes(sectionId)) {
      return false;
    }
  }

  if (itr === 'ITR-4') {
    if (['businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo', 'scheduleFA'].includes(sectionId)) {
      return false;
    }
  }

  // Progressive disclosure (optional sections)
  if (sectionId === 'scheduleFA') {
    const eligible = itr === 'ITR-2' || itr === 'ITR-3';
    if (!eligible) return false;

    // Schedule FA depends on having a filingId (separate persisted slice)
    const canUse = !!opts.filingId;
    if (!canUse) return false;

    const hasExisting = Number(opts.foreignAssetsCount || 0) > 0;
    const hasForeignIncomeSignal = !!opts.hasForeignIncomeSignal;
    const optedIn = !!opts.scheduleFAOptIn;
    return optedIn || hasExisting || hasForeignIncomeSignal;
  }

  if (sectionId === 'balanceSheet') {
    if (itr !== 'ITR-3') return false;

    const hasBS =
      !!get(formData, 'balanceSheet.hasBalanceSheet') ||
      !!get(formData, 'balanceSheet.balanceSheet.hasBalanceSheet');

    const assetsTotal =
      parseFloat(get(formData, 'balanceSheet.assets.total') || get(formData, 'balanceSheet.balanceSheet.assets.total') || 0);
    const liabTotal =
      parseFloat(get(formData, 'balanceSheet.liabilities.total') || get(formData, 'balanceSheet.balanceSheet.liabilities.total') || 0);

    return !!opts.balanceSheetOptIn || hasBS || assetsTotal > 0 || liabTotal > 0;
  }

  if (sectionId === 'auditInfo') {
    if (itr !== 'ITR-3') return false;

    const isApplicable =
      !!get(formData, 'auditInfo.isAuditApplicable') ||
      !!get(formData, 'auditInfo.auditInfo.isAuditApplicable');

    const hasSignal = hasAuditApplicabilitySignal(formData);
    return !!opts.auditInfoOptIn || isApplicable || hasSignal;
  }

  if (sectionId === 'goodsCarriage') {
    if (itr !== 'ITR-4') return false;

    const hasGoodsCarriage =
      !!get(formData, 'goodsCarriage.hasGoodsCarriage') ||
      !!get(formData, 'goodsCarriage.goodsCarriage.hasGoodsCarriage');

    const vehicles =
      get(formData, 'goodsCarriage.vehicles') ||
      get(formData, 'goodsCarriage.goodsCarriage.vehicles') ||
      [];

    const hasVehicles = Array.isArray(vehicles) && vehicles.length > 0;
    return !!opts.goodsCarriageOptIn || hasGoodsCarriage || hasVehicles;
  }

  return true;
}

export function orderSections(sections = []) {
  const index = new Map(ORDER.map((id, i) => [id, i]));
  return [...sections].sort((a, b) => {
    const ai = index.has(a.id) ? index.get(a.id) : 9999;
    const bi = index.has(b.id) ? index.get(b.id) : 9999;
    if (ai !== bi) return ai - bi;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function getMissingRequired(sectionId, formData, itrType) {
  if (!sectionId) return [];

  if (sectionId === 'personalInfo') {
    const required = ['personalInfo.pan', 'personalInfo.name', 'personalInfo.dateOfBirth'];
    return required.filter((p) => !hasValue(get(formData, p)));
  }

  if (sectionId === 'income') {
    return hasAnyIncomeSignal(formData, itrType) ? [] : ['income.__signal__'];
  }

  if (sectionId === 'bankDetails') {
    const required = ['bankDetails.accountNumber', 'bankDetails.ifsc'];
    return required.filter((p) => !hasValue(get(formData, p)));
  }

  // Balance sheet only blocks if user says they maintain it
  if (sectionId === 'balanceSheet') {
    const hasBS = !!get(formData, 'balanceSheet.hasBalanceSheet');
    if (!hasBS) return [];
    const assetsTotal = parseFloat(get(formData, 'balanceSheet.assets.total') || 0);
    const liabTotal = parseFloat(get(formData, 'balanceSheet.liabilities.total') || 0);
    if (assetsTotal <= 0 || liabTotal <= 0) return ['balanceSheet.total'];
    if (assetsTotal !== liabTotal) return ['balanceSheet.notBalanced'];
    return [];
  }

  // Audit only blocks if audit is applicable
  if (sectionId === 'auditInfo') {
    const isApplicable = !!get(formData, 'auditInfo.isAuditApplicable');
    if (!isApplicable) return [];
    const required = ['auditInfo.auditReportNumber', 'auditInfo.auditReportDate'];
    return required.filter((p) => !hasValue(get(formData, p)));
  }

  // Default: optional
  return [];
}

export function canProceedFromSection(sectionId, formData, itrType) {
  return getMissingRequired(sectionId, formData, itrType).length === 0;
}

export function getNextSectionId(orderedSections, activeSectionId) {
  if (!Array.isArray(orderedSections) || orderedSections.length === 0) return null;
  const idx = orderedSections.findIndex((s) => s.id === activeSectionId);
  if (idx < 0) return orderedSections[0].id;
  return orderedSections[idx + 1]?.id || null;
}

export function getPrevSectionId(orderedSections, activeSectionId) {
  if (!Array.isArray(orderedSections) || orderedSections.length === 0) return null;
  const idx = orderedSections.findIndex((s) => s.id === activeSectionId);
  if (idx <= 0) return null;
  return orderedSections[idx - 1]?.id || null;
}
