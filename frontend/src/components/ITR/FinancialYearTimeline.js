// =====================================================
// FINANCIAL YEAR TIMELINE (U3.1 - U3.5)
// "Your Financial Story of the Year"
// Pure DOM/CSS visualization. No charts.
// =====================================================

import React, { useMemo, useState } from 'react';
import {
    Wallet,
    PiggyBank,
    Scale,
    TrendingDown,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    AlertCircle,
} from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { motion, AnimatePresence } from 'framer-motion';

const FinancialYearTimeline = ({
    formData,
    taxComputation,
    selectedITR,
    onSectionSelect,
    activeSectionId,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // ------------------------------------------------------------
    // 1. Data Derivation
    // ------------------------------------------------------------

    // Income
    const totalIncome = taxComputation?.grossIncome || 0;

    // Deductions
    const totalDeductions = taxComputation?.totalDeductions || 0;

    // Tax Formation (Hypothetical tax on gross income - approximated)
    // We use effective rate to estimate "Tax Before Savings" if not provided
    // Or simply use Taxable Income for the story flow.
    // U3 spec: "Tax before savings was Z" -> Implies Gross Tax if deductions weren't there.
    // We'll approximate: TaxLiability + (Deductions * 0.20ish?)
    // BETTER: Just use (TaxLiability + TaxSaved) where TaxSaved is calculated below.
    const taxableIncome = taxComputation?.taxableIncome || 0;

    // Savings Impact
    // Estimate tax saved.
    // Simple logic: (GrossIncome Tax) - (Net Tax).
    // If we don't have Slab calculation function handy, we can assume ~20% of deductions saved.
    // But let's try to be precise if possible.
    // Actually, standard story: "You earned X" -> "Deductions Y" -> "Taxable Z" -> "Tax T".
    // U3 Spec asks for "Savings Impact: Your actions saved ₹S".
    // Let's deduce S = (Tax on Gross) - (Tax on Taxable).
    // We will assume a flat rate saving for visualization if computation complex.
    // Or just display "Deductions of ₹Y reduced your taxable income to ₹Z".
    const taxLiability = taxComputation?.totalTax || 0;
    const taxesPaid = taxComputation?.taxesPaid || 0;
    const refundOrPayable = taxComputation?.refundOrPayable || 0;

    // Dummy calculation for "Tax Saved" visual (just for the story)
    // If Taxable < 5L, tax is 0 (Rebate). Be careful.
    let taxSaved = 0;
    if (totalDeductions > 0) {
        // Rough estimation for visual story
        if (totalIncome > 1500000) taxSaved = totalDeductions * 0.30;
        else if (totalIncome > 1000000) taxSaved = totalDeductions * 0.20; // Blended
        else if (totalIncome > 500000) taxSaved = totalDeductions * 0.10; // Blended
        else taxSaved = totalDeductions * 0; // No tax anyway probably
    }
    // Add Rebate 87A to savings if applicable (Taxable < 7L New / 5L Old)
    if (taxableIncome <= 700000 && taxableIncome > 250000) {
        // They got a rebate. That's a "Saving".
        // We can count it or just stick to Deductions.
        // Let's stick to Deductions for clarity.
    }

    // ------------------------------------------------------------
    // 2. ITR-Specific Text (U3.4)
    // ------------------------------------------------------------
    const getIncomeText = () => {
        if (selectedITR?.includes('ITR-1')) return { label: 'Total Income', sub: 'Salary + Other' };
        if (selectedITR?.includes('ITR-3')) return { label: 'Total Income', sub: 'Business + Prof.' };
        if (selectedITR?.includes('ITR-4')) return { label: 'Presumptive Income', sub: 'Turnover based' };
        return { label: 'Total Income', sub: 'All sources' };
    };

    const incomeTxt = getIncomeText();

    // ------------------------------------------------------------
    // 3. Timeline Blocks Config
    // ------------------------------------------------------------
    const timelineSteps = [
        {
            id: 'income',
            title: 'Income',
            amount: totalIncome,
            desc: incomeTxt.sub,
            icon: Wallet,
            color: 'bg-emerald-100 text-emerald-700',
            sectionId: 'income', // Link to section
            isIncomplete: totalIncome === 0, // Simple heuristic
        },
        {
            id: 'deductions',
            title: 'Deductions',
            amount: totalDeductions,
            desc: 'Tax saver inv.',
            icon: PiggyBank,
            color: 'bg-blue-100 text-blue-700',
            sectionId: 'deductions',
            isIncomplete: false,
        },
        {
            id: 'taxable',
            title: 'Taxable Inc.', // "Tax Formation"
            amount: taxableIncome,
            desc: 'After savings',
            icon: Scale,
            color: 'bg-slate-100 text-slate-700',
            sectionId: 'taxComputation',
            isIncomplete: false,
        },
        {
            id: 'taxes',
            title: 'Tax Liability',
            amount: taxLiability,
            desc: 'Calculated tax',
            icon: TrendingDown,
            color: 'bg-amber-100 text-amber-700',
            sectionId: 'taxComputation',
            isIncomplete: false,
        },
        {
            id: 'outcome',
            title: refundOrPayable >= 0 ? 'Refund' : 'To Pay',
            amount: Math.abs(refundOrPayable),
            desc: refundOrPayable >= 0 ? 'Back to you' : 'Due amount',
            icon: refundOrPayable >= 0 ? CheckCircle : AlertCircle,
            color: refundOrPayable >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            sectionId: 'taxesPaid',
            isIncomplete: false,
        },
    ];

    // ------------------------------------------------------------
    // 4. Render
    // ------------------------------------------------------------
    return (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-all">
            {/* Header / Toggle */}
            <div
                className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between cursor-pointer group"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    FINANCIAL STORY <span className="text-slate-400 font-normal">| {incomeTxt.label}</span>
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden sm:block">
                        {isCollapsed ? 'Show Timeline' : 'Hide Timeline'}
                    </span>
                    <button className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                    >
                        <div className="max-w-[1200px] mx-auto px-4 py-4 overflow-x-auto">
                            <div className="flex items-start justify-between min-w-[600px] gap-2 relative">

                                {/* Connecting Line */}
                                <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 z-0"></div>

                                {timelineSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isActive = activeSectionId === step.sectionId;

                                    return (
                                        <div
                                            key={step.id}
                                            onClick={() => onSectionSelect && onSectionSelect(step.sectionId)}
                                            className={`
                            relative z-10 flex flex-col items-center text-center cursor-pointer group
                            w-1/5
                        `}
                                        >
                                            {/* Icon Circle */}
                                            <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all
                        border-2 
                        ${isActive ? 'border-primary-500 scale-110 shadow-md' : 'border-white shadow-sm'}
                        ${step.color}
                        group-hover:scale-105
                      `}>
                                                <Icon size={18} />
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                                                    {step.title}
                                                </div>
                                                <div className="text-base font-bold text-slate-900">
                                                    {formatIndianCurrency(step.amount)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {step.desc}
                                                </div>
                                            </div>

                                            {/* Incomplete Dot */}
                                            {step.isIncomplete && (
                                                <div className="absolute top-0 right-1/4 w-2 h-2 bg-amber-500 rounded-full border border-white"></div>
                                            )}
                                        </div>
                                    );
                                })}

                            </div>
                        </div>
                    </motion.div>
                )}
                )}
            </AnimatePresence>

            {/* V2.4: Confidence Strip */}
            <ConfidenceStrip computation={taxComputation} />
        </div>
    );
};

// Import ConfidenceStrip at top
import ConfidenceStrip from './intelligence/ConfidenceStrip';

export default FinancialYearTimeline;
