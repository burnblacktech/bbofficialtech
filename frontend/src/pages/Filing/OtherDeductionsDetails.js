// =====================================================
// OTHER DEDUCTIONS DETAILS
// 80E (Education), 80TTA/B (Savings Interest), 80CCD (NPS)
// 80EE/EEA (Home Loan), 80U (Disability), etc.
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, GraduationCap, Info, TrendingUp, Home, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const OtherDeductionsDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [formData, setFormData] = useState({
        section80E: '', // Education Loan
        section80TTA: '', // Savings Interest (Individual)
        section80TTB: '', // Savings Interest (Senior Citizen)
        section80CCD1B: '', // NPS (Additional 50k)
        section80EE: '', // Home Loan (Old)
        section80EEA: '', // Home Loan (New)
        section80U: '', // Self Disability
        section80DD: '', // Dependent Disability
        section80DDB: '', // Medical Treatment
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const data = response.data.data || response.data;
            setFiling(data);

            const existingData = data.jsonPayload?.deductions?.otherDeductions?.formData;
            if (existingData) {
                setFormData(existingData);
            }
        } catch (err) {
            toast.error('Failed to load deduction details');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return Object.values(formData).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    deductions: {
                        ...filing.jsonPayload?.deductions,
                        otherDeductions: {
                            formData,
                            totalAmount: calculateTotal(),
                            complete: true } } } }, { headers });

            toast.success('Other deductions saved successfully');
            navigate(`/filing/${filingId}/deductions`);
        } catch (error) {
            toast.error('Failed to save deductions');
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold">Loading...</div>;

    const sections = [
        { id: 'section80E', label: '80E - Education Loan Interest', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', info: 'No upper limit. Available for interest paid on loans for higher education of self, spouse, or children.' },
        { id: 'section80CCD1B', label: '80CCD(1B) - NPS Contribution', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', info: 'Additional deduction of up to ₹50,000 for contributions to NPS (Tier 1).' },
        { id: 'section80TTA', label: '80TTA - Interest on Savings A/c', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', info: 'Max ₹10,000 deduction on interest from savings accounts for individuals below 60 years.' },
        { id: 'section80TTB', label: '80TTB - Interest on Deposits (Seniors)', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', info: 'Max ₹50,000 deduction on interest from all deposits (Savings, FD, etc.) for senior citizens.' },
        { id: 'section80EEA', label: '80EEA - Home Loan Interest (New)', icon: Home, color: 'text-rose-600', bg: 'bg-rose-50', info: 'Up to ₹1.5 Lakh for interest on home loans for first-time buyers (Affordable Housing).' },
        { id: 'section80U', label: '80U - Self Disability', icon: User, color: 'text-amber-600', bg: 'bg-amber-50', info: 'Flat deduction for individuals with disabilities (₹75k for 40%+, ₹1.25L for 80%+).' },
    ];

  return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/deductions`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Deductions</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Other Tax Deductions</h1>
                    <p className="text-slate-600">Claim additional deductions for education, home loans, disabilities, and more.</p>
                </div>

                {/* Deductions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {sections.map((sec) => (
                        <div key={sec.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start gap-4 mb-6">
                                <div className={`w-12 h-12 ${sec.bg} ${sec.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                    <sec.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight mb-1">{sec.label}</h3>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{sec.info}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData[sec.id]}
                                    onChange={(e) => setFormData({ ...formData, [sec.id]: e.target.value })}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all font-black text-slate-700 text-lg"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Sections */}
                <div className="bg-emerald-900 rounded-3xl p-8 mb-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Wait, there's more?</h3>
                    <p className="text-emerald-100 text-sm mb-6 leading-relaxed">If you have other specific deductions like 80DD (Dependent Disability) or 80DDB (Medical Treatment), our experts will help you during the final review.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                            <label className="block text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">80DD - Dependent Disability</label>
                            <input
                                type="number"
                                value={formData.section80DD}
                                onChange={(e) => setFormData({ ...formData, section80DD: e.target.value })}
                                placeholder="Enter amount"
                                className="w-full bg-emerald-900/50 border-emerald-700 rounded-xl text-white font-bold p-3 outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                        </div>
                        <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                            <label className="block text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">80DDB - Medical Treatment</label>
                            <input
                                type="number"
                                value={formData.section80DDB}
                                onChange={(e) => setFormData({ ...formData, section80DDB: e.target.value })}
                                placeholder="Enter amount"
                                className="w-full bg-emerald-900/50 border-emerald-700 rounded-xl text-white font-bold p-3 outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/deductions`)}
                        className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save All Deductions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtherDeductionsDetails;
