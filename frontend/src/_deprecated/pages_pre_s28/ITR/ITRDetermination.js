// =====================================================
// ITR DETERMINATION - The "Ceremony" Screen (S29 Hardened)
// Explicitly tells the user which ITR they are filing and why
// =====================================================

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Info, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import SectionCard from '../../components/common/SectionCard';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';

const API_BASE_URL = getApiBaseUrl();

const ITRDetermination = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const { pan, dob, ay, prefillData, selectedSources } = location.state || {};

    // Logic to determine ITR type
    const determination = useMemo(() => {
        if (!selectedSources) return null;

        const hasSalary = selectedSources.includes('salary');
        const hasCapitalGains = selectedSources.includes('capitalGains');
        const hasRental = selectedSources.includes('rental');
        const hasBusinessPresumptive = selectedSources.includes('business_presumptive');
        const hasBusinessFull = selectedSources.includes('business_full');

        let type = 'ITR-1';
        const reasons = [];
        let implication = 'Ideal for salaried individuals and simple income profiles.';

        if (hasBusinessFull) {
            type = 'ITR-3';
            reasons.push('You have business or professional income requiring full audit trails.');
            reasons.push('You maintain specialized books of accounts.');
            implication = 'This is a comprehensive form for entrepreneurs and high-value professionals.';
        } else if (hasBusinessPresumptive) {
            type = 'ITR-4';
            reasons.push('You have business income under the presumptive scheme (Section 44AD/ADA).');
            reasons.push('Your turnover is within presumptive limits.');
            implication = 'A simplified form that doesn’t require maintenance of detailed books.';
        } else if (hasCapitalGains) {
            type = 'ITR-2';
            reasons.push('You have income from capital gains (Sale of shares, property, etc.).');
            reasons.push('You own more than one house property.');
            implication = 'Suitable for individuals with investment income but no business profits.';
        } else if (hasRental) {
            type = 'ITR-2';
            reasons.push('You have income from house property.');
            reasons.push('Your income exceeds simplified ITR-1 limits.');
            implication = 'Standard return for homeowners with diverse income sources.';
        } else if (hasSalary) {
            type = 'ITR-1';
            reasons.push('Your primary income is from Salary or Pension.');
            reasons.push('You are a resident individual.');
            implication = 'The simplest return form for 90% of individual taxpayers.';
        }

        return { type, reasons, implication };
    }, [selectedSources]);

    if (!pan || !selectedSources || !determination) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6 text-center">
                <SectionCard title="Journey Blocked">
                    <AlertCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <p className="text-[var(--s29-text-muted)] mb-6">Filing state not found. Please verify your PAN again.</p>
                    <button
                        onClick={() => navigate('/itr/start')}
                        className="bg-[var(--s29-primary)] text-white px-6 py-3 rounded-[var(--s29-radius-main)] font-semibold"
                    >
                        Return to ID Verification
                    </button>
                </SectionCard>
            </div>
        );
    }

    const handleCreateFiling = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(`${API_BASE_URL}/filings`, {
                assessmentYear: ay,
                taxpayerPan: pan,
            }, { headers });

            const filingData = response.data.data || response.data;
            const filingId = filingData.id;
            const existingPayload = filingData.jsonPayload || {};

            if (filingId) {
                const incomeIntent = {
                    salary: selectedSources.includes('salary'),
                    capitalGains: selectedSources.includes('capitalGains'),
                    rental: selectedSources.includes('rental'),
                    businessPresumptive: selectedSources.includes('business_presumptive'),
                    businessFull: selectedSources.includes('business_full'),
                    other: selectedSources.includes('other'),
                };

                const newPayload = {
                    ...existingPayload,
                    selectedIncomeSources: selectedSources,
                    prefill: prefillData,
                    itrType: determination.type,
                    income: {
                        ...(existingPayload.income || {}),
                        salary: incomeIntent.salary ? (existingPayload.income?.salary || { intent: true, prefill: prefillData?.income?.salary || 0 }) : existingPayload.income?.salary,
                        capitalGains: incomeIntent.capitalGains ? (existingPayload.income?.capitalGains || { intent: true }) : existingPayload.income?.capitalGains,
                        houseProperty: incomeIntent.rental ? (existingPayload.income?.houseProperty || { intent: true }) : existingPayload.income?.houseProperty,
                        presumptive: incomeIntent.businessPresumptive ? (existingPayload.income?.presumptive || { intent: true }) : existingPayload.income?.presumptive,
                        business: incomeIntent.businessFull ? (existingPayload.income?.business || { intent: true }) : existingPayload.income?.business,
                        otherSources: incomeIntent.other ? (existingPayload.income?.otherSources || { intent: true }) : existingPayload.income?.otherSources,
                    },
                };

                console.log('[ITR DETERMINATION] Updating filing with payload:', newPayload);

                await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                    jsonPayload: newPayload,
                }, { headers });

                toast.success('Filing started');

                if (determination.type === 'ITR-3') {
                    navigate('/itr/itr3-ceremony', { state: { filingId, pan, ay } });
                } else {
                    navigate(`/filing/${filingId}/overview`);
                }
            }
        } catch (error) {
            console.error('Filing creation failed:', error);
            toast.error('Could not prepare your return. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center p-6">
            {/* Step Indicator */}
            <div className="mb-8 text-center">
                <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                    Step 2 of 5
                </span>
                <div className="flex gap-2 mt-2">
                    <div className="h-1 w-8 bg-[var(--s29-success)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-primary)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                </div>
            </div>

            <SectionCard>
                <div className="text-center">
                    <div className="w-16 h-16 bg-[var(--s29-primary-light)] text-[var(--s29-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <p className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-small)] font-semibold uppercase tracking-wider mb-2">
                        Profile Analyzed
                    </p>
                    <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mb-2">
                        Based on what you told us, you’ll file <span className="text-[var(--s29-primary)]">{determination.type}</span>.
                    </h1>
                </div>

                <div className="mt-8 space-y-4">
                    {determination.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-white border border-[var(--s29-border-light)] rounded-[var(--s29-radius-main)]">
                            <span className="text-[var(--s29-success)] mt-0.5">✓</span>
                            <span className="text-[var(--s29-text-main)] text-[var(--s29-font-size-body)]">{reason}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-[var(--s29-bg-page)] rounded-[var(--s29-radius-main)]">
                    <p className="text-[var(--s29-text-main)] text-[var(--s29-font-size-small)] italic">
                        "{determination.implication}"
                    </p>
                    <p className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] mt-2 font-medium">
                        This won’t change unless you change your income details.
                    </p>
                </div>

                <button
                    onClick={handleCreateFiling}
                    disabled={loading}
                    className="w-full mt-10 bg-[var(--s29-primary)] text-white py-4 rounded-[var(--s29-radius-main)] font-semibold text-lg hover:bg-[var(--s29-primary-dark)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Preparing Return...
                        </>
                    ) : (
                        <>
                            I understand & continue
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <div className="mt-8">
                    <ReassuranceBanner
                        message="Don’t worry about the form selection. We handle the complexity of the law so you can focus on the simple questions."
                    />
                </div>
            </SectionCard>
        </div>
    );
};

export default ITRDetermination;
