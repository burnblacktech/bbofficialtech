// =====================================================
// DEDUCTIONS OVERVIEW - Section VI-A Hub
// Guided entry for all eligible deductions
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, ArrowRight, ArrowLeft, Heart, GraduationCap, Gavel, Info, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const DeductionsOverview = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [data, setData] = useState({
        section80C: { total: 0, complete: false },
        section80D: { total: 0, complete: false },
        section80G: { total: 0, complete: false },
        otherDeductions: { total: 0, complete: false },
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filingData = response.data.data || response.data;
            setFiling(filingData);

            const deductions = filingData.jsonPayload?.deductions || {};
            setData({
                section80C: {
                    total: deductions.section80C?.totalAmount || 0,
                    complete: deductions.section80C?.complete || false,
                },
                section80D: {
                    total: deductions.section80D?.totalAmount || 0,
                    complete: deductions.section80D?.complete || false,
                },
                section80G: {
                    total: deductions.section80G?.totalAmount || 0,
                    complete: deductions.section80G?.complete || false,
                },
                otherDeductions: {
                    total: deductions.otherDeductions?.totalAmount || 0,
                    complete: deductions.otherDeductions?.complete || false,
                },
            });
        } catch (err) {
            toast.error('Failed to load deductions overview');
        } finally {
            setLoading(false);
        }
    };

    const deductionCards = [
        {
            id: '80c',
            title: 'Section 80C',
            description: 'Life insurance, PPF, ELSS, School fees, etc.',
            icon: ShieldCheck,
            color: 'emerald',
            path: `/filing/${filingId}/deductions/80c`,
            total: data.section80C.total,
            complete: data.section80C.complete,
            limit: '₹ 1,50,000',
        },
        {
            id: '80d',
            title: 'Section 80D',
            description: 'Health Insurance & Preventive Checkups',
            icon: Heart,
            color: 'rose',
            path: `/filing/${filingId}/deductions/80d`,
            total: data.section80D.total,
            complete: data.section80D.complete,
            limit: 'Varies',
        },
        {
            id: '80g',
            title: 'Section 80G',
            description: 'Donations to Charities & Relief Funds',
            icon: Gavel,
            color: 'blue',
            path: `/filing/${filingId}/deductions/80g`,
            total: data.section80G.total,
            complete: data.section80G.complete,
            limit: 'No Limit',
        },
        {
            id: 'other',
            title: 'Other Deductions',
            description: 'Education Loan (80E), Savings Interest (80TTA), etc.',
            icon: GraduationCap,
            color: 'teal',
            path: `/filing/${filingId}/deductions/other`,
            total: data.otherDeductions.total,
            complete: data.otherDeductions.complete,
            limit: 'Varies',
        },
    ];

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600 animate-pulse font-medium">Loading deductions...</div>
            </div>
        );
    }

    const totalDeductions = data.section80C.total + data.section80D.total + data.section80G.total + data.otherDeductions.total;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Overview</span>
                    </button>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Maximise Your Savings</h1>
                    <p className="text-lg text-slate-600">Claim all eligible deductions under Section VI-A to reduce your taxable income.</p>
                </header>

                {/* Summary Card */}
                <Card>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Deductions Claimed</p>
                            <h2 className="text-5xl font-extrabold text-slate-900">₹{totalDeductions.toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Tax Benefit Estimate</p>
                                <p className="text-xl font-bold text-emerald-700">₹{(totalDeductions * 0.2).toLocaleString('en-IN')}*</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Info Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
                    <Info className="w-5 h-5 text-amber-600" />
                    <div>
                        <h4 className="font-bold text-amber-900 mb-1">Filing in New Tax Regime?</h4>
                        <p className="text-sm text-amber-800 leading-relaxed">Most deductions under Section VI-A are <strong>not available</strong> in the New Tax Regime. If you plan to switch, you'll see the comparison at the end.</p>
                    </div>
                </div>

                {/* Deduction Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {deductionCards.map((card) => (
                        <div
                            key={card.id}
                            onClick={() => navigate(card.path)}
                            className="bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {card.complete && (
                                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}

                            <div className={`w-14 h-14 bg-${card.color}-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <card.icon className={`w-7 h-7 text-${card.color}-600`} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">{card.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Amount Claimed</p>
                                    <p className={`font-bold ${card.total > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        ₹{card.total.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Max Limit</p>
                                    <p className="text-xs font-bold text-slate-500">{card.limit}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Proceed Button */}
                <button
                    onClick={() => navigate(`/filing/${filingId}/tax-summary`)}
                    className="w-full py-6 bg-slate-900 text-white rounded-3xl font-bold text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 active:scale-[0.98]"
                >
                    Review Final Computation
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default DeductionsOverview;
