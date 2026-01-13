// =====================================================
// ITR-3 BOOK PROFIT RECONCILIATION
// Convert net profit as per books to taxable income
// Manual adjustments for disallowances and exempt income
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const ITR3BookReconciliation = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        netProfitAsPerBooks: '',
        depreciationAsPerBooks: '',
        depreciationAsPerITAct: '',
        disallowances40: '',
        disallowances40A: '',
        disallowances43B: '',
        otherAdditions: '',
        exemptIncome: '',
        otherDeductions: '',
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

            // Pre-populate from existing data
            const reconciliation = data?.jsonPayload?.business?.reconciliation || {};
            setFormData({
                netProfitAsPerBooks: reconciliation.netProfitAsPerBooks || '',
                depreciationAsPerBooks: reconciliation.depreciationAsPerBooks || '',
                depreciationAsPerITAct: reconciliation.depreciationAsPerITAct || '',
                disallowances40: reconciliation.disallowances40 || '',
                disallowances40A: reconciliation.disallowances40A || '',
                disallowances43B: reconciliation.disallowances43B || '',
                otherAdditions: reconciliation.otherAdditions || '',
                exemptIncome: reconciliation.exemptIncome || '',
                otherDeductions: reconciliation.otherDeductions || '',
            });
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const reconciliationData = {
                netProfitAsPerBooks: parseFloat(formData.netProfitAsPerBooks) || 0,
                depreciationAsPerBooks: parseFloat(formData.depreciationAsPerBooks) || 0,
                depreciationAsPerITAct: parseFloat(formData.depreciationAsPerITAct) || 0,
                disallowances40: parseFloat(formData.disallowances40) || 0,
                disallowances40A: parseFloat(formData.disallowances40A) || 0,
                disallowances43B: parseFloat(formData.disallowances43B) || 0,
                otherAdditions: parseFloat(formData.otherAdditions) || 0,
                exemptIncome: parseFloat(formData.exemptIncome) || 0,
                otherDeductions: parseFloat(formData.otherDeductions) || 0,
                taxableIncome: calculateTaxableIncome(),
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    business: {
                        ...filing.jsonPayload?.business,
                        reconciliation: reconciliationData,
                    },
                },
            }, { headers });

            toast.success('Book reconciliation saved');
            navigate(`/filing/${filingId}/income-story`);
        } catch (error) {
            toast.error('Failed to save reconciliation');
        }
    };

    const calculateTaxableIncome = () => {
        const netProfit = parseFloat(formData.netProfitAsPerBooks) || 0;
        const depBooks = parseFloat(formData.depreciationAsPerBooks) || 0;
        const depIT = parseFloat(formData.depreciationAsPerITAct) || 0;
        const dis40 = parseFloat(formData.disallowances40) || 0;
        const dis40A = parseFloat(formData.disallowances40A) || 0;
        const dis43B = parseFloat(formData.disallowances43B) || 0;
        const otherAdd = parseFloat(formData.otherAdditions) || 0;
        const exempt = parseFloat(formData.exemptIncome) || 0;
        const otherDed = parseFloat(formData.otherDeductions) || 0;

        // Taxable Income = Net Profit + Depreciation (Books) - Depreciation (IT Act) + Disallowances - Exempt Income
        return netProfit + depBooks - depIT + dis40 + dis40A + dis43B + otherAdd - exempt - otherDed;
    };

    const taxableIncome = calculateTaxableIncome();

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
                            Book Profit Reconciliation
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Reconcile net profit as per books to taxable income as per IT Act.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="info"
                        message="Enter adjustments to convert book profit to taxable profit. Taxable income will be auto-calculated."
                    />
                </div>

                {/* Reconciliation Form */}
                <Card>
                    <div className="space-y-6">
                        {/* Starting Point */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Starting Point</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Net Profit as per Books
                                </label>
                                <input
                                    type="number"
                                    value={formData.netProfitAsPerBooks}
                                    onChange={(e) => setFormData({ ...formData, netProfitAsPerBooks: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Enter net profit from P&L"
                                />
                            </div>
                        </div>

                        {/* Add Back */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Back</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Depreciation as per Books
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.depreciationAsPerBooks}
                                        onChange={(e) => setFormData({ ...formData, depreciationAsPerBooks: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Disallowances u/s 40
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.disallowances40}
                                        onChange={(e) => setFormData({ ...formData, disallowances40: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Interest to partners, salary to partners"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Disallowances u/s 40A
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.disallowances40A}
                                        onChange={(e) => setFormData({ ...formData, disallowances40A: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Excessive payments, cash payments > ₹10,000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Disallowances u/s 43B
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.disallowances43B}
                                        onChange={(e) => setFormData({ ...formData, disallowances43B: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Unpaid statutory dues"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Other Additions
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.otherAdditions}
                                        onChange={(e) => setFormData({ ...formData, otherAdditions: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deduct */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Deduct</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Depreciation as per IT Act
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.depreciationAsPerITAct}
                                        onChange={(e) => setFormData({ ...formData, depreciationAsPerITAct: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="From depreciation schedule"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Exempt Income
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.exemptIncome}
                                        onChange={(e) => setFormData({ ...formData, exemptIncome: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Other Deductions
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.otherDeductions}
                                        onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Taxable Income Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Taxable Business Income</div>
                        <div className="text-3xl font-bold text-green-600">
                            ₹{taxableIncome.toLocaleString('en-IN')}
                        </div>
                    </div>
                    <FileText className="w-12 h-12 text-green-600 opacity-50" />
                </div>
                <div className="text-xs text-slate-500 mt-3">
                    This is the income that will be added to your total income for tax calculation
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate(`/filing/${filingId}/business/depreciation`)}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                    ← Back to Depreciation
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
};

export default ITR3BookReconciliation;
