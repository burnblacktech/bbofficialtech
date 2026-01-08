// =====================================================
// TAX PAYMENT GATE - Screen 4 (S27)
// "Pay Remaining Tax (Required)"
// Manual challan capture for Self-Assessment Tax
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink, Info, Landmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const TaxPaymentGate = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [payableAmount, setPayableAmount] = useState(0);

    const [challan, setChallan] = useState({
        bsrCode: '',
        serialNumber: '',
        dateOfPayment: '',
        amount: '',
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filingData = response.data.data;
            setFiling(filingData);

            // Fetch tax breakdown to get the exact payable amount
            const breakdownResponse = await axios.get(`${API_BASE_URL}/filings/${filingId}/tax-breakdown`, { headers });
            const breakdown = breakdownResponse.data.data;
            const netPayable = Math.abs(breakdown.steps.finalLiability.refundOrPayable);
            setPayableAmount(netPayable);

            // Auto-fill amount
            setChallan(prev => ({ ...prev, amount: netPayable.toString() }));
        } catch (err) {
            toast.error('Failed to load filing details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChallan = async () => {
        if (!challan.bsrCode || challan.bsrCode.length !== 7) {
            toast.error('BSR Code must be 7 digits');
            return;
        }
        if (!challan.serialNumber) {
            toast.error('Challan Serial Number is required');
            return;
        }
        if (!challan.dateOfPayment) {
            toast.error('Date of Payment is required');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const updatedPayload = {
                ...filing.jsonPayload,
                taxes: {
                    ...filing.jsonPayload?.taxes,
                    selfAssessment: [
                        ...(filing.jsonPayload?.taxes?.selfAssessment || []),
                        {
                            ...challan,
                            amount: parseFloat(challan.amount),
                            type: 'SAT',
                        },
                    ],
                },
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: updatedPayload,
            }, { headers });

            toast.success('Challan details saved successfully');
            navigate(`/filing/${filingId}/readiness`);
        } catch (error) {
            toast.error('Failed to save challan details');
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-breakdown`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Breakdown
                    </button>
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        Pay Remaining Tax (Required)
                    </h1>
                    <p className="text-slate-600">
                        Based on your income, you need to pay <span className="font-bold text-slate-900">₹{payableAmount.toLocaleString('en-IN')}</span> before submitting.
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-primary-600" />
                        How to pay
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                            <p className="text-slate-700">Go to the Income Tax Department portal and pay under <strong>Self-Assessment Tax (300)</strong>.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                            <p className="text-slate-700">Once paid, download the <strong>Challan Receipt</strong>.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                            <p className="text-slate-700">Enter the BSR Code, Serial Number, and Date from the receipt below.</p>
                        </div>

                        <a
                            href="https://eportal.incometax.gov.in/iec/foservices/#/login/e-pay-tax"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                        >
                            Pay on Income Tax Website
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Challan Entry Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Enter Challan Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">BSR Code (7 digits)</label>
                            <input
                                type="text"
                                maxLength={7}
                                value={challan.bsrCode}
                                onChange={(e) => setChallan({ ...challan, bsrCode: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="0210001"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Challan Serial Number</label>
                            <input
                                type="text"
                                value={challan.serialNumber}
                                onChange={(e) => setChallan({ ...challan, serialNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="12345"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Payment</label>
                            <input
                                type="date"
                                value={challan.dateOfPayment}
                                onChange={(e) => setChallan({ ...challan, dateOfPayment: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (₹)</label>
                            <input
                                type="number"
                                value={challan.amount}
                                onChange={(e) => setChallan({ ...challan, amount: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                            Disclosure: This payment goes directly to the Income Tax Department. We do not handle your money. Entering these details is legally required to prove you have paid your tax.
                        </p>
                    </div>

                    <button
                        onClick={handleSaveChallan}
                        className="mt-8 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-md"
                    >
                        <CheckCircle className="w-6 h-6" />
                        Save & Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaxPaymentGate;
