// =====================================================
// ITR-3 PROFIT & LOSS (Professional Mode)
// Captures Business Income vs Expenses
// Truth-first data entry with no machine interference
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calculator,
    Save,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    PlusCircle,
    Info,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ITR3ProfitLoss = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        grossReceipts: 0,
        otherIncome: 0,
        expenses: {
            rent: 0,
            salary: 0,
            professionalFees: 0,
            marketing: 0,
            travel: 0,
            other: 0,
        },
        userDeclaredNetProfit: 0,
    });

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                const plData = filing.jsonPayload?.income?.business?.profitLoss;

                if (plData) {
                    setForm(prev => ({
                        ...prev,
                        ...plData,
                    }));
                }
            } catch (err) {
                toast.error('Failed to load P&L data');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    const computedNetProfit = useMemo(() => {
        const totalIncome = Number(form.grossReceipts) + Number(form.otherIncome);
        const totalExpenses = Object.values(form.expenses).reduce((acc, val) => acc + Number(val), 0);
        return totalIncome - totalExpenses;
    }, [form]);

    const handleSave = async () => {
        if (Math.abs(computedNetProfit - Number(form.userDeclaredNetProfit)) > 10) {
            toast.error('Your declared net profit does not match the computed values. Please reconcile.');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const filingResponse = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filing = filingResponse.data.data || filingResponse.data;

            const updatedPayload = {
                ...filing.jsonPayload,
                income: {
                    ...filing.jsonPayload.income,
                    business: {
                        ...filing.jsonPayload.income.business,
                        profitLoss: {
                            ...form,
                            computedNetProfit,
                        },
                    },
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: updatedPayload,
            }, { headers });

            toast.success('Profit & Loss saved.');
            navigate(`/filing/${filingId}/income/business/bs`);
        } catch (err) {
            toast.error('Failed to save P&L.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading P&L Schedule...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income/business`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Business Profile
                    </button>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase">
                        <Calculator className="w-4 h-4" />
                        Professional P&L
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
                    {/* Status Bar */}
                    <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold font-serif">Profit & Loss Statement</h1>
                                <p className="text-slate-400 text-sm">Step 2 of 4: Recording Financial Results</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Computed Net Profit</p>
                            <p className={`text-2xl font-bold font-serif ${computedNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ₹{computedNetProfit.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Income Column */}
                        <div className="space-y-8">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" />
                                Revenue Sources
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Gross Receipts / Turnover</label>
                                    <input
                                        type="number"
                                        value={form.grossReceipts}
                                        onChange={(e) => setForm({ ...form, grossReceipts: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-mono text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Other Business Income</label>
                                    <input
                                        type="number"
                                        value={form.otherIncome}
                                        onChange={(e) => setForm({ ...form, otherIncome: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-mono text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Expense Column */}
                        <div className="space-y-8">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                Operational Expenses
                            </h3>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(form.expenses).map((key) => (
                                    <div key={key} className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </label>
                                        <input
                                            type="number"
                                            value={form.expenses[key]}
                                            onChange={(e) => setForm({
                                                ...form,
                                                expenses: { ...form.expenses, [key]: e.target.value },
                                            })}
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reconciliation (The PM's Responsibility Check) */}
                    <div className="mx-8 mb-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    Final Reconciliation
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    To ensure truth, you must manually confirm the Net Profit from your books. We will not "guess" this value for you.
                                </p>
                            </div>
                            <div className="w-full md:w-64 space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                                    I declare Net Profit as:
                                </label>
                                <input
                                    type="number"
                                    value={form.userDeclaredNetProfit}
                                    onChange={(e) => setForm({ ...form, userDeclaredNetProfit: e.target.value })}
                                    placeholder="Enter final profit"
                                    className={`w-full px-6 py-5 rounded-2xl border-2 transition-all text-center text-xl font-bold font-mono ${Math.abs(computedNetProfit - Number(form.userDeclaredNetProfit)) < 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-white text-red-900 focus:border-red-400'}`}
                                />
                            </div>
                        </div>
                        {Math.abs(computedNetProfit - Number(form.userDeclaredNetProfit)) > 10 && (
                            <div className="mt-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
                                <AlertTriangle className="w-5 h-5" />
                                <span>Mismatch: Your declared profit differs from the computed (Income - Expenses) total.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Professional Support Guardrail */}
                <div className="mx-auto max-w-2xl mb-8 p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <p className="text-sm text-slate-500 mb-4 font-medium">Overwhelmed by professional schedules?</p>
                    <button
                        onClick={() => navigate('/ca/marketplace')}
                        className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm bg-white px-6 py-3 rounded-xl border border-primary-100 hover:bg-primary-50 transition-all shadow-sm"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Pause & Export to a CA
                    </button>
                </div>

                {/* Action Bar */}
                <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-widest">Section Legally Required</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all ${Math.abs(computedNetProfit - Number(form.userDeclaredNetProfit)) < 1 ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {saving ? 'Saving...' : 'Confirm & Proceed to Balance Sheet'}
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ITR3ProfitLoss;
