// =====================================================
// ADD PRESUMPTIVE INCOME (44AD / 44ADA)
// Multi-section form with auto-calculation
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft, Save, Info, Calculator, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const AddPresumptiveIncome = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'business'; // 'business' (44AD) or 'professional' (44ADA)

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        grossReceipts: '',
        presumptiveIncome: '',
    });

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                const existing = filing.jsonPayload?.income?.presumptive?.[type === 'business' ? 'business' : 'professional'];

                if (existing) {
                    setFormData({
                        name: existing.businessName || existing.professionName || '',
                        grossReceipts: existing.grossReceipts || '',
                        presumptiveIncome: existing.presumptiveIncome || '',
                    });
                }
            } catch (err) {
                toast.error('Failed to load details');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId, type]);

    const handleReceiptsChange = (e) => {
        const val = e.target.value;
        const receipts = parseFloat(val) || 0;

        // Auto-calculate logic
        let calculated = 0;
        if (type === 'business') {
            calculated = Math.round(receipts * 0.06); // Default 6% for 44AD (digital)
        } else {
            calculated = Math.round(receipts * 0.50); // Default 50% for 44ADA
        }

        setFormData(prev => ({
            ...prev,
            grossReceipts: val,
            presumptiveIncome: calculated || '',
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.grossReceipts || !formData.presumptiveIncome) {
            toast.error('Please fill all mandatory fields');
            return;
        }

        const receipts = parseFloat(formData.grossReceipts);
        const income = parseFloat(formData.presumptiveIncome);

        // Validation against minimums
        if (type === 'professional' && income < receipts * 0.50) {
            if (!window.confirm('Your declared income is less than 50% of receipts. This may require an audit. Proceed anyway?')) {
                return;
            }
        }
        if (type === 'business' && income < receipts * 0.06) {
            if (!window.confirm('Your declared income is less than 6% of receipts. This may require an audit. Proceed anyway?')) {
                return;
            }
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Get current filing
            const res = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filing = res.data.data || res.data;

            const sectionKey = type === 'business' ? 'business' : 'professional';
            const payload = {
                ...filing.jsonPayload,
                income: {
                    ...filing.jsonPayload.income,
                    presumptive: {
                        ...(filing.jsonPayload.income.presumptive || {}),
                        [sectionKey]: {
                            [type === 'business' ? 'businessName' : 'professionName']: formData.name,
                            grossReceipts: receipts,
                            presumptiveIncome: income,
                            complete: true,
                        },
                    },
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, { jsonPayload: payload }, { headers });

            toast.success(`${type === 'business' ? 'Business' : 'Professional'} details saved`);
            navigate(`/filing/${filingId}/income/presumptive`);
        } catch (err) {
            toast.error('Failed to save details');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    const isBusiness = type === 'business';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(`/filing/${filingId}/income/presumptive`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className={`${isBusiness ? 'bg-orange-600' : 'bg-blue-600'} p-8 text-white`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isBusiness ? 'Small Business Income' : 'Professional Income'}
                                </h1>
                                <p className="text-white/80 text-sm">Section {isBusiness ? '44AD' : '44ADA'}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-4">
                            <Info className="w-6 h-6 text-primary-600 flex-shrink-0" />
                            <p className="text-sm text-primary-800 leading-relaxed">
                                Under this scheme, you don't need to maintain complex accounting books.
                                We'll calculate your income automatically based on your total receipts.
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {isBusiness ? 'Name of Business' : 'Name of Profession'}
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={isBusiness ? 'e.g., Sharma General Store' : 'e.g., Software Consulting'}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Gross Receipts */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Total Gross Receipts (Turnover)
                            </label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData.grossReceipts}
                                    onChange={handleReceiptsChange}
                                    placeholder="0"
                                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all font-mono font-bold text-lg"
                                    required
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Total money received during the financial year.</p>
                        </div>

                        {/* Presumptive Income */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Net Taxable Income
                                </label>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Calculator className="w-3 h-3" />
                                    Auto-calculated
                                </span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData.presumptiveIncome}
                                    onChange={(e) => setFormData({ ...formData, presumptiveIncome: e.target.value })}
                                    className="w-full pl-10 pr-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none transition-all font-mono font-bold text-lg text-emerald-900"
                                    required
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                {isBusiness
                                    ? 'Defaulted to 6% of receipts (digital payments). You can increase this if actual profit is higher.'
                                    : 'Minimum 50% of your gross receipts is required for this scheme.'}
                            </p>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full py-5 rounded-2xl font-bold text-xl text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isBusiness ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        Save Details
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white flex gap-6 items-center">
                    <Shield className="w-12 h-12 text-primary-400 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold mb-1">Tax-Saving Tip</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Under the {isBusiness ? '44AD' : '44ADA'} scheme, you don't need to save every single bill.
                            The government accepts your declared profit as long as it meets the minimum threshold.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPresumptiveIncome;
