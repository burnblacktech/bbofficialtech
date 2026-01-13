// =====================================================
// TAX BREAKDOWN - Screen 3 (S29 Hardened)
// "How Your Tax Was Calculated"
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, Info, CheckCircle2, ChevronRight, AlertCircle, ArrowRight, Loader2, Zap, Shield, TrendingDown } from 'lucide-react';
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Crunching your numbers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Calculation Error</h3>
                    <p className="text-slate-600 mb-8">{error}</p>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
                    >
                        Go back to Overview
                    </button>
                </div>
            </div>
        );
    }

    const { selectedRegime, recommendedRegime, savings, steps } = data;
    const { finalLiability, taxableIncome, taxCalculation } = steps;
    const isZeroTax = finalLiability.totalTax === 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Progress Header */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className={`h-1.5 rounded-full transition-all ${step < 4 ? 'bg-indigo-600 w-8' : step === 4 ? 'bg-indigo-600 w-12' : 'bg-slate-200 w-8'}`} />
                    ))}
                </div>

                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Tax Calculation</h1>
                    <p className="text-slate-500 font-medium">Here's how we arrived at your tax liability.</p>
                </header>

                {/* Hero Result Section */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center mb-10 relative overflow-hidden">
                    {isZeroTax && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Zero Tax Benefit Applied</div>
                    )}
                    <h2 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
                        {finalLiability.refundOrPayable > 0 ? 'Estimated Tax Refund' : 'Total Tax Payable'}
                    </h2>
                    <div className={`text-6xl font-black mb-6 tracking-tighter ${isZeroTax || finalLiability.refundOrPayable > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ₹{Math.abs(finalLiability.refundOrPayable).toLocaleString('en-IN')}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${selectedRegime === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                            {selectedRegime === 'new' ? <Zap className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            <span className="text-xs font-bold uppercase tracking-wider">{selectedRegime} Tax Regime</span>
                        </div>
                        {savings > 0 && (
                            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 animate-bounce-slow">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Saving ₹{savings.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <button
                            onClick={() => navigate(`/filing/${filingId}/regime-comparison`)}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                        >
                            Compare Regimes
                        </button>
                    </div>
                </div>

                {/* Granular Breakdown */}
                <div className="space-y-8">
                    {/* Taxable Income Breakdown */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                            Income & Deductions
                        </h3>

                        <div className="space-y-4">
                            {taxableIncome.breakdown && Object.entries(taxableIncome.breakdown).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center py-1 group">
                                    <span className="text-sm font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">₹{value.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Gross Total Income</span>
                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">₹{taxableIncome.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Total Deductions</span>
                                <span className="font-black text-emerald-600">- ₹{taxableIncome.deductions.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                                <span className="text-base font-black text-slate-900 uppercase tracking-widest">NET TAXABLE INCOME</span>
                                <span className="text-xl font-black text-slate-900">₹{taxableIncome.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tax Calculation Logic */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield className="w-32 h-32" />
                        </div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10 text-indigo-300">
                            <Info className="w-5 h-5" />
                            Final Tax Summary
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-sm font-medium">Income Tax (Calculated on Slabs)</span>
                                <span className="font-bold text-white">₹{taxCalculation.slabTax.toLocaleString('en-IN')}</span>
                            </div>
                            {taxCalculation.rebate > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span className="text-sm font-medium">Rebate (Sec 87A)</span>
                                    <span className="font-bold">- ₹{taxCalculation.rebate.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-sm font-medium">Health & Education Cess (4%)</span>
                                <span className="font-bold text-white">₹{taxCalculation.cess.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pt-6 border-t border-slate-700 flex justify-between items-center">
                                <span className="text-base font-bold text-white uppercase tracking-widest">Total Tax Liability</span>
                                <span className="text-3xl font-black text-indigo-400">₹{taxCalculation.totalTax.toLocaleString('en-IN')}</span>
                            </div>
                            {finalLiability.tdsDeducted > 0 && (
                                <div className="flex justify-between items-center pt-2 text-emerald-300">
                                    <span className="text-sm font-bold italic uppercase tracking-widest">Less: TDS / Advance Tax Paid</span>
                                    <span className="font-bold">- ₹{finalLiability.tdsDeducted.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 space-y-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/readiness`)}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-4 active:scale-95 group"
                    >
                        Proceed to Final Review
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 text-sm transition-colors"
                    >
                        Wait, I need to edit my income details
                    </button>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Shield className="w-3.5 h-3.5" /> SECURE FILING
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% ACCURATE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxBreakdown;
