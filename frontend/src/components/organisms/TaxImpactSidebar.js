import React, { useEffect, useState } from 'react';
import { Calculator, TrendingDown, Info } from 'lucide-react';

const TaxImpactSidebar = ({ totalIncome = 0, deductions = 0, isVisible = true }) => {
    const [taxData, setTaxData] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger animation on data change
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 300);

        // Calculate tax impact
        const calculateTax = () => {
            // Old Regime Calculation
            const oldTaxableIncome = Math.max(0, totalIncome - deductions);
            const oldTax = computeTax(oldTaxableIncome, 'old');

            // New Regime Calculation (no deductions)
            const newTaxableIncome = totalIncome;
            const newTax = computeTax(newTaxableIncome, 'new');

            setTaxData({
                totalIncome,
                deductions,
                oldRegime: {
                    taxableIncome: oldTaxableIncome,
                    tax: oldTax,
                },
                newRegime: {
                    taxableIncome: newTaxableIncome,
                    tax: newTax,
                },
                recommended: oldTax < newTax ? 'old' : 'new',
                savings: Math.abs(oldTax - newTax),
            });
        };

        calculateTax();
        return () => clearTimeout(timer);
    }, [totalIncome, deductions]);

    // Simplified tax calculation (client-side)
    const computeTax = (taxableIncome, regime) => {
        const slabs = regime === 'old'
            ? [
                { min: 0, max: 250000, rate: 0 },
                { min: 250000, max: 500000, rate: 5 },
                { min: 500000, max: 1000000, rate: 20 },
                { min: 1000000, max: Infinity, rate: 30 },
            ]
            : [
                { min: 0, max: 300000, rate: 0 },
                { min: 300000, max: 600000, rate: 5 },
                { min: 600000, max: 900000, rate: 10 },
                { min: 900000, max: 1200000, rate: 15 },
                { min: 1200000, max: 1500000, rate: 20 },
                { min: 1500000, max: Infinity, rate: 30 },
            ];

        let tax = 0;
        let remaining = taxableIncome;

        for (const slab of slabs) {
            if (remaining <= 0) break;
            const slabIncome = Math.min(remaining, slab.max === Infinity ? remaining : slab.max - slab.min);
            tax += (slabIncome * slab.rate) / 100;
            remaining -= slabIncome;
        }

        // Add 4% cess
        const cess = tax * 0.04;
        return Math.round(tax + cess);
    };

    if (!isVisible || !taxData) return null;

    return (
        <div
            className="sticky top-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden animate-fadeScaleIn"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-full custom-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Calculator size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tax Impact</h3>
                </div>

                {/* Income Summary */}
                <div className="space-y-3 mb-6 pb-6 border-b border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Total Income</span>
                        <span className={`font-semibold text-gray-900 transition-all duration-200 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
                            ₹{taxData.totalIncome.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Deductions</span>
                        <span className="font-semibold text-green-600">
                            -₹{taxData.deductions.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* Regime Comparison */}
                <div className="space-y-4 mb-6">
                    <div
                        className={`p-4 rounded-xl transition-all duration-200 animate-fadeSlideIn ${taxData.recommended === 'old'
                                ? 'bg-green-100 border-2 border-green-400 shadow-md'
                                : 'bg-white border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">Old Regime</span>
                            {taxData.recommended === 'old' && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 mb-3">
                            Taxable: ₹{taxData.oldRegime.taxableIncome.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-2xl font-bold text-gray-900 transition-all duration-200 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
                            ₹{taxData.oldRegime.tax.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div
                        className={`p-4 rounded-xl transition-all duration-200 animate-fadeSlideInDelay ${taxData.recommended === 'new'
                                ? 'bg-green-100 border-2 border-green-400 shadow-md'
                                : 'bg-white border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">New Regime</span>
                            {taxData.recommended === 'new' && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 mb-3">
                            Taxable: ₹{taxData.newRegime.taxableIncome.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-2xl font-bold text-gray-900 transition-all duration-200 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
                            ₹{taxData.newRegime.tax.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                {/* Savings */}
                {taxData.savings > 0 && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl shadow-sm animate-fadeSlideInDelay2">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown size={18} className="text-yellow-700" />
                            <span className="text-sm font-semibold text-yellow-900">Potential Savings</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-700 mb-1">
                            ₹{taxData.savings.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-yellow-700">
                            by choosing {taxData.recommended === 'old' ? 'Old' : 'New'} Regime
                        </div>
                    </div>
                )}

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-xl animate-fadeSlideInDelay3">
                    <div className="flex gap-3">
                        <Info size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            This is an estimate. Actual tax may vary based on surcharge, rebates, and TDS.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeScaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeScaleIn {
                    animation: fadeScaleIn 0.3s ease-out;
                }

                .animate-fadeSlideIn {
                    animation: fadeSlideIn 0.3s ease-out;
                }

                .animate-fadeSlideInDelay {
                    animation: fadeSlideIn 0.3s ease-out 0.1s both;
                }

                .animate-fadeSlideInDelay2 {
                    animation: fadeSlideIn 0.3s ease-out 0.2s both;
                }

                .animate-fadeSlideInDelay3 {
                    animation: fadeSlideIn 0.3s ease-out 0.3s both;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default TaxImpactSidebar;
