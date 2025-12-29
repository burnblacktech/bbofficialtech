/**
 * SmartInsightsPanel.jsx
 * Displays generated Intelligence Signals.
 * 
 * Location: After Tax Outcome Section.
 * Style: Soft card, neutral background, collapsible.
 * Rules: Max 3 signals, plain English titles, no severity colors.
 */

import React, { useState } from 'react';

// Maps backend Signal IDs/Categories to plain English copy
const getSignalCopy = (signal) => {
    // Examples: "MISSING_80C"
    // We can map by ID or generalize by category if specific logic is complex

    switch (signal.id) {
        case 'MISSING_80C':
            return {
                title: 'You may be missing some tax savings',
                desc: 'Salary is above ₹5L but no 80C deductions (like PF/LIC) were found.'
            };
        case 'MISSING_80D_SENIOR':
            return {
                title: 'Check medical deduction limits',
                desc: 'Senior citizens typically claim higher 80D limits for medical expenses.'
            };
        case 'REGIME_OPTIMIZATION':
            return {
                title: 'Opting for a different regime might save tax',
                desc: 'Your income pattern suggests the other tax regime could be more beneficial.'
            };
        case 'SALARY_NO_FORM16':
            return {
                title: 'Verify salary details',
                desc: 'Salary is declared but no Form 16 was uploaded to cross-verify.'
            };
        case 'MULTIPLE_EMPLOYERS':
            return {
                title: 'Multiple income sources detected',
                desc: 'It looks like you had income from more than one employer.'
            };
        case 'LARGE_YOY_JUMP':
            return {
                title: 'Significant income change found',
                desc: 'Your income is substantially different from last year.'
            };
        default:
            // Generic Fallback
            return {
                title: 'Review this section carefully',
                desc: 'Our system detected an unusual pattern in your data.'
            };
    }
};

const SmartInsightsPanel = ({ computation }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const signals = computation?.signals || [];

    if (signals.length === 0) return null;

    // Take max 3 signals
    const displaySignals = signals.slice(0, 3);

    return (
        <div className="mt-8 mb-6 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden text-left">
            <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                        Smart Insights
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {signals.length}
                    </span>
                </div>
                <button className="text-slate-400 text-sm font-medium focus:outline-none">
                    {isExpanded ? 'Hide' : 'Show'}
                </button>
            </div>

            {isExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-4">
                    {displaySignals.map((signal, idx) => {
                        const copy = getSignalCopy(signal);
                        return (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-medium text-slate-800 mb-1">
                                    {copy.title}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {copy.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SmartInsightsPanel;
