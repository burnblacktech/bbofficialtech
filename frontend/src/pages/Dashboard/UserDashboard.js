import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Wallet, FileText, Users, Bell, ArrowRight, ShieldCheck,
    Download, TrendingUp, Cpu, PieChart, Landmark, Shield,
    UserPlus, History, HelpCircle, Sparkles, MessageSquare, Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardKPI from '../../components/Dashboard/DashboardKPI';
import ActiveFilingCard from '../../components/Dashboard/ActiveFilingCard';
import FinancialStoryChart from '../../components/Dashboard/FinancialStoryChart';
import apiClient from '../../services/core/APIClient';
import memberService from '../../services/memberService';
import { UIButton, Heading1, Heading2, BodySmall } from '../../components/UI';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeFiling, setActiveFiling] = useState(null);
    const [stats, setStats] = useState({
        totalFilings: 0,
        documents: 0,
        familyMembers: 0,
        taxSaved: '₹12,400',
        reportedIncome: '₹0',
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
            const active = filings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

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
            setStats(prev => ({
                ...prev,
                totalFilings: filings.length,
                familyMembers: (membersRes.data.members || []).length,
                reportedIncome: enhancedActive?.totalIncome ? `₹${enhancedActive.totalIncome.toLocaleString()}` : '₹0',
            }));

        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-slate-500 font-medium animate-pulse">Building your tax profile...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="pb-12"
        >
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Command <span className="text-primary-600">Center</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Welcome back, {user?.firstName}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <UIButton
                            variant="primary"
                            className="bg-slate-900 shadow-glow-gold text-white hover:bg-slate-800"
                            onClick={() => navigate('/itr/start')}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Start Filing
                        </UIButton>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: KPIs and Insights */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* KPI Pulse Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <DashboardKPI
                                icon={Landmark}
                                label="Reported Income"
                                value={stats.reportedIncome}
                                color="slate"
                            />
                            <DashboardKPI
                                icon={TrendingUp}
                                label="Tax Saved"
                                value={stats.taxSaved}
                                trend={12}
                                color="success"
                            />
                            <DashboardKPI
                                icon={FileText}
                                label="Documents"
                                value={stats.documents}
                                subtext="4 processed"
                                color="info"
                            />
                            <DashboardKPI
                                icon={Users}
                                label="Family"
                                value={stats.familyMembers}
                                subtext="Active members"
                                color="ember"
                            />
                        </motion.div>

                        {/* Financial Odyssey: YoY Story */}
                        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-elevation-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        Financial Odyssey
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">Your income and tax journey across assessment years</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                                        <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Income</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                                        <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Tax</span>
                                    </div>
                                </div>
                            </div>

                            <FinancialStoryChart />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 border-t border-slate-100 pt-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Income Growth</p>
                                    <h4 className="text-lg font-bold text-slate-900">+18% YoY</h4>
                                    <p className="text-[10px] text-slate-500 mt-1">Consistent upward trajectory in earnings.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-success-200 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tax Efficiency</p>
                                    <h4 className="text-lg font-bold text-success-600">8.4% Saved</h4>
                                    <p className="text-[10px] text-slate-500 mt-1">Via optimized section 80C deductions.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-ember-200 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Assets</p>
                                    <h4 className="text-lg font-bold text-slate-900">+2 Profiles</h4>
                                    <p className="text-[10px] text-slate-500 mt-1">Added 2 family members for joint filing.</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Interaction Zone */}
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-primary-500" />
                                    Active Priorities
                                </h2>
                            </div>
                            {activeFiling ? (
                                <ActiveFilingCard filing={activeFiling} />
                            ) : (
                                <div className="bg-aurora-gradient rounded-3xl p-8 text-white relative overflow-hidden shadow-aurora-glow">
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 backdrop-blur-md">
                                                <Sparkles className="w-3 h-3 text-yellow-300" />
                                                New Assessment Year Open
                                            </div>
                                            <h2 className="text-3xl font-bold mb-3 tracking-tight">AY 2024-25 Filing is LIVE</h2>
                                            <p className="text-white/80 mb-6 text-lg">Our AI engine is ready to compute your taxes and maximize your returns with 100% accuracy.</p>
                                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                <button
                                                    onClick={() => navigate('/itr/start')}
                                                    className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                                                >
                                                    Start My Return
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold transition-all">
                                                    Check Eligibility
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 group cursor-pointer hover:scale-105 transition-transform">
                                            <PieChart className="w-24 h-24 text-white opacity-80 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Quick Navigation Sections */}
                        <motion.div variants={itemVariants} className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">Workspace</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: History, label: 'Filing History', sub: 'Past returns', path: '/filing/history' },
                                    { icon: UserPlus, label: 'Family Tree', sub: 'Manage members', path: '/add-members' },
                                    { icon: Landmark, label: 'Tax Tools', sub: 'Calculators', path: '/tools' },
                                    { icon: Shield, label: 'Compliance', sub: 'Check status', path: '/compliance' },
                                ].map((box, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(box.path)}
                                        className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-elevation-2 transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <box.icon className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm">{box.label}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{box.sub}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: AI Assistant & Security */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* AI Insights Sidebar */}
                        <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-elevation-4">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Cpu className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                    AI Tax Insights
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-1">Optimization</p>
                                        <p className="text-sm text-white/90">Switching to the New Tax Regime could save you <span className="text-success-400 font-bold">₹8,500</span> this year.</p>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left w-full">
                                        <p className="text-xs font-bold text-info-400 uppercase tracking-widest mb-1">compliance</p>
                                        <p className="text-sm text-white/90">AIS data detected. Your Dividend Income (₹4,200) needs verification.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/ca-bot')}
                                    className="w-full mt-6 py-3 bg-aurora-gradient rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Ask CA Spire
                                </button>
                            </div>
                        </motion.div>

                        {/* Security Pulse */}
                        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-elevation-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-success-50 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-success-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Protected Mode</h4>
                                    <p className="text-xs text-slate-500">Bank-grade encryption active</p>
                                </div>
                            </div>
                            <div className="space-y-3 pb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Last login:</span>
                                    <span className="text-slate-900 font-medium">10 mins ago</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Session IP:</span>
                                    <span className="text-slate-900 font-medium">103.45.1XX.X</span>
                                </div>
                            </div>
                            <button className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
                                View Security Logs
                            </button>
                        </motion.div>

                        {/* Help Desk Mini */}
                        <motion.div variants={itemVariants} className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center justify-between group cursor-pointer hover:bg-primary-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <HelpCircle className="w-5 h-5 text-primary-600" />
                                <span className="font-bold text-primary-900 text-sm">Need Help?</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                        </motion.div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserDashboard;
