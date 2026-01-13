// =====================================================
// ITR-3 ASSETS & LIABILITIES (AL)
// Final Disclosure Step in Professional Mode
// Handles Schedule AL for High-Net-Worth individuals and complex business cases
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Gem,
    Save,
    ArrowLeft,
    Home,
    Car,
    Landmark,
    CheckCircle2,
    Info,
    ShieldAlert,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const ITR3AssetsLiabilities = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        immovableAssets: {
            land: 0,
            building: 0,
        },
        movableAssets: {
            cashInHand: 0,
            jewellery: 0,
            vehicles: 0,
            yachts: 0, // Canonical schedule field
            insurancePolicies: 0,
        },
        liabilities: 0,
        complete: true,
    });

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                const alData = filing.jsonPayload?.income?.business?.assetsLiabilities;

                if (alData) {
                    setForm(prev => ({
                        ...prev,
                        ...alData,
                    }));
                }
            } catch (err) {
                toast.error('Failed to load Assets & Liabilities data');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    const handleSave = async () => {
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
                        assetsLiabilities: form,
                        complete: true, // Mark the whole business section as complete
                    },
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: updatedPayload,
            }, { headers });

            toast.success('Schedule AL saved. Business section complete.');
            navigate(`/filing/${filingId}/income-story`);
        } catch (err) {
            toast.error('Failed to save Schedule AL.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Schedule AL...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/business/bs`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Balance Sheet
                    </button>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase">
                        <Gem className="w-4 h-4" />
                        Final Disclosures
                    </div>
                </div>

                <Card>
                    <div className="bg-slate-900 p-8 text-white">
                        <h1 className="text-2xl font-bold font-serif mb-2">Schedule AL</h1>
                        <p className="text-slate-400 text-sm">Step 4 of 4: Assets & Liabilities at year-end</p>
                    </div>

                    <div className="p-10 space-y-12">
                        {/* Immovable Assets */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Immovable Assets (Cost Price)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Land</label>
                                    <input
                                        type="number"
                                        value={form.immovableAssets.land}
                                        onChange={(e) => setForm({ ...form, immovableAssets: { ...form.immovableAssets, land: e.target.value } })}
                                        className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Building</label>
                                    <input
                                        type="number"
                                        value={form.immovableAssets.building}
                                        onChange={(e) => setForm({ ...form, immovableAssets: { ...form.immovableAssets, building: e.target.value } })}
                                        className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Movable Assets */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                Movable Assets
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.keys(form.movableAssets).map((key) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </label>
                                        <input
                                            type="number"
                                            value={form.movableAssets[key]}
                                            onChange={(e) => setForm({
                                                ...form,
                                                movableAssets: { ...form.movableAssets, [key]: e.target.value },
                                            })}
                                            className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Liabilities */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Landmark className="w-4 h-4" />
                                Total Liabilities
                            </h3>
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                                <label className="block text-sm font-bold text-red-900 mb-2">Liabilities in relation to Assets</label>
                                <input
                                    type="number"
                                    value={form.liabilities}
                                    onChange={(e) => setForm({ ...form, liabilities: e.target.value })}
                                    className="w-full bg-white px-5 py-4 rounded-xl border border-red-200 focus:ring-4 focus:ring-red-100 transition-all font-bold font-mono text-xl text-red-900"
                                />
                            </div>
                        </section>

                        {/* Professional Support Guardrail */}
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                            <p className="text-sm text-slate-500 mb-4 font-medium">Overwhelmed by professional schedules?</p>
                            <button
                                onClick={() => navigate('/ca/marketplace')}
                                className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm bg-white px-6 py-3 rounded-xl border border-primary-100 hover:bg-primary-50 transition-all shadow-sm"
                            >
                                <Gem className="w-4 h-4" />
                                Pause & Export to a CA
                            </button>
                        </div>

                        {/* Guardrail */}
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 flex gap-6">
                            <ShieldAlert className="w-8 h-8 text-slate-400 flex-shrink-0" />
                            <div className="text-sm text-slate-600 leading-relaxed">
                                <p className="font-bold text-slate-900 mb-1">Legal Accountability</p>
                                Schedule AL is mandatory if your total income exceeds ₹50 Lakhs. Even if below, providing these details builds a stronger audit trail for your professional business.
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-10 py-10 bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Final Professional Lock</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary-600 text-white px-12 py-5 rounded-2xl font-bold text-xl flex items-center gap-3 hover:bg-primary-500 transition-all shadow-xl shadow-primary-900 active:scale-[0.98] animate-pulse-subtle"
                        >
                            {saving ? 'Saving...' : 'Complete Business Section'}
                            <CheckCircle2 className="w-6 h-6" />
                        </button>
                    </div>
                </Card>
            </div>

            <p className="text-center mt-8 text-slate-400 text-xs">
                Guided Professional Mode (ITR-3) • No Shortcuts Taken
            </p>
        </div>
    );
};

export default ITR3AssetsLiabilities;
