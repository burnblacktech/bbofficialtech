// =====================================================
// TAX BREAKDOWN - Screen 3 (S29 Hardened)
// "How Your Tax Was Calculated"
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, Info, CheckCircle2, ChevronRight, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SectionCard from '../../components/common/SectionCard';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';
import InlineHint from '../../components/common/InlineHint';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const TaxBreakdown = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTaxBreakdown = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Use the enriched /tax-breakdown endpoint (includes regime comparison + net liability)
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/tax-breakdown`, { headers });
                setData(response.data.data);
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Failed to load tax breakdown';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchTaxBreakdown();
    }, [filingId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                <p className="text-[var(--s29-text-muted)] font-medium">Applying tax laws and comparing regimes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6">
                <SectionCard title="Something went wrong">
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium"
                    >
                        Go back to Income Story
                    </button>
                </SectionCard>
            </div>
        );
    }

    const { selectedRegime, recommendedRegime, savings, oldRegime, newRegime, steps } = data;
    const { finalLiability } = steps;
    const isZeroTax = finalLiability.totalTax === 0;

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <header className="mb-10 text-center">
                    <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                        Step 4 of 5
                    </span>
                    <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mt-2">
                        Tax Calculation
                    </h1>
                </header>

                {/* Hero Celebration / Summary */}
                <div className="bg-white border border-[var(--s29-border-light)] rounded-[var(--s29-radius-large)] p-8 shadow-sm mb-8 text-center overflow-hidden relative">
                    {isZeroTax && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--s29-success)]" />
                    )}
                    <h2 className="text-[var(--s29-text-muted)] font-medium mb-1 uppercase tracking-wide text-xs">
                        {finalLiability.refundOrPayable > 0 ? 'Estimated Tax Refund' : 'Total Tax Payable'}
                    </h2>
                    <div className={`text-4xl md:text-5xl font-bold mb-4 ${isZeroTax || finalLiability.refundOrPayable > 0 ? 'text-[var(--s29-success)]' : 'text-[var(--s29-text-main)]'}`}>
                        ₹{Math.abs(finalLiability.refundOrPayable).toLocaleString('en-IN')}
                    </div>
                    {isZeroTax ? (
                        <p className="text-[var(--s29-text-muted)] max-w-sm mx-auto">
                            Great news! Your income falls within the tax-free limit. No tax is payable for this year.
                        </p>
                    ) : (
                        <p className="text-[var(--s29-text-muted)] max-w-sm mx-auto">
                            Calculated using the <span className="font-semibold text-[var(--s29-text-main)]">{selectedRegime === 'new' ? 'New (Simplified)' : 'Old'} Regime</span> to minimize your liability.
                        </p>
                    )}
                    <p className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] mt-2 italic">
                        This won’t change unless you change your income details.
                    </p>
                </div>

                {/* Breakdown - Cards within Cards */}
                <SectionCard title="Taxable Income Calculation">
                    <div className="space-y-4">
                        <div className="bg-[var(--s29-bg-page)] p-4 rounded-[var(--s29-radius-main)] border border-[var(--s29-border-light)]">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[var(--s29-text-muted)] text-sm font-medium">Gross Total Income</span>
                                <span className="font-bold text-[var(--s29-text-main)]">₹{steps.taxableIncome.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-[var(--s29-text-muted)] text-xs italic">Sum of all your income sources</p>
                        </div>

                        <div className="flex justify-center my-2">
                            <div className="h-4 border-l-2 border-dashed border-[var(--s29-border-light)]" />
                        </div>

                        <div className="bg-white p-4 rounded-[var(--s29-radius-main)] border border-[var(--s29-border-light)] relative">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-[var(--s29-border-light)] rounded-full flex items-center justify-center text-[var(--s29-text-muted)] text-[10px] font-bold">−</div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[var(--s29-text-muted)] text-sm font-medium">Total Deductions</span>
                                    <div className="group relative">
                                        <Info className="w-3.5 h-3.5 text-[var(--s29-text-muted)] cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            Includes 80C, 80D, and other tax-saving investments that reduce your taxable income.
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-[var(--s29-success)]">- ₹{steps.taxableIncome.deductions.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-[var(--s29-text-muted)] text-xs italic">Tax-free investments and allowances</p>
                        </div>

                        <div className="flex justify-center my-2">
                            <div className="h-4 border-l-2 border-dashed border-[var(--s29-border-light)]" />
                        </div>

                        <div className="bg-[var(--s29-primary-light)]/10 p-4 rounded-[var(--s29-radius-main)] border border-[var(--s29-primary-light)]">
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--s29-primary)] text-sm font-bold uppercase tracking-wider">Taxable Income</span>
                                <span className="font-bold text-[var(--s29-primary)] text-lg">₹{steps.taxableIncome.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Final Calculation Reassurance */}
                <div className="my-8 space-y-4">
                    <ReassuranceBanner
                        type="safety"
                        message={`We compared both regimes for you. The ${selectedRegime === 'new' ? 'New' : 'Old'} Regime saves you ₹${savings.toLocaleString('en-IN')} compared to the alternative.`}
                    />
                    {finalLiability.tdsDeducted > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[var(--s29-radius-main)] flex justify-between items-center">
                            <div>
                                <h4 className="text-emerald-900 font-semibold text-sm">TDS Already Paid</h4>
                                <p className="text-emerald-700 text-xs">Tax deducted at source by your employers/banks.</p>
                            </div>
                            <span className="text-emerald-600 font-bold">₹{finalLiability.tdsDeducted.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => {
                            if (finalLiability.refundOrPayable < 0) {
                                navigate(`/filing/${filingId}/tax-payment`);
                            } else {
                                navigate(`/filing/${filingId}/readiness`);
                            }
                        }}
                        className="w-full py-4 bg-[var(--s29-primary)] text-white rounded-[var(--s29-radius-main)] font-bold text-lg hover:bg-[var(--s29-primary-dark)] shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {finalLiability.refundOrPayable < 0 ? 'Pay Remaining Tax' : 'Final Review'}
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="w-full text-[var(--s29-text-muted)] py-2 text-sm hover:text-[var(--s29-text-main)] transition-colors"
                    >
                        Wait, let me double check my income
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-[var(--s29-border-light)]">
                    <InlineHint icon={<Calculator className="w-4 h-4" />}>
                        Calculations are based on Income Tax Act rules for Financial Year 2023-24 (AY 2024-25).
                    </InlineHint>
                </div>
            </div>
        </div>
    );
};

export default TaxBreakdown;
