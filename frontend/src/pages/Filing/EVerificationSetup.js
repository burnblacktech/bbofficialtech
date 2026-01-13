// =====================================================
// E-VERIFICATION SETUP
// Selection of verification method (Aadhaar, Net Banking, etc.)
// =====================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Smartphone, Landmark, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const EVerificationSetup = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [selectedMethod, setSelectedMethod] = useState('aadhaar');

    const methods = [
        {
            id: 'aadhaar',
            title: 'Aadhaar OTP',
            description: 'OTP will be sent to your Aadhaar-linked mobile number',
            icon: Smartphone,
            color: 'text-blue-600',
            bg: 'bg-blue-50' },
        {
            id: 'net_banking',
            title: 'Net Banking',
            description: 'Verify by logging into your bank account',
            icon: Landmark,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50' },
        {
            id: 'dsc',
            title: 'Digital Signature (DSC)',
            description: 'Use your registered DSC to sign the return',
            icon: ShieldCheck,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50' },
        {
            id: 'later',
            title: 'Verify Later',
            description: 'Complete filing now, verify within 30 days',
            icon: Clock,
            color: 'text-slate-600',
            bg: 'bg-slate-50' },
    ];

    const handleProceed = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                verificationMethod: selectedMethod }, { headers });

            toast.success('Verification method selected');
            navigate(`/filing/${filingId}/submit`);
        } catch (error) {
            toast.error('Failed to save selection');
        }
    };

  return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <header className="mb-12">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/readiness`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Preview</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">How would you like to verify?</h1>
                    <p className="text-slate-600">The Income Tax Department requires you to verify your return to complete the filing.</p>
                </header>

                <div className="grid grid-cols-1 gap-4 mb-12">
                    {methods.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6 ${selectedMethod === method.id ? 'bg-white border-indigo-600 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 opacity-70 hover:opacity-100 hover:border-slate-200'}`}
                        >
                            <div className={`w-14 h-14 ${method.bg} ${method.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                <method.icon className="w-7 h-7" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold text-slate-900">{method.title}</h3>
                                <p className="text-sm text-slate-500">{method.description}</p>
                            </div>
                            {selectedMethod === method.id && (
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl mb-12 text-center">
                    <h3 className="text-xl font-bold mb-2 uppercase tracking-widest text-indigo-300">Fastest Method</h3>
                    <p className="text-indigo-100 text-sm">99% of our users prefer <span className="font-bold text-white">Aadhaar OTP</span> for instant verification.</p>
                </div>

                <button
                    onClick={handleProceed}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                >
                    Confirm & Final Submission
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
            </div>
        </div>
    );
};

export default EVerificationSetup;
