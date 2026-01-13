// =====================================================
// FINANCIAL STORY HERO - COMPACT SUMMARY CARD
// Shows latest year financial summary at a glance
// =====================================================

import React from 'react';
import { TrendingUp, DollarSign, Receipt } from 'lucide-react';

const FinancialStoryHero = ({ summary }) => {
    if (!summary) return null;

    const formatCurrency = (amount) => {
        return `₹${(amount / 100000).toFixed(1)}L`;
    };

    return (
        <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Financial Year</p>
                    <h2 className="text-3xl font-bold">{summary.latestYear}</h2>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <DollarSign className="w-8 h-8" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Income */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-white/70 text-sm mb-2">Total Income</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.latestIncome)}</p>
                </div>

                {/* Growth */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                        <p className="text-white/70 text-sm">Growth</p>
                    </div>
                    <p className="text-2xl font-bold">
                        {summary.totalGrowth > 0 ? '+' : ''}{summary.totalGrowth}%
                    </p>
                </div>

                {/* Tax Rate */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-orange-300" />
                        <p className="text-white/70 text-sm">Avg Tax Rate</p>
                    </div>
                    <p className="text-2xl font-bold">{summary.avgTaxRate}%</p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/80 text-sm">
                    Tracking {summary.yearsTracked} {summary.yearsTracked === 1 ? 'year' : 'years'} of financial data
                </p>
            </div>
        </div>
    );
};

export default FinancialStoryHero;
