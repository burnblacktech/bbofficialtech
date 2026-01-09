// =====================================================
// ITR-3 BALANCE SHEET (Professional Mode)
// Mandatory capture of Capital, Assets, and Liabilities
// Enforces the "Assets = Liabilities + Capital" equation
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Library,
    Save,
    ArrowLeft,
    Layers,
    Warehouse,
    Coins,
    ShieldCheck,
    Info,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ITR3BalanceSheet = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        capital: 0,
        liabilities: {
            securedLoans: 0,
            unsecuredLoans: 0,
            sundryCreditors: 0,
            otherLiabilities: 0,
        },
        assets: {
            fixedAssets: 0,
            auditInventories: 0,
            sundryDebtors: 0,
            cashInHand: 0,
            bankBalances: 0,
            otherAssets: 0,
        },
    });

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                const bsData = filing.jsonPayload?.income?.business?.balanceSheet;

                if (bsData) {
                    setForm(prev => ({
                        ...prev,
                        ...bsData,
                    }));
                }
            } catch (err) {
                toast.error('Failed to load Balance Sheet');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    const totalLiabilities = useMemo(() => {
        const libs = Object.values(form.liabilities).reduce((acc, val) => acc + Number(val), 0);
        return Number(form.capital) + libs;
    }, [form.capital, form.liabilities]);

    const totalAssets = useMemo(() => {
        return Object.values(form.assets).reduce((acc, val) => acc + Number(val), 0);
    }, [form.assets]);

    const isBalanced = Math.abs(totalLiabilities - totalAssets) < 1;

    const handleSave = async () => {
        if (!isBalanced) {
            toast.error('Balance Sheet does not match! Assets must equal Liabilities + Capital.');
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
                        balanceSheet: {
                            ...form,
                            totalAssets,
                            totalLiabilities,
                        },
                    },
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: updatedPayload,
            }, { headers });

            toast.success('Balance Sheet saved.');
            navigate(`/filing/${filingId}/income/business/al`);
        } catch (err) {
            toast.error('Failed to save Balance Sheet.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Balance Sheet...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income/business/pl`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to P&L
                    </button>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase">
                        <Library className="w-4 h-4" />
                        Financial Snapshot
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    {/* Status Header */}
                    <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Layers className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold font-serif">Balance Sheet</h1>
                                <p className="text-slate-400 text-sm">Step 3 of 4: Assets & Liabilities</p>
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Equities</p>
                                <p className="text-2xl font-bold font-serif">₹{totalLiabilities.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Assets</p>
                                <p className="text-2xl font-bold font-serif">₹{totalAssets.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                        {/* Liabilities & Capital Column */}
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Warehouse className="w-4 h-4" />
                                    Liabilities & Capital
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                        <label className="block text-sm font-bold text-primary-900">Capital Account / Equity</label>
                                        <input
                                            type="number"
                                            value={form.capital}
                                            onChange={(e) => setForm({ ...form, capital: e.target.value })}
                                            className="w-full bg-transparent text-xl font-bold font-mono outline-none border-b-2 border-slate-200 focus:border-primary-500 transition-all py-2"
                                            placeholder="0"
                                        />
                                    </div>

                                    {Object.keys(form.liabilities).map((key) => (
                                        <div key={key} className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </label>
                                            <input
                                                type="number"
                                                value={form.liabilities[key]}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    liabilities: { ...form.liabilities, [key]: e.target.value },
                                                })}
                                                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Assets Column */}
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Coins className="w-4 h-4" />
                                    Assets (Application of Funds)
                                </h3>

                                <div className="space-y-6">
                                    {Object.keys(form.assets).map((key) => (
                                        <div key={key} className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </label>
                                            <input
                                                type="number"
                                                value={form.assets[key]}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    assets: { ...form.assets, [key]: e.target.value },
                                                })}
                                                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Check Guardrail */}
                    <div className="mx-10 mb-10 p-8 rounded-[2rem] flex items-center justify-between border-2 transition-all shadow-inner overflow-hidden relative">
                        {isBalanced ? (
                            <div className="flex items-center gap-4 text-emerald-700">
                                <ShieldCheck className="w-8 h-8" />
                                <div>
                                    <p className="text-lg font-bold">Equation Balanced</p>
                                    <p className="text-sm opacity-80">Liabilities + Capital exactly match Assets. Legal integrity maintained.</p>
                                </div>
                                <div className="hidden lg:block absolute right-0 top-0 h-full w-32 bg-emerald-500 opacity-10 skew-x-[-20deg] translate-x-12" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 text-red-700">
                                <Info className="w-8 h-8" />
                                <div>
                                    <p className="text-lg font-bold">Unbalanced Balance Sheet</p>
                                    <p className="text-sm opacity-80">Difference: ₹{Math.abs(totalLiabilities - totalAssets).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="hidden lg:block absolute right-0 top-0 h-full w-32 bg-red-500 opacity-10 skew-x-[-20deg] translate-x-12" />
                            </div>
                        )}
                    </div>

                    {/* Professional Support Guardrail */}
                    <div className="mx-10 mb-10 p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                        <p className="text-sm text-slate-500 mb-4 font-medium">Overwhelmed by professional schedules?</p>
                        <button
                            onClick={() => navigate('/ca/marketplace')}
                            className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm bg-white px-6 py-3 rounded-xl border border-primary-100 hover:bg-primary-50 transition-all shadow-sm"
                        >
                            <Library className="w-4 h-4" />
                            Pause & Export to a CA
                        </button>
                    </div>

                    {/* Action Bar */}
                    <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest leading-none">Accounting Authority Lock</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || !isBalanced}
                            className={`px-12 py-5 rounded-2xl font-bold text-xl flex items-center gap-3 transition-all shadow-xl ${isBalanced ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            {saving ? 'Saving...' : 'Lock & Proceed to Final Assets'}
                            <Save className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center mt-8 text-slate-400 text-xs">
                Verified: Professional Filing Mechanism (S28) • ITR-3 Compliant
            </p>
        </div>
    );
};

export default ITR3BalanceSheet;
