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
import { PageContent } from '../../components/Layout';
import { ReviewPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
        <ReviewPage
            title="Which Regime is Best?"
            subtitle="We compared both options based on your facts. Here's our recommendation."
            onBack={() => navigate(`/filing/${filingId}/tax-summary`)}
            backLabel="Back to Calculation"
        >
            <PageContent spacing="section">
                {/* Recommendation Hero */}
                <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden text-white mb-6">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                        <Zap className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shrink-0">
                            <Zap className="w-8 h-8 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black mb-1">Our Pick: <span className="text-gold-400 capitalize">{recommendedRegime} Regime</span></h2>
                            <p className="text-slate-300 text-sm"> Choosing this regime saves you <span className="font-bold text-white">₹{savings.toLocaleString('en-IN')}</span> in taxes.</p>
                        </div>
                    </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Old Regime Card */}
                    <Card
                        padding="lg"
                        className={`relative border-2 ${selectedRegime === 'old' ? 'border-gold-500 shadow-lg' : 'border-slate-100 opacity-80'}`}
                    >
                        {recommendedRegime === 'old' && (
                            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Best Choice
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-3">
                            <Shield className={`w-5 h-5 ${selectedRegime === 'old' ? 'text-gold-500' : 'text-slate-400'}`} />
                            Old Regime
                        </h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">With Deductions</p>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-medium text-slate-500">Gross Income</span>
                                <span className="text-xs font-bold text-slate-700">₹{oldRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-emerald-600">Deductions</span>
                                <span className="text-xs font-bold text-emerald-600">- ₹{oldRegime.totalDeductions.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-900">Taxable Income</span>
                                <span className="text-xs font-black text-slate-900">₹{oldRegime.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Tax</span>
                                <span className="text-2xl font-black text-slate-900">₹{oldRegime.finalTaxLiability.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <Button
                            variant={selectedRegime === 'old' ? 'primary' : 'ghost'}
                            fullWidth
                            onClick={() => handleSwitchRegime('old')}
                        >
                            {selectedRegime === 'old' ? 'Selected' : 'Switch to Old'}
                        </Button>
                    </Card>

                    {/* New Regime Card */}
                    <Card
                        padding="lg"
                        className={`relative border-2 ${selectedRegime === 'new' ? 'border-gold-500 shadow-lg' : 'border-slate-100 opacity-80'}`}
                    >
                        {recommendedRegime === 'new' && (
                            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Best Choice
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-3">
                            <Zap className={`w-5 h-5 ${selectedRegime === 'new' ? 'text-gold-500' : 'text-slate-400'}`} />
                            New Regime
                        </h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">No Deductions</p>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-medium text-slate-500">Gross Income</span>
                                <span className="text-xs font-bold text-slate-700">₹{newRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50 opacity-40">
                                <span className="text-xs font-bold italic text-slate-400">Deductions</span>
                                <span className="text-xs font-bold text-slate-400">₹0</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-900">Taxable Income</span>
                                <span className="text-xs font-black text-slate-900">₹{newRegime.totalIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Tax</span>
                                <span className="text-2xl font-black text-slate-900">₹{newRegime.finalTaxLiability.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <Button
                            variant={selectedRegime === 'new' ? 'primary' : 'ghost'}
                            fullWidth
                            onClick={() => handleSwitchRegime('new')}
                        >
                            {selectedRegime === 'new' ? 'Selected' : 'Switch to New'}
                        </Button>
                    </Card>
                </div>

                {/* Info Text */}
                <Card padding="lg" className="bg-slate-50/50">
                    <div className="flex gap-4">
                        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">Choosing your tax regime</h4>
                            <p className="text-slate-500 text-xs leading-relaxed">The Finance Act 2023 made the New Tax Regime the default choice. However, if you have significant investments like LIC, PPF, Home Loan Interest, or Health Insurance, the Old Regime might lead to zero tax even if your income is high.</p>
                        </div>
                    </div>
                </Card>

                {/* Proceed Button */}
                <Button
                    variant="primary"
                    fullWidth
                    size="large"
                    onClick={() => navigate(`/filing/${filingId}/tax-summary`)}
                >
                    Confirm & Proceed to Review
                    <Save className="w-4 h-4 ml-2" />
                </Button>
            </PageContent>
        </ReviewPage>
    );
};

export default RegimeComparison;
