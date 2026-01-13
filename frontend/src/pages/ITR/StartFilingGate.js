// =====================================================
// START FILING GATE - First Post-Login Screen
// Sets the emotional tone and invites the user to start
// =====================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import SectionCard from '../../components/common/SectionCard';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const StartFilingGate = () => {
    const navigate = useNavigate();

  return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-8 px-6">
            <div className="max-w-2xl mx-auto">
                <SectionCard className="p-10 border-none shadow-elevation-2">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h1 className="text-heading-1 font-bold text-slate-900 mb-4">
                            Let’s file your income tax return.
                        </h1>
                        <p className="text-body-lg text-slate-600">
                            We’ll guide you through a calm, step-by-step process. No jargon, no guesswork.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">15-30 mins</p>
                            <p className="text-xs text-slate-500">Average time to file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">100% Secure</p>
                            <p className="text-xs text-slate-500">Bank-grade encryption</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">CA-Grade</p>
                            <p className="text-xs text-slate-500">Legally defensible</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/itr/verify-identity')}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Start Filing Now
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full text-slate-500 py-2 text-sm font-medium hover:text-slate-900 transition-colors"
                        >
                            Take me to dashboard
                        </button>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};

export default StartFilingGate;
