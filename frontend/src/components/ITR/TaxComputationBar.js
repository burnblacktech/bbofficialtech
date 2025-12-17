// =====================================================
// TAX COMPUTATION BAR COMPONENT (POLISHED)
// Glassmorphism design with smooth animations
// Desktop: Sticky top with expandable dropdown
// Mobile: Fixed bottom with swipe to expand
// =====================================================

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, ArrowRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedNumber from '../UI/AnimatedNumber';
import { formatIndianCurrency } from '../../lib/format';

// Compact flow item for the summary bar
const CompactFlowItem = ({ label, value, isLast = false, highlight = false, isLoading = false }) => (
  <div className="flex items-center gap-3">
    <motion.div
      className="flex flex-col"
      animate={highlight ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      {isLoading ? (
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-body-small text-slate-500">Calculating...</span>
        </div>
      ) : (
        <span className="text-body-large font-bold text-slate-900 tabular-nums">
          <AnimatedNumber value={value} format="currency" compact />
        </span>
      )}
    </motion.div>
    {!isLast && (
      <motion.div
        animate={{ x: [0, 2, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <ArrowRight className="w-4 h-4 text-slate-300" />
      </motion.div>
    )}
  </div>
);

// Result badge with animation
const ResultBadge = ({ isRefund, amount }) => {
  const isPositive = isRefund || amount === 0;

  return (
    <motion.div
      className={`
        px-4 py-2 rounded-xl flex items-center gap-2
        ${isPositive
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200'
          : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200'
        }
      `}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        animate={{ rotate: isPositive ? [0, 10, 0] : [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-amber-600" />
        )}
      </motion.div>
      <div className="flex flex-col">
        <span className={`text-[10px] font-medium uppercase tracking-wide ${isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
          {isRefund ? 'Refund' : amount === 0 ? 'No Tax' : 'Due'}
        </span>
        <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
          {formatIndianCurrency(Math.abs(amount))}
        </span>
      </div>
    </motion.div>
  );
};

// Regime selector with badge
const RegimeBadge = ({ regime, isRecommended, savings, onClick, isOpen }) => (
  <motion.button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all
      ${isRecommended
        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-700'
        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
      }
    `}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {isRecommended && (
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Sparkles className="w-4 h-4 text-emerald-500" />
      </motion.div>
    )}
    <span className="text-body-regular font-semibold">
      {regime === 'old' ? 'Old Regime' : 'New Regime'}
    </span>
    {isRecommended && savings > 0 && (
      <span className="text-body-small font-medium bg-emerald-500 text-white px-2 py-0.5 rounded-full">
        Save {formatIndianCurrency(savings, true)}
      </span>
    )}
    <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <ChevronDown className="w-4 h-4" />
    </motion.div>
  </motion.button>
);

// Glassmorphism dropdown for regime comparison
const RegimeComparisonDropdown = ({ computedValues, recommendedRegime, savings, onClose, isMobile = false }) => {
  const oldRefund = Math.max(0, computedValues.tdsPaid - computedValues.taxPayableOld);
  const newRefund = Math.max(0, computedValues.tdsPaid - computedValues.taxPayableNew);
  const oldDue = Math.max(0, computedValues.taxPayableOld - computedValues.tdsPaid);
  const newDue = Math.max(0, computedValues.taxPayableNew - computedValues.tdsPaid);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[70] ${isMobile ? 'w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]' : 'w-[560px] max-w-[95vw]'}`}
    >
      {/* Backdrop blur container */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-elevation-4 shadow-slate-900/10 overflow-hidden overflow-y-auto"
        style={{
          maxHeight: isMobile ? 'calc(100vh - 200px)' : '80vh',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-heading-4 font-semibold text-slate-900">Regime Comparison</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Comparison Cards */}
        <div className="p-6">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
            {/* Old Regime Card */}
            <motion.div
              className={`
                p-4 rounded-xl border-2 transition-all
                ${recommendedRegime === 'old'
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
                }
              `}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-body-regular font-semibold text-slate-700">Old Regime</span>
                {recommendedRegime === 'old' && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">
                    Best
                  </span>
                )}
              </div>
              <div className="text-heading-2 font-bold text-slate-900 tabular-nums mb-2">
                <AnimatedNumber value={computedValues.taxPayableOld} format="currency" />
              </div>
              <div className={`text-sm font-medium ${oldRefund > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {oldRefund > 0 ? `↑ Refund: ${formatIndianCurrency(oldRefund)}` : `↓ Due: ${formatIndianCurrency(oldDue)}`}
              </div>
            </motion.div>

            {/* New Regime Card */}
            <motion.div
              className={`
                p-4 rounded-xl border-2 transition-all
                ${recommendedRegime === 'new'
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
                }
              `}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-body-regular font-semibold text-slate-700">New Regime</span>
                {recommendedRegime === 'new' && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">
                    Best
                  </span>
                )}
              </div>
              <div className="text-heading-2 font-bold text-slate-900 tabular-nums mb-2">
                <AnimatedNumber value={computedValues.taxPayableNew} format="currency" />
              </div>
              <div className={`text-sm font-medium ${newRefund > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {newRefund > 0 ? `↑ Refund: ${formatIndianCurrency(newRefund)}` : `↓ Due: ${formatIndianCurrency(newDue)}`}
              </div>
            </motion.div>
          </div>

          {/* Savings Banner */}
          {savings > 0 && (
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-body-regular font-medium text-emerald-100">
                      {recommendedRegime === 'old' ? 'Old' : 'New'} Regime saves you
                    </p>
                    <p className="text-heading-3 font-bold">{formatIndianCurrency(savings)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Breakdown Table */}
          <div className="space-y-2 text-body-regular">
            <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">Breakdown</span>
              <span className="text-center font-medium text-slate-500">Old</span>
              <span className="text-center font-medium text-slate-500">New</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-2">
              <span className="text-slate-600">Gross Income</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.grossIncome)}</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.grossIncome)}</span>
            </div>
            {computedValues.agriculturalIncome > 0 && (
              <div className="grid grid-cols-3 gap-4 py-2">
                <span className="text-slate-600">Agricultural Income <span className="text-body-small text-slate-400">(exempt)</span></span>
                <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.agriculturalIncome)}</span>
                <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.agriculturalIncome)}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 py-2">
              <span className="text-slate-600">Deductions</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.deductionsOld)}</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.deductionsNew)}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-2">
              <span className="text-slate-600">Taxable Income</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.taxableIncomeOld)}</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.taxableIncomeNew)}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-2 border-t border-slate-100">
              <span className="text-slate-600">TDS/Advance Tax</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.tdsPaid)}</span>
              <span className="text-center text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.tdsPaid)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TaxComputationBar = ({
  grossIncome,
  deductions,
  taxableIncome,
  taxPayable,
  tdsPaid,
  onFileClick,
  formData,
  taxComputation,
  regimeComparison,
  selectedRegime = 'old', // Current selected regime from header
  isComputingTax = false, // Loading state for tax computation
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate values
  const computedValues = useMemo(() => {
    if (grossIncome !== undefined && deductions !== undefined && taxableIncome !== undefined && taxPayable !== undefined) {
      return {
        grossIncome,
        deductionsOld: deductions?.old || 0,
        deductionsNew: deductions?.new || 0,
        taxableIncomeOld: taxableIncome?.old || 0,
        taxableIncomeNew: taxableIncome?.new || 0,
        taxPayableOld: taxPayable?.old || 0,
        taxPayableNew: taxPayable?.new || 0,
        tdsPaid: tdsPaid || 0,
      };
    }

    if (!formData) {
      return {
        grossIncome: 0,
        deductionsOld: 0,
        deductionsNew: 0,
        taxableIncomeOld: 0,
        taxableIncomeNew: 0,
        taxPayableOld: 0,
        taxPayableNew: 0,
        tdsPaid: 0,
      };
    }

    const income = formData?.income || {};
    const deductionsData = formData?.deductions || {};
    const taxesPaid = formData?.taxesPaid || {};

    let businessIncomeTotal = 0;
    if (typeof income.businessIncome === 'object' && income.businessIncome?.businesses) {
      businessIncomeTotal = (income.businessIncome.businesses || []).reduce((sum, biz) =>
        sum + (parseFloat(biz.pnl?.netProfit || biz.netProfit || 0)), 0);
    } else {
      businessIncomeTotal = parseFloat(income.businessIncome) || 0;
    }

    let professionalIncomeTotal = 0;
    if (typeof income.professionalIncome === 'object' && income.professionalIncome?.professions) {
      professionalIncomeTotal = (income.professionalIncome.professions || []).reduce((sum, prof) =>
        sum + (parseFloat(prof.pnl?.netIncome || prof.netIncome || prof.netProfit || 0)), 0);
    } else {
      professionalIncomeTotal = parseFloat(income.professionalIncome) || 0;
    }

    // Handle presumptive income (ITR-4)
    let presumptiveBusinessTotal = 0;
    let presumptiveProfessionalTotal = 0;
    if (income.presumptiveBusiness) {
      presumptiveBusinessTotal = parseFloat(income.presumptiveBusiness.presumptiveIncome || 0);
    }
    if (income.presumptiveProfessional) {
      presumptiveProfessionalTotal = parseFloat(income.presumptiveProfessional.presumptiveIncome || 0);
    }

    // Handle other sources income (structured format)
    let otherSourcesTotal = 0;
    if (typeof income.otherSources === 'object' && income.otherSources) {
      otherSourcesTotal = parseFloat(income.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(income.otherSources.totalInterestIncome || 0) + parseFloat(income.otherSources.totalOtherIncome || 0));
    } else {
      otherSourcesTotal = parseFloat(income.otherIncome) || 0;
    }

    // Extract agricultural income (exempt but shown for completeness)
    const agriculturalIncome = parseFloat(
      formData?.exemptIncome?.agriculturalIncome?.netAgriculturalIncome ||
      formData?.exemptIncome?.netAgriculturalIncome ||
      formData?.agriculturalIncome ||
      0,
    );

    // Handle foreign income (ITR-2, ITR-3)
    let foreignIncomeTotal = 0;
    if (income.foreignIncome && typeof income.foreignIncome === 'object') {
      if (income.foreignIncome.foreignIncomeDetails && Array.isArray(income.foreignIncome.foreignIncomeDetails)) {
        foreignIncomeTotal = income.foreignIncome.foreignIncomeDetails.reduce((sum, item) =>
          sum + (parseFloat(item.amount || item.income || 0)), 0);
      } else {
        foreignIncomeTotal = parseFloat(income.foreignIncome.totalIncome || income.foreignIncome.amount || 0);
      }
    }

    // Handle director/partner income (ITR-2, ITR-3)
    let directorPartnerIncomeTotal = 0;
    if (income.directorPartner && typeof income.directorPartner === 'object') {
      directorPartnerIncomeTotal =
        (parseFloat(income.directorPartner.directorIncome) || 0) +
        (parseFloat(income.directorPartner.partnerIncome) || 0);
    }

    // Calculate gross total income (including agricultural income for display)
    const calculatedGrossIncome =
      (parseFloat(income.salary) || 0) +
      businessIncomeTotal +
      professionalIncomeTotal +
      presumptiveBusinessTotal +
      presumptiveProfessionalTotal +
      otherSourcesTotal +
      foreignIncomeTotal +
      directorPartnerIncomeTotal +
      (typeof income.capitalGains === 'object' && income.capitalGains?.stcgDetails
        ? (income.capitalGains.stcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0) +
          (income.capitalGains.ltcgDetails || []).reduce((sum, e) => sum + (parseFloat(e.gainAmount) || 0), 0)
        : parseFloat(income.capitalGains) || 0) +
      (typeof income.houseProperty === 'object' && income.houseProperty?.properties
        ? income.houseProperty.properties.reduce((sum, p) => {
            const rental = parseFloat(p.annualRentalIncome) || 0;
            const taxes = parseFloat(p.municipalTaxes) || 0;
            const interest = parseFloat(p.interestOnLoan) || 0;
            return sum + Math.max(0, rental - taxes - interest);
          }, 0)
        : parseFloat(income.houseProperty) || 0) +
      agriculturalIncome; // Include agricultural income (exempt but shown)

    const totalDeductionsOld =
      (parseFloat(deductionsData.section80C) || 0) +
      (parseFloat(deductionsData.section80D) || 0) +
      (parseFloat(deductionsData.section80G) || 0) +
      (parseFloat(deductionsData.section80TTA) || 0) +
      (parseFloat(deductionsData.section80TTB) || 0) +
      Object.values(deductionsData.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const totalDeductionsNew = 50000;

    const taxableIncomeOld = Math.max(0, calculatedGrossIncome - totalDeductionsOld);
    const taxableIncomeNew = Math.max(0, calculatedGrossIncome - totalDeductionsNew);

    const totalTaxesPaid =
      (parseFloat(taxesPaid.tds) || 0) +
      (parseFloat(taxesPaid.advanceTax) || 0) +
      (parseFloat(taxesPaid.selfAssessmentTax) || 0);

    const oldRegimeTax = regimeComparison?.oldRegime?.totalTax || taxComputation?.totalTax || 0;
    const newRegimeTax = regimeComparison?.newRegime?.totalTax || 0;

    return {
      grossIncome: calculatedGrossIncome,
      agriculturalIncome, // Include for display purposes
      taxableGrossIncome: calculatedGrossIncome - agriculturalIncome, // Gross income excluding exempt agricultural income
      deductionsOld: totalDeductionsOld,
      deductionsNew: totalDeductionsNew,
      taxableIncomeOld,
      taxableIncomeNew,
      taxPayableOld: oldRegimeTax,
      taxPayableNew: newRegimeTax,
      tdsPaid: totalTaxesPaid,
    };
  }, [formData, grossIncome, deductions, taxableIncome, taxPayable, tdsPaid, regimeComparison, taxComputation]);

  const recommendedRegime = computedValues.taxPayableOld <= computedValues.taxPayableNew ? 'old' : 'new';
  const savings = Math.abs(computedValues.taxPayableOld - computedValues.taxPayableNew);
  // Use selected regime from header, fallback to recommended
  const currentRegime = selectedRegime || recommendedRegime;
  const netTax = currentRegime === 'old' ? computedValues.taxPayableOld : computedValues.taxPayableNew;
  const netResult = computedValues.tdsPaid - netTax;
  const isRecommended = currentRegime === recommendedRegime;

  // DESKTOP: Fixed top bar with horizontal format per wireframe
  if (!isMobile) {
    return (
      <div
        ref={dropdownRef}
        className={`tax-computation-bar-desktop sticky top-0 z-40 flex-shrink-0 ${className}`}
        role="region"
        aria-label="Tax computation summary"
      >
        {/* Background with subtle border */}
        <div className="bg-white border-b border-slate-200 shadow-elevation-1">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex items-center justify-center h-16 gap-8">
              {/* Horizontal format: TOTAL INCOME | DEDUCTIONS | TAX */}
              {isComputingTax && !taxComputation?.isClientSide ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <motion.div
                    className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-body-regular">Calculating tax...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-body-regular font-medium text-slate-600">TOTAL INCOME:</span>
                    <span className="text-body-large font-bold text-slate-900 tabular-nums">
                      {formatIndianCurrency(computedValues.grossIncome)}
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body-regular font-medium text-slate-600">DEDUCTIONS:</span>
                    <span className="text-body-large font-bold text-slate-900 tabular-nums">
                      {formatIndianCurrency(currentRegime === 'old' ? computedValues.deductionsOld : computedValues.deductionsNew)}
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body-regular font-medium text-slate-600">TAX:</span>
                    <span className="text-body-large font-bold text-slate-900 tabular-nums">
                      {formatIndianCurrency(netTax)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown for regime comparison (optional, can be triggered elsewhere) */}
        <AnimatePresence>
          {showDropdown && (
            <RegimeComparisonDropdown
              computedValues={computedValues}
              recommendedRegime={recommendedRegime}
              savings={savings}
              onClose={() => setShowDropdown(false)}
              isMobile={isMobile}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // MOBILE: Fixed top bar with compact format per wireframe
  return (
    <div
      className={`tax-computation-bar-mobile fixed top-0 left-0 right-0 z-50 ${className}`}
      role="region"
      aria-label="Tax computation summary"
    >
      {/* Background with border */}
      <div className="bg-white border-b border-slate-200 shadow-elevation-1">
        <div className="px-4 py-3">
          {isComputingTax && !taxComputation?.isClientSide ? (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <motion.div
                className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-body-regular">Calculating tax...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-body-regular">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">TOTAL:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatIndianCurrency(computedValues.grossIncome)}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">TAX:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatIndianCurrency(netTax)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(TaxComputationBar);
