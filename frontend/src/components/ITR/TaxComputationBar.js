// =====================================================
// TAX COMPUTATION BAR COMPONENT (POLISHED)
// Glassmorphism design with smooth animations
// Desktop: Sticky top with expandable dropdown
// Mobile: Fixed bottom with swipe to expand
// =====================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, ArrowRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedNumber from '../UI/AnimatedNumber';
import { formatIndianCurrency } from '../../lib/format';

// Compact flow item for the summary bar
const CompactFlowItem = ({ label, value, isLast = false, highlight = false }) => (
  <div className="flex items-center gap-3">
    <motion.div
      className="flex flex-col"
      animate={highlight ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-base font-bold text-slate-900 tabular-nums">
        <AnimatedNumber value={value} format="currency" compact />
      </span>
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
    <span className="text-sm font-semibold">
      {regime === 'old' ? 'Old Regime' : 'New Regime'}
    </span>
    {isRecommended && savings > 0 && (
      <span className="text-xs font-medium bg-emerald-500 text-white px-2 py-0.5 rounded-full">
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
const RegimeComparisonDropdown = ({ computedValues, recommendedRegime, savings, onClose }) => {
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
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[560px] max-w-[95vw]"
    >
      {/* Backdrop blur container */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Regime Comparison</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Comparison Cards */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                <span className="text-sm font-semibold text-slate-700">Old Regime</span>
                {recommendedRegime === 'old' && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">
                    Best
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums mb-2">
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
                <span className="text-sm font-semibold text-slate-700">New Regime</span>
                {recommendedRegime === 'new' && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">
                    Best
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums mb-2">
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
                    <p className="text-sm font-medium text-emerald-100">
                      {recommendedRegime === 'old' ? 'Old' : 'New'} Regime saves you
                    </p>
                    <p className="text-xl font-bold">{formatIndianCurrency(savings)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Breakdown Table */}
          <div className="space-y-2 text-sm">
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
                <span className="text-slate-600">Agricultural Income <span className="text-xs text-slate-400">(exempt)</span></span>
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

  // DESKTOP: Compact 60px bar with glassmorphism
  if (!isMobile) {
    return (
      <div
        ref={dropdownRef}
        className={`tax-computation-bar-desktop z-40 flex-shrink-0 ${className}`}
        role="region"
        aria-label="Tax computation summary"
      >
        {/* Glassmorphism background */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 h-[60px]">
            <div className="flex items-center justify-between h-full gap-6">
              {/* Flow Indicator */}
              <div className="flex items-center gap-4">
                <CompactFlowItem label="Income" value={computedValues.grossIncome} />
                <CompactFlowItem label="Deductions" value={currentRegime === 'old' ? computedValues.deductionsOld : computedValues.deductionsNew} />
                <CompactFlowItem label="Tax" value={netTax} isLast />
              </div>

              {/* Result Badge */}
              <ResultBadge isRefund={netResult >= 0} amount={netResult} />

              {/* Regime Display (read-only, shows current selection) */}
              <RegimeBadge
                regime={currentRegime}
                isRecommended={isRecommended}
                savings={isRecommended ? savings : 0}
                onClick={() => setShowDropdown(!showDropdown)}
                isOpen={showDropdown}
              />

              {/* File ITR Button */}
              <motion.button
                onClick={onFileClick}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Review & File
              </motion.button>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <RegimeComparisonDropdown
              computedValues={computedValues}
              recommendedRegime={recommendedRegime}
              savings={savings}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // MOBILE: Fixed bottom bar
  return (
    <motion.div
      className={`tax-computation-bar-mobile fixed bottom-0 left-0 right-0 z-50 ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      animate={{ height: isExpanded ? 320 : 88 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      role="region"
      aria-label="Tax computation summary"
    >
      {/* Glassmorphism background */}
      <div className="h-full bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl shadow-slate-900/10 rounded-t-3xl overflow-hidden">
        {/* Drag Handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-center py-3 cursor-pointer"
          aria-label={isExpanded ? 'Collapse tax bar' : 'Expand tax bar'}
        >
          <motion.div
            className="w-12 h-1.5 bg-slate-300 rounded-full"
            animate={{ backgroundColor: isExpanded ? '#94a3b8' : '#cbd5e1' }}
          />
        </button>

        {!isExpanded ? (
          // Collapsed: Key info
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${netResult >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {netResult >= 0 ? 'Refund' : 'Due'}: {formatIndianCurrency(Math.abs(netResult))}
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{recommendedRegime.toUpperCase()} saves {formatIndianCurrency(savings)}</span>
                </div>
              </div>
              <motion.button
                onClick={onFileClick}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                File ITR →
              </motion.button>
            </div>
          </div>
        ) : (
          // Expanded: Full comparison
          <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: '280px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Tax Summary</h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">AY 2024-25</span>
            </div>

            {/* Regime Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl ${recommendedRegime === 'old' ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 border border-slate-200'}`}>
                <div className="text-xs font-medium text-slate-500 mb-1">Old Regime</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.taxPayableOld)}</div>
                {recommendedRegime === 'old' && (
                  <span className="text-[10px] font-bold text-emerald-600">✓ BEST</span>
                )}
              </div>
              <div className={`p-3 rounded-xl ${recommendedRegime === 'new' ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 border border-slate-200'}`}>
                <div className="text-xs font-medium text-slate-500 mb-1">New Regime</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.taxPayableNew)}</div>
                {recommendedRegime === 'new' && (
                  <span className="text-[10px] font-bold text-emerald-600">✓ BEST</span>
                )}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Income</span>
                <span className="font-medium text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.grossIncome)}</span>
              </div>
              {computedValues.agriculturalIncome > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Agricultural Income <span className="text-xs text-slate-400">(exempt)</span></span>
                  <span className="font-medium text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.agriculturalIncome)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Deductions</span>
                <span className="font-medium text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.deductionsOld)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TDS Paid</span>
                <span className="font-medium text-slate-900 tabular-nums">{formatIndianCurrency(computedValues.tdsPaid)}</span>
              </div>
            </div>

            {/* Savings Banner */}
            {savings > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-3 mb-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white" />
                <div className="text-white">
                  <p className="text-xs font-medium text-emerald-100">You save with {recommendedRegime === 'old' ? 'Old' : 'New'} Regime</p>
                  <p className="text-lg font-bold">{formatIndianCurrency(savings)}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button
              onClick={onFileClick}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg"
              whileTap={{ scale: 0.98 }}
            >
              Review & File ITR →
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaxComputationBar;
