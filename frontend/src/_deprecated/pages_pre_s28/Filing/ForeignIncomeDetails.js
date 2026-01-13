/* eslint-disable no-alert */
/* eslint-disable camelcase */
// =====================================================
// FOREIGN INCOME DETAILS - ITR-2
// Foreign income entry with DTAA support
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Plus, Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ForeignIncomeDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [formData, setFormData] = useState({
        country: '',
        incomeType: 'salary',
        amount: '',
        exchangeRate: '',
        amountINR: '',
        taxPaidAbroad: '',
        dtaaApplicable: false,
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            setFiling(response.data.data || response.data);
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const foreignIncomes = filing?.jsonPayload?.income?.foreign || [];

    const handleAddIncome = () => {
        setFormData({
            country: '',
            incomeType: 'salary',
            amount: '',
            exchangeRate: '',
            amountINR: '',
            taxPaidAbroad: '',
            dtaaApplicable: false,
        });
        setEditingIncome(null);
        setShowAddModal(true);
    };

    const handleEditIncome = (income, index) => {
        setFormData({
            country: income.country || '',
            incomeType: income.incomeType || 'salary',
            amount: income.amount || '',
            exchangeRate: income.exchangeRate || '',
            amountINR: income.amountINR || '',
            taxPaidAbroad: income.taxPaidAbroad || '',
            dtaaApplicable: income.dtaaApplicable || false,
        });
        setEditingIncome(index);
        setShowAddModal(true);
    };

    const handleSaveIncome = async () => {
        if (!formData.country || !formData.amountINR) {
            toast.error('Please fill country and amount in INR');
            return;
        }

        try {
            const updatedIncomes = [...foreignIncomes];
            const incomeData = {
                country: formData.country,
                incomeType: formData.incomeType,
                amount: formData.amount ? parseFloat(formData.amount) : 0,
                exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : 1,
                amountINR: formData.amountINR ? parseFloat(formData.amountINR) : 0,
                taxPaidAbroad: formData.taxPaidAbroad ? parseFloat(formData.taxPaidAbroad) : 0,
                dtaaApplicable: formData.dtaaApplicable,
            };

            if (editingIncome !== null) {
                updatedIncomes[editingIncome] = incomeData;
            } else {
                updatedIncomes.push(incomeData);
            }

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        foreign: updatedIncomes,
                    },
                },
            }, { headers });

            toast.success(editingIncome !== null ? 'Foreign income updated' : 'Foreign income added');
            setShowAddModal(false);
            fetchFiling();
        } catch (error) {
            toast.error('Failed to save foreign income');
        }
    };

    const handleDeleteIncome = async (index) => {
        if (!window.confirm('Remove this foreign income?')) return;

        try {
            const updatedIncomes = foreignIncomes.filter((_, i) => i !== index);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        foreign: updatedIncomes,
                    },
                },
            }, { headers });

            toast.success('Foreign income removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove foreign income');
        }
    };

    const getIncomeTypeLabel = (type) => {
        // eslint-disable-next-line camelcase
        const labels = {
            salary: 'Salary',
            business: 'Business',
            capital_gains: 'Capital Gains',
            other: 'Other',
        };
        return labels[type] || type;
    };

    const calculateINR = () => {
        const amount = parseFloat(formData.amount) || 0;
        const rate = parseFloat(formData.exchangeRate) || 0;
        const inr = amount * rate;
        setFormData({ ...formData, amountINR: inr.toFixed(2) });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Foreign Income
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us about income earned from foreign sources.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="info"
                        message="Foreign income must be reported in India. DTAA (Double Taxation Avoidance Agreement) may provide tax relief."
                    />
                </div>

                {/* Foreign Incomes List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Your foreign income sources
                    </h2>

                    {foreignIncomes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No foreign income added yet</p>
                            <p className="text-sm mt-1">Click "Add foreign income" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {foreignIncomes.map((income, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium text-slate-900">{income.country}</h3>
                                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                    {getIncomeTypeLabel(income.incomeType)}
                                                </span>
                                                {income.dtaaApplicable && (
                                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                                        DTAA
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Amount (INR):</span>
                                                    <span className="ml-2 font-medium">
                                                        ₹{(income.amountINR || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Tax Paid Abroad:</span>
                                                    <span className="ml-2 font-medium">
                                                        ₹{(income.taxPaidAbroad || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditIncome(income, index)}
                                                className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteIncome(index)}
                                                className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddIncome}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add foreign income
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>

                {/* Add/Edit Foreign Income Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingIncome !== null ? 'Edit Foreign Income' : 'Add Foreign Income'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Country */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Country *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., United States"
                                    />
                                </div>

                                {/* Income Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Income Type *
                                    </label>
                                    <select
                                        value={formData.incomeType}
                                        onChange={(e) => setFormData({ ...formData, incomeType: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="salary">Salary</option>
                                        <option value="business">Business</option>
                                        <option value="capital_gains">Capital Gains</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Amount in Foreign Currency */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Amount (Foreign Currency)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 50000"
                                    />
                                </div>

                                {/* Exchange Rate */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Exchange Rate (to INR)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.exchangeRate}
                                            onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="e.g., 83.50"
                                        />
                                        <button
                                            onClick={calculateINR}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                        >
                                            Calculate
                                        </button>
                                    </div>
                                </div>

                                {/* Amount in INR */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Amount in INR *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amountINR}
                                        onChange={(e) => setFormData({ ...formData, amountINR: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 4175000"
                                    />
                                </div>

                                {/* Tax Paid Abroad */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tax Paid Abroad (in INR)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.taxPaidAbroad}
                                        onChange={(e) => setFormData({ ...formData, taxPaidAbroad: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 830000"
                                    />
                                </div>

                                {/* DTAA Applicable */}
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.dtaaApplicable}
                                            onChange={(e) => setFormData({ ...formData, dtaaApplicable: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">
                                            DTAA (Double Taxation Avoidance Agreement) Applicable
                                        </span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1 ml-6">
                                        Check if India has a tax treaty with this country
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveIncome}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    {editingIncome !== null ? 'Update' : 'Add Income'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForeignIncomeDetails;
