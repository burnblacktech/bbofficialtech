// =====================================================
// REGIME COMPARISON - Detailed Side-By-Side Comparison
// Allows user to switch between Old and New Regime
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Zap, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const RegimeComparison = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedRegime, setSelectedRegime] = useState('old');

    useEffect(() => {
        const fetchComparison = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/tax-breakdown`, { headers });
                setData(response.data.data);
                setSelectedRegime(response.data.data.selectedRegime);
            } catch (err) {
                toast.error('Failed to load regime comparison');
            } finally {
                setLoading(false);
            }
        };

        fetchComparison();
    }, [filingId]);

    const handleSwitchRegime = async (regime) => {
        try {
            setSelectedRegime(regime);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                selectedRegime: regime,
            }, { headers });

            toast.success(`Switched to ${regime.toUpperCase()} regime`);
        } catch (err) {
            toast.error('Failed to switch regime');
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold">Comparing Tax Regimes...</div>;

    const { oldRegime, newRegime, recommendedRegime, savings } = data;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-summary`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Calculation</span>
                    </button>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Which Regime is Best for You?</h1>
                    <p className="text-lg text-slate-600 max-w-2xl">We compared the Old and New Tax Regimes based on your income and deductions. Here's our recommendation to save you the most tax.</p>
                </header>

                {/* Recommendation Hero */}
                <div className="bg-indigo-900 rounded-[2.5rem] p-10 shadow-2xl mb-12 relative overflow-hidden text-white mb-12">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                        <Zap className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center rotate-3 shadow-lg shrink-0">
                            <Zap className="w-10 h-10 text-indigo-900" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-2">Our Pick: <span className="text-amber-400 capitalize">{recommendedRegime} Regime</span></h2>
                            <p className="text-indigo-100 text-lg">By choosing this regime, you save approximately <span className="font-bold text-white text-xl ml-1">₹{savings.toLocaleString('en-IN')}</span> in taxes compared to the alternative.</p>
                        </div>
                    </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Old Regime Card */}
                    <div className={`rounded-3xl border-2 p-8 transition-all relative ${selectedRegime === 'old' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-50/50 border-slate-200 opacity-80'}`}>
                        {recommendedRegime === 'old' && (
                            <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Best Choice
                            </div>
                        )}
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                            <Shield className={`w-6 h-6 ${selectedRegime === 'old' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Old Regime
                        </h3>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-8">With all tax deductions (80C, 80D, etc.)</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center py-2 text-slate-600 border-b border-slate-100">
                                <span className="text-sm font-medium">Gross Total Income</span>
                                <span className="font-bold">₹{oldRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-emerald-600 border-b border-emerald-50">
                                <span className="text-sm font-bold">Total Deductions Claimed</span>
                                <span className="font-bold">- ₹{oldRegime.totalDeductions.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-slate-900 border-b border-slate-100">
                                <span className="text-sm font-bold">Taxable Income</span>
                                <span className="font-black">₹{oldRegime.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-8">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Final Tax Liability</span>
                                <span className="text-3xl font-black text-slate-900">₹{oldRegime.finalTaxLiability.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSwitchRegime('old')}
                            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${selectedRegime === 'old' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {selectedRegime === 'old' ? <CheckCircle2 className="w-5 h-5" /> : null}
                            {selectedRegime === 'old' ? 'Selected Old Regime' : 'Switch to Old Regime'}
                        </button>
                    </div>

                    {/* New Regime Card */}
                    <div className={`rounded-3xl border-2 p-8 transition-all relative ${selectedRegime === 'new' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-50/50 border-slate-200 opacity-80'}`}>
                        {recommendedRegime === 'new' && (
                            <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Best Choice
                            </div>
                        )}
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                            <Zap className={`w-6 h-6 ${selectedRegime === 'new' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            New Regime (Simplified)
                        </h3>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-8">Higher slabs, but no deductions</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center py-2 text-slate-600 border-b border-slate-100">
                                <span className="text-sm font-medium">Gross Total Income</span>
                                <span className="font-bold">₹{newRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-slate-400 border-b border-slate-100 opacity-50">
                                <span className="text-sm font-bold italic">Deductions Not Applicable</span>
                                <span className="font-bold">₹0</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-slate-900 border-b border-slate-100">
                                <span className="text-sm font-bold">Taxable Income</span>
                                <span className="font-black">₹{newRegime.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-8">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Final Tax Liability</span>
                                <span className="text-3xl font-black text-slate-900">₹{newRegime.finalTaxLiability.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSwitchRegime('new')}
                            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${selectedRegime === 'new' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {selectedRegime === 'new' ? <CheckCircle2 className="w-5 h-5" /> : null}
                            {selectedRegime === 'new' ? 'Selected New Regime' : 'Switch to New Regime'}
                        </button>
                    </div>
                </div>

                {/* Info Text */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-12 flex items-start gap-4">
                    <Info className="w-6 h-6 text-indigo-200 shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">Choosing your tax regime</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">The Finance Act 2023 made the New Tax Regime the default choice. However, if you have significant investments like LIC, PPF, Home Loan Interest, or Health Insurance, the Old Regime might lead to zero tax even if your income is high. We evaluate both and recommend the one that keeps more money in your pocket.</p>
                    </div>
                </div>

                {/* Proceed Button */}
                <button
                    onClick={() => navigate(`/filing/${filingId}/tax-summary`)}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                >
                    Confirm & Proceed to Review
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <Save className="w-5 h-5" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default RegimeComparison;
