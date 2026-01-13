// =====================================================
// TAX PAYMENT GATE - Screen 4 (S27)
// "Pay Remaining Tax (Required)"
// Manual challan capture for Self-Assessment Tax
// =====================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink, Info, Landmark, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { PageContent } from '../../components/Layout';
import { ReviewPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const TaxPaymentGate = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [payableAmount, setPayableAmount] = useState(0);
    const [showRedirectModal, setShowRedirectModal] = useState(false);

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

    if (loading) {

        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                <p className="text-[var(--s29-text-muted)] font-medium">Loading payment portal...</p>
            </div>
        );
    }

    return (
        <ReviewPage
            title="Pay Remaining Tax"
            subtitle={`Based on your income, you need to pay ₹${payableAmount.toLocaleString('en-IN')} before we can submit your return.`}
            onBack={() => navigate(`/filing/${filingId}/tax-breakdown`)}
            backLabel="Back to Breakdown"
        >
            <PageContent spacing="section">
                {/* Instructions */}
                <Card padding="lg" className="relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Landmark className="w-24 h-24" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Landmark className="w-4 h-4 text-gold-600" />
                        Payment Instructions
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: 1, text: 'Go to the Income Tax Department portal and pay under ', bold: 'Self-Assessment Tax (300)' },
                            { step: 2, text: 'Once paid, download the ', bold: 'Challan Receipt' },
                            { step: 3, text: 'Enter the BSR Code, Serial Number, and Date from the receipt below.' },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
                                    {item.step}
                                </div>
                                <p className="text-slate-500 leading-relaxed text-xs">
                                    {item.text}
                                    {item.bold && <strong className="text-slate-900">{item.bold}</strong>}.
                                </p>
                            </div>
                        ))}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setShowRedirectModal(true)}
                        >
                            Pay on Income Tax Website
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Card>

                {/* Challan Entry Form */}
                <Card padding="lg">
                    <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Enter Challan Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">BSR Code (7 digits)</label>
                                <span className={`text-[10px] font-bold ${challan.bsrCode.length === 7 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    {challan.bsrCode.length}/7
                                </span>
                            </div>
                            <input
                                type="text"
                                maxLength={7}
                                value={challan.bsrCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // Numeric only
                                    setChallan({ ...challan, bsrCode: val });
                                }}
                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm font-medium ${challan.bsrCode.length === 7 ? 'border-emerald-200 focus:ring-emerald-50' : 'border-slate-100 focus:ring-indigo-50 focus:border-indigo-500'}`}
                                placeholder="0210001"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Challan Serial Number</label>
                            <input
                                type="text"
                                value={challan.serialNumber}
                                onChange={(e) => setChallan({ ...challan, serialNumber: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                placeholder="12345"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date of Payment</label>
                            <input
                                type="date"
                                value={challan.dateOfPayment}
                                onChange={(e) => setChallan({ ...challan, dateOfPayment: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount Paid (₹)</label>
                            <input
                                type="number"
                                value={challan.amount}
                                onChange={(e) => setChallan({ ...challan, amount: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            Disclosure: This payment goes directly to the Income Tax Department. We do not handle your funds. Entering these details is legally required to verify your tax compliance before filing.
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        fullWidth
                        size="large"
                        className="mt-8"
                        onClick={handleSaveChallan}
                    >
                        Save & Confirm Payment
                        <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-center mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        Self-Assessment Tax • Code 300
                    </p>
                </Card>
            </PageContent>

            {/* Redirect Modal */}
            {showRedirectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl animate-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <ExternalLink className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Leaving Burnblack</h3>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            You’ll be taken to the official Income Tax portal in a new tab to complete your payment. This usually takes <span className="font-bold text-slate-900">5–7 minutes</span>.
                        </p>

                        <div className="space-y-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">What you'll need</h4>
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Internet Banking or Debit Card
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Bank Account Details
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                A few minutes of focus
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <a
                                href="https://eportal.incometax.gov.in/iec/foservices/#/login/e-pay-tax"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowRedirectModal(false)}
                                className="w-full bg-[var(--s29-primary)] text-white py-4 rounded-2xl font-bold text-center hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg"
                            >
                                Go to ITD Portal
                            </a>
                            <button
                                onClick={() => setShowRedirectModal(false)}
                                className="w-full py-4 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ReviewPage>
    );
};

export default TaxPaymentGate;
