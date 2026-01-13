// =====================================================
// SECTION 80D DETAILS
// Health Insurance, Preventive Checkups, Medical Expenditure
// Includes Self, Family, and Parents (Senior Citizen logic)
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Heart, Info, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const Section80DDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [formData, setFormData] = useState({
        selfFamily: {
            insurance: '',
            preventiveCheckup: '',
            isSeniorCitizen: false,
            medicalExpenditure: '', // Only if senior citizen & no insurance
        },
        parents: {
            applicable: false,
            insurance: '',
            preventiveCheckup: '',
            isSeniorCitizen: false,
            medicalExpenditure: '', // Only if senior citizen & no insurance
        },
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

            const existingData = data.jsonPayload?.deductions?.section80D;
            if (existingData) {
                setFormData(existingData.formData || formData);
            }
        } catch (err) {
            toast.error('Failed to load health insurance details');
        } finally {
            setLoading(false);
        }
    };

    const calculate80D = () => {
        // Self/Family Limit: 25k (Non-Senior), 50k (Senior)
        const selfLimit = formData.selfFamily.isSeniorCitizen ? 50000 : 25000;
        const selfInsurance = parseFloat(formData.selfFamily.insurance) || 0;
        const selfCheckup = parseFloat(formData.selfFamily.preventiveCheckup) || 0;
        const selfMedical = formData.selfFamily.isSeniorCitizen ? (parseFloat(formData.selfFamily.medicalExpenditure) || 0) : 0;

        // Preventive checkup total limit is 5k (shared with parents)
        // For simplicity, we cap individual sections here
        const selfTotal = Math.min(selfInsurance + selfCheckup + selfMedical, selfLimit);

        // Parents Limit: 25k (Non-Senior), 50k (Senior)
        let parentsTotal = 0;
        if (formData.parents.applicable) {
            const parentsLimit = formData.parents.isSeniorCitizen ? 50000 : 25000;
            const parentsInsurance = parseFloat(formData.parents.insurance) || 0;
            const parentsCheckup = parseFloat(formData.parents.preventiveCheckup) || 0;
            const parentsMedical = formData.parents.isSeniorCitizen ? (parseFloat(formData.parents.medicalExpenditure) || 0) : 0;
            parentsTotal = Math.min(parentsInsurance + parentsCheckup + parentsMedical, parentsLimit);
        }

        // Cap total preventive checkup at 5,000 across both
        const totalCheckup = (parseFloat(formData.selfFamily.preventiveCheckup) || 0) +
            (formData.parents.applicable ? (parseFloat(formData.parents.preventiveCheckup) || 0) : 0);

        let finalDeduction = selfTotal + parentsTotal;
        if (totalCheckup > 5000) {
            finalDeduction -= (totalCheckup - 5000);
        }

        return {
            selfTotal,
            parentsTotal,
            totalDeduction: Math.max(finalDeduction, 0),
        };
    };

    const handleSave = async () => {
        const { totalDeduction } = calculate80D();
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    deductions: {
                        ...filing.jsonPayload?.deductions,
                        section80D: {
                            formData,
                            totalAmount: totalDeduction,
                            complete: true,
                        },
                    },
                },
            }, { headers });

            toast.success('80D deductions saved successfully');
            navigate(`/filing/${filingId}/deductions`);
        } catch (error) {
            toast.error('Failed to save 80D deductions');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const { selfTotal, parentsTotal, totalDeduction } = calculate80D();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Section 80D - Health Insurance</h1>
                    <p className="text-slate-600">Claim deductions for medical insurance premiums and preventive health checkups.</p>
                </div>

                {/* Summary Box */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total 80D Deduction</p>
                            <p className="text-4xl font-black text-emerald-600">₹{totalDeduction.toLocaleString('en-IN')}</p>
                        </div>
                        <Heart className="w-12 h-12 text-rose-100" />
                    </div>
                </div>

                {/* Self, Spouse & Dependent Children */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                            <Heart className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Self, Spouse & Children</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <input
                                type="checkbox"
                                checked={formData.selfFamily.isSeniorCitizen}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    selfFamily: { ...formData.selfFamily, isSeniorCitizen: e.target.checked },
                                })}
                                className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500 border-slate-300"
                            />
                            <label className="text-sm font-bold text-slate-700">Includes a Senior Citizen (Age 60+)</label>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Health Insurance Premium</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData.selfFamily.insurance}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        selfFamily: { ...formData.selfFamily, insurance: e.target.value },
                                    })}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preventive Health Checkup</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData.selfFamily.preventiveCheckup}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        selfFamily: { ...formData.selfFamily, preventiveCheckup: e.target.value },
                                    })}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-tighter">Max ₹5,000 shared across all members</p>
                        </div>

                        {formData.selfFamily.isSeniorCitizen && (
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Medical Expenditure</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={formData.selfFamily.medicalExpenditure}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            selfFamily: { ...formData.selfFamily, medicalExpenditure: e.target.value },
                                        })}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight uppercase tracking-tighter">Only for senior citizens with no health insurance coverage</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Parents Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Parents</h2>
                        </div>
                        <button
                            onClick={() => setFormData({
                                ...formData,
                                parents: { ...formData.parents, applicable: !formData.parents.applicable },
                            })}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${formData.parents.applicable ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
                        >
                            {formData.parents.applicable ? 'Remove Section' : 'Add Parents Section'}
                        </button>
                    </div>

                    {formData.parents.applicable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    checked={formData.parents.isSeniorCitizen}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        parents: { ...formData.parents, isSeniorCitizen: e.target.checked },
                                    })}
                                    className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <label className="text-sm font-bold text-slate-700">Either Parent is a Senior Citizen (Age 60+)</label>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Health Insurance Premium</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={formData.parents.insurance}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            parents: { ...formData.parents, insurance: e.target.value },
                                        })}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preventive Health Checkup</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={formData.parents.preventiveCheckup}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            parents: { ...formData.parents, preventiveCheckup: e.target.value },
                                        })}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            {formData.parents.isSeniorCitizen && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Medical Expenditure</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={formData.parents.medicalExpenditure}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                parents: { ...formData.parents, medicalExpenditure: e.target.value },
                                            })}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                        Save Deductions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Section80DDetails;
