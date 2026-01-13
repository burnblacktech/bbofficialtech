// =====================================================
// ITR-3 BUSINESS PROFILE
// First step in Professional Mode Core Schedules
// Captures Nature of Business, Audit Status, and Accounting Method
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    Save,
    ArrowLeft,
    ShieldCheck,
    AlertCircle,
    BookOpen,
    Scale,
    Check,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ITR3BusinessProfile = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        businessName: '',
        natureOfBusiness: '',
        accountingMethod: 'mercantile', // mercantile or cash
        auditApplicable: false,
        booksMaintained: true,
    });

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                const businessData = filing.jsonPayload?.income?.business || {};

                if (businessData) {
                    setForm(prev => ({
                        ...prev,
                        ...businessData.profile,
                    }));
                }
            } catch (err) {
                toast.error('Failed to load business profile');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    const handleSave = async () => {
        if (!form.businessName || !form.natureOfBusiness) {
            toast.error('Business name and nature are required for ITR-3.');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch current filing to merge
            const filingResponse = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filing = filingResponse.data.data || filingResponse.data;

            const updatedPayload = {
                ...filing.jsonPayload,
                income: {
                    ...filing.jsonPayload.income,
                    business: {
                        ...filing.jsonPayload.income.business,
                        profile: form,
                        intent: true,
                    },
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: updatedPayload,
            }, { headers });

            toast.success('Business profile saved.');
            navigate(`/filing/${filingId}/business/pl`);
        } catch (err) {
            toast.error('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Business Profile...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Income Story
                    </button>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase">
                        <Scale className="w-4 h-4" />
                        Professional Mode
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold font-serif">Business Profile</h1>
                                <p className="text-slate-400 text-sm">Step 1 of 4: Legal Identity & Accounting</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            {/* Business Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    value={form.businessName}
                                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                                    placeholder="e.g. Acme Consulting Services"
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>

                            {/* Nature of Business */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Nature of Business
                                </label>
                                <select
                                    value={form.natureOfBusiness}
                                    onChange={(e) => setForm({ ...form, natureOfBusiness: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all outline-none bg-white"
                                >
                                    <option value="">Select Category</option>
                                    <option value="software">Software / IT Services</option>
                                    <option value="consulting">Professional Consulting</option>
                                    <option value="trading">Retail / Trading</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="freelancing">Freelancing (Technical)</option>
                                    <option value="other">Other Business</option>
                                </select>
                            </div>
                        </div>

                        {/* Accounting Method */}
                        <div className="mb-10">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                                Method of Accounting
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setForm({ ...form, accountingMethod: 'mercantile' })}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${form.accountingMethod === 'mercantile' ? 'bg-primary-50 border-primary-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.accountingMethod === 'mercantile' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                                        {form.accountingMethod === 'mercantile' && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Mercantile</h4>
                                        <p className="text-xs text-slate-500 mt-1">Accrual-based. Recommended for businesses with receivables.</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, accountingMethod: 'cash' })}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${form.accountingMethod === 'cash' ? 'bg-primary-50 border-primary-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.accountingMethod === 'cash' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                                        {form.accountingMethod === 'cash' && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Cash Basis</h4>
                                        <p className="text-xs text-slate-500 mt-1">Recognize income only when cash is received.</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Special Checks */}
                        <div className="space-y-4 mb-10">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6 text-slate-400" />
                                    <div>
                                        <h5 className="font-bold text-slate-900">Is Tax Audit applicable?</h5>
                                        <p className="text-xs text-slate-500">Applicable if turnover exceeds ₹1 Cr (without digital push) or ₹10 Cr.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setForm({ ...form, auditApplicable: !form.auditApplicable })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${form.auditApplicable ? 'bg-primary-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.auditApplicable ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <BookOpen className="w-6 h-6 text-slate-400" />
                                    <div>
                                        <h5 className="font-bold text-slate-900">Books of accounts maintained?</h5>
                                        <p className="text-xs text-slate-500">Mandatory for ITR-3. If No, you should consider ITR-4.</p>
                                    </div>
                                </div>
                                <div
                                    className="w-14 h-8 rounded-full transition-all relative bg-primary-600 flex items-center px-1"
                                >
                                    <div className="w-6 h-6 bg-white rounded-full transition-all ml-auto" />
                                </div>
                            </div>
                        </div>

                        {/* Professional Support Guardrail */}
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mb-10 text-center">
                            <Scale className="w-4 h-4 mx-auto mb-2 text-primary-600" />
                            <p className="text-sm text-slate-500 font-medium">Overwhelmed by professional schedules? Pause & Export to a CA.</p>
                        </div>

                        {/* Guardrail Message */}
                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-10 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            <p className="text-sm text-blue-800 leading-relaxed">
                                Professional data entry requires precision. All information provided here will be cross-referenced with your <strong>Balance Sheet</strong> in the next steps.
                            </p>
                        </div>

                        {/* Action */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save & Continue to P&L'}
                            <Save className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-400 text-xs">
                    Guidance Note: ITR-3 requires <strong>one heavy section per screen</strong> to ensure legal accuracy.
                </p>
            </div>
        </div>
    );
};

export default ITR3BusinessProfile;
