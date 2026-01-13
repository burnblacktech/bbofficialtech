import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, FileText, Users, Bell, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import StatsWidget from '../../components/Dashboard/StatsWidget';
import ActiveFilingCard from '../../components/Dashboard/ActiveFilingCard';
import SectionCard from '../../components/common/SectionCard';
import apiClient from '../../services/core/APIClient';
import analyticsService from '../../services/api/analyticsService';
import memberService from '../../services/memberService';
import { UIButton, UICard, Heading1, Heading2, BodySmall } from '../../components/UI';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeFiling, setActiveFiling] = useState(null);
    const [stats, setStats] = useState({
        totalFilings: 0,
        documents: 0,
        familyMembers: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [filingsRes, membersRes] = await Promise.all([
                apiClient.get('/filings'),
                memberService.getMembers(),
            ]);

            const filings = filingsRes.data.data || [];

            // Find most recent active filing
            // Logic: Not submitted successfully, newest updated first
            const active = filings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

            // Enhance active with readiness
            let enhancedActive = null;
            if (active) {
                try {
                    const readinessRes = await apiClient.get(`/filings/${active.id}/readiness`);
                    enhancedActive = { ...active, readiness: readinessRes.data.data };
                } catch (e) {
                    enhancedActive = active;
                }
            }

            setActiveFiling(enhancedActive);
            setStats({
                totalFilings: filings.length,
                documents: 0, // Placeholder until doc service integrated
                familyMembers: (membersRes.data.members || []).length,
            });

        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-main)] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--s29-bg-main)] py-8 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Heading1>
                            Welcome back, {user?.firstName}
                        </Heading1>
                        <BodySmall muted>Here's what's happening with your taxes.</BodySmall>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Section: Active Filing or CTA */}
                        {activeFiling ? (
                            <section>
                                <Heading2 className="mb-4">Active Filing</Heading2>
                                <ActiveFilingCard filing={activeFiling} />
                            </section>
                        ) : (
                            <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-2">File Your Taxes for AY 2024-25</h2>
                                    <p className="text-slate-300 mb-6 max-w-sm">Get accurate tax computation and maximum refunds with our AI-powered filing assistant.</p>
                                    <UIButton
                                        variant="secondary"
                                        icon={ArrowRight}
                                        onClick={() => navigate('/itr/start')}
                                        className="bg-white text-slate-900 hover:bg-blue-50"
                                    >
                                        Start New Filing
                                    </UIButton>
                                </div>
                            </section>
                        )}

                        {/* Recent Activity / Quick Actions Grid */}
                        <section>
                            <Heading2 className="mb-4">Quick Actions</Heading2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/documents')}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-slate-900 block">Upload Form 16</span>
                                    <span className="text-xs text-slate-500">Auto-read data</span>
                                </button>

                                <button
                                    onClick={() => navigate('/filing-history')}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                                        <Download className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="font-bold text-slate-900 block">Download ITR-V</span>
                                    <span className="text-xs text-slate-500">Past returns</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Stats Widgets */}
                        <StatsWidget
                            icon={Wallet}
                            label="Tax Payable Estimate"
                            value="₹0" // Placeholder until computed
                            color="green"
                        />
                        <StatsWidget
                            icon={Users}
                            label="Family Members"
                            value={stats.familyMembers}
                            color="orange"
                        />

                        {/* Security / Pulse */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-slate-700">Account Secure</span>
                            </div>
                            <p className="text-xs text-slate-500">Last login: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
