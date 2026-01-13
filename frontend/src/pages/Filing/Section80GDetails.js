// =====================================================
// SECTION 80G DETAILS
// Donations to Charities, Relief Funds, etc.
// 100% and 50% Deduction Categories
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Gavel, Plus, Trash2, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const donationCategories = [
    { value: '100_no_limit', label: '100% Deduction (Without Qualifying Limit)' },
    { value: '50_no_limit', label: '50% Deduction (Without Qualifying Limit)' },
    { value: '100_with_limit', label: '100% Deduction (With Qualifying Limit)' },
    { value: '50_with_limit', label: '50% Deduction (With Qualifying Limit)' },
];

const Section80GDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [donations, setDonations] = useState([{
        id: Date.now(),
        doneeName: '',
        doneePAN: '',
        amount: '',
        category: '100_no_limit',
        address: '' }]);

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

            const existingData = data.jsonPayload?.deductions?.section80G?.donations || [];
            if (existingData.length > 0) {
                setDonations(existingData);
            }
        } catch (err) {
            toast.error('Failed to load donation details');
        } finally {
            setLoading(false);
        }
    };

    const addDonation = () => {
        setDonations([...donations, {
            id: Date.now(),
            doneeName: '',
            doneePAN: '',
            amount: '',
            category: '100_no_limit',
            address: '' }]);
    };

    const removeDonation = (id) => {
        if (donations.length === 1) {
            toast.error('At least one donation entry is required');
            return;
        }
        setDonations(donations.filter(d => d.id !== id));
    };

    const updateDonation = (id, field, value) => {
        setDonations(donations.map(d =>
            d.id === id ? { ...d, [field]: value } : d,
        ));
    };

    const calculateTotals = () => {
        return donations.reduce((acc, d) => {
            const amt = parseFloat(d.amount) || 0;
            switch (d.category) {
                case '100_no_limit': acc.deduction100NoLimit += amt; break;
                case '50_no_limit': acc.deduction50NoLimit += (amt * 0.5); break;
                // Qualifying limit calculations are usually handled by the backend engine
                // since they depend on Adjusted Gross Total Income (AGTI)
                case '100_with_limit': acc.deduction100WithLimit += amt; break;
                case '50_with_limit': acc.deduction50WithLimit += (amt * 0.5); break;
                default: break;
            }
            acc.totalDonated += amt;
            return acc;
        }, { totalDonated: 0, deduction100NoLimit: 0, deduction50NoLimit: 0, deduction100WithLimit: 0, deduction50WithLimit: 0 });
    };

    const handleSave = async () => {
        const { totalDonated } = calculateTotals();
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    deductions: {
                        ...filing.jsonPayload?.deductions,
                        section80G: {
                            donations,
                            totalAmount: totalDonated,
                            complete: true } } } }, { headers });

            toast.success('Donation details saved successfully');
            navigate(`/filing/${filingId}/deductions`);
        } catch (error) {
            toast.error('Failed to save donation details');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

    const { totalDonated } = calculateTotals();

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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Section 80G - Donations</h1>
                    <p className="text-slate-600">Enter details of donations made to approved charities and relief funds.</p>
                </div>

                {/* Summary */}
                <Card>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Donated</p>
                            <p className="text-4xl font-black text-blue-600">₹{totalDonated.toLocaleString('en-IN')}</p>
                        </div>
                        <Gavel className="w-12 h-12 text-blue-100" />
                    </div>
                    <div className="mt-6 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Cash donations above ₹2,000 are not eligible</span>
                    </div>
                </Card>

                {/* Donation Forms */}
                <div className="space-y-6 mb-8">
                    {donations.map((donation, index) => (
                        <div key={donation.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 border-b-4 border-blue-500 pb-1">Donation #{index + 1}</h3>
                                {donations.length > 1 && (
                                    <button onClick={() => removeDonation(donation.id)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name of Donee *</label>
                                    <input
                                        type="text"
                                        value={donation.doneeName}
                                        onChange={(e) => updateDonation(donation.id, 'doneeName', e.target.value)}
                                        placeholder="e.g. PM Relief Fund"
                                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Donee PAN *</label>
                                    <input
                                        type="text"
                                        value={donation.doneePAN}
                                        onChange={(e) => updateDonation(donation.id, 'doneePAN', e.target.value.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 tracking-widest uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Donation Category *</label>
                                    <select
                                        value={donation.category}
                                        onChange={(e) => updateDonation(donation.id, 'category', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                    >
                                        {donationCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Donated *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={donation.amount}
                                            onChange={(e) => updateDonation(donation.id, 'amount', e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address of Donee</label>
                                <textarea
                                    value={donation.address}
                                    onChange={(e) => updateDonation(donation.id, 'address', e.target.value)}
                                    placeholder="Full address of the charitable institution"
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addDonation}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 font-extrabold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 mb-12 uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    New Donation Entry
                </button>

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

export default Section80GDetails;
