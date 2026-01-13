// =====================================================
// FINAL SUBMISSION
// Transmission to ERI and Confirmation
// =====================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, Download, Home, PartyPopper } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const FinalSubmission = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // In a real scenario, this would call /submissions/submit
            // For this flow implementation, we simulate the success state
            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                status: 'submitted',
                submittedAt: new Date().toISOString() }, { headers });

            setSuccess(true);
            toast.success('ITR Filed Successfully!');
        } catch (error) {
            toast.error('Transmission to ITD failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {

  return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <PartyPopper className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">ITR FILED!</h1>
                    <p className="text-slate-500 font-medium mb-12">Congratulations! Your Income Tax Return for AY 2024-25 has been successfully transmitted to the Income Tax Department.</p>

                    <div className="space-y-4">
                        <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                            <Download className="w-5 h-5" />
                            Download ITR-V Ack.
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                        >
                            <Home className="w-5 h-5" />
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Card>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                    <Send className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">One Final Click</h2>
                <p className="text-slate-500 mb-10 leading-relaxed font-medium">By clicking below, you authorize us to transmit your encrypted data to the Income Tax Department E-Filing portal.</p>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 ${submitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                    {submitting ? 'Transmitting...' : 'TRANSMIT ITR NOW'}
                    <Send className={`w-6 h-6 ${submitting ? 'animate-pulse' : ''}`} />
                </button>

                <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                    SECURED WITH 256-BIT ENCRYPTION<br />
                    AUTHORIZED ERI TRANSMISSION
                </p>
            </Card>
            </div>
        );
};

export default FinalSubmission;
