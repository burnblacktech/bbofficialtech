// =====================================================
// SECTION 80C DETAILS
// Life Insurance, PPF, ELSS, EPF, NSC, Tuition Fees, etc.
// Max Limit: ₹ 1,50,000
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, ShieldCheck, Plus, Trash2, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card, CardContent } from '../../components/UI';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const investmentTypes = [
    { value: 'life_insurance', label: 'Life Insurance Premium' },
    { value: 'ppf', label: 'Public Provident Fund (PPF)' },
    { value: 'elss', label: 'ELSS Mutual Funds' },
    { value: 'epf', label: 'Employee Provident Fund (EPF)' },
    { value: 'nsc', label: 'National Savings Certificate (NSC)' },
    { value: 'house_loan_principal', label: 'Home Loan Principal Repayment' },
    { value: 'tuition_fees', label: 'Children\'s Tuition Fees' },
    { value: 'tax_saver_fd', label: '5-Year Tax Saver FD' },
    { value: 'ssy', label: 'Sukanya Samriddhi Yojana (SSY)' },
    { value: 'other', label: 'Other 80C Investments' },
];

const Section80CDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [investments, setInvestments] = useState([{
        id: Date.now(),
        type: 'life_insurance',
        description: '',
        amount: '',
    }]);

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

            const existingData = data.jsonPayload?.deductions?.section80C?.investments || [];
            if (existingData.length > 0) {
                setInvestments(existingData);
            }
        } catch (err) {
            toast.error('Failed to load investments');
        } finally {
            setLoading(false);
        }
    };

    const addInvestment = () => {
        setInvestments([...investments, {
            id: Date.now(),
            type: 'life_insurance',
            description: '',
            amount: '',
        }]);
    };

    const removeInvestment = (id) => {
        if (investments.length === 1) {
            toast.error('At least one investment entry is required');
            return;
        }
        setInvestments(investments.filter(i => i.id !== id));
    };

    const updateInvestment = (id, field, value) => {
        setInvestments(investments.map(i =>
            i.id === id ? { ...i, [field]: value } : i,
        ));
    };

    const totalAmount = investments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const cappedAmount = Math.min(totalAmount, 150000);

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    deductions: {
                        ...filing.jsonPayload?.deductions,
                        section80C: {
                            investments,
                            totalAmount: totalAmount,
                            deductibleAmount: cappedAmount,
                            complete: true,
                        },
                    },
                },
            }, { headers });

            toast.success('80C deductions saved successfully');
            navigate(`/filing/${filingId}/deductions`);
        } catch (error) {
            toast.error('Failed to save 80C deductions');
        }
    };

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600 animate-pulse">Loading...</div>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Section 80C Deductions</h1>
                    <p className="text-slate-600">Enter details of your investments and payments eligible under Section 80C.</p>
                </div>

                {/* Limit Visualizer */}
                <Card>
                    <CardContent>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Investments</p>
                                <p className="text-3xl font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Max Tax Deduction</p>
                                <p className="text-xl font-bold text-emerald-600">₹{cappedAmount.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${totalAmount > 150000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((totalAmount / 150000) * 100, 100)}%` }}
                            />
                        </div>
                        {totalAmount > 150000 && (
                            <p className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Amount exceeding ₹1.5L will not provide additional tax benefit.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Investments List */}
                <div className="space-y-4 mb-8">
                    {investments.map((investment, index) => (
                        <div key={investment.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center group">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                                    <select
                                        value={investment.type}
                                        onChange={(e) => updateInvestment(investment.id, 'type', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-700"
                                    >
                                        {investmentTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={investment.description}
                                        onChange={(e) => updateInvestment(investment.id, 'description', e.target.value)}
                                        placeholder="e.g. Life Insurance Policy #1"
                                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-700"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={investment.amount}
                                            onChange={(e) => updateInvestment(investment.id, 'amount', e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                            {investments.length > 1 && (
                                <button
                                    onClick={() => removeInvestment(investment.id)}
                                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end md:self-auto"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={addInvestment}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 mb-12"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Investment
                </button>

                {/* Footer Actions */}
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

export default Section80CDetails;
