// =====================================================
// TAX OPPORTUNITIES CARD (U3.3)
// Educational, Non-pushy nudges for tax savings.
// =====================================================

import React, { useMemo } from 'react';
import { Lightbulb, ArrowRight, X } from 'lucide-react';

const TaxOpportunitiesCard = ({ formData, selectedITR, onDismiss }) => {
    const suggestions = useMemo(() => {
        const s = [];

        // 1. 80C Check (Limit 1.5L)
        const sec80c = parseFloat(formData?.deductions?.section80C || 0);
        if (sec80c < 150000) {
            const remaining = 150000 - sec80c;
            s.push({
                id: '80c',
                title: 'Maximize 80C',
                text: `You can still claim ₹${remaining.toLocaleString('en-IN')} for PPF, LIC, ELSS, etc.`,
                sectionId: 'deductions'
            });
        }

        // 2. 80D Health Insurance
        const sec80d = parseFloat(formData?.deductions?.section80D || 0);
        if (sec80d === 0) {
            s.push({
                id: '80d',
                title: 'Health Insurance',
                text: 'Premiums for self & parents can save significant tax under 80D.',
                sectionId: 'deductions'
            });
        }

        // 3. New vs Old Regime (Simplistic check - if high income and low deductions)
        // This is better suited for the Optimizer, but we can add a gentle nudge.
        // Omitted to keep it "Non-pushy" as per U3.3 specs ("Max 3 suggestions")

        // 3. Savings Interest (80TTA/B)
        // If interest income exists but no deduction claimed
        const interestIncome =
            parseFloat(formData?.income?.otherSources?.totalInterestIncome || 0) +
            parseFloat(formData?.otherSources?.totalInterestIncome || 0); // Legacy check

        const ded80tta = parseFloat(formData?.deductions?.section80TTA || 0);
        const ded80ttb = parseFloat(formData?.deductions?.section80TTB || 0);

        if (interestIncome > 0 && (ded80tta === 0 && ded80ttb === 0)) {
            s.push({
                id: '80tta',
                title: 'Savings Account Interest',
                text: 'Don\'t forget to claim deduction for savings account interest.',
                sectionId: 'deductions',
            });
        }

        return s.slice(0, 3); // Max 3
    }, [formData]);

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-100 rounded-full opacity-50 blur-xl"></div>

            <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-indigo-900 mb-2">
                        Tax Saving Opportunities
                    </h3>
                    <div className="space-y-2">
                        {suggestions.map((item) => (
                            <div key={item.id} className="flex items-center justify-between group">
                                <p className="text-sm text-indigo-800 leading-snug">
                                    <span className="font-semibold">{item.title}:</span> {item.text}
                                </p>
                                {/* Could add a 'Go' button here if needed, but the card itself isn't clickable to avoid accidents */}
                            </div>
                        ))}
                    </div>
                </div>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaxOpportunitiesCard;
