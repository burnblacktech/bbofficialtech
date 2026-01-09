// =====================================================
// PAN VERIFICATION - ITR Filing Entry Point (S29 Hardened)
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import SectionCard from '../../components/common/SectionCard';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';
import InlineHint from '../../components/common/InlineHint';

const API_BASE_URL = getApiBaseUrl();

const PANVerification = () => {
    const navigate = useNavigate();
    const [pan, setPan] = useState('');
    const [dob, setDob] = useState('');
    const [ay, setAy] = useState('2024-25');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const validatePAN = (val) => {
        const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
        return regex.test(val);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        if (!pan || !validatePAN(pan)) {
            setError('Please enter a valid 10-digit PAN (e.g., ABCDE1234F)');
            return;
        }

        if (!dob) {
            setError('Date of Birth is required');
            return;
        }

        try {
            setLoading(true);
            setIsValidating(true);

            // S29: Delayed success (200ms) -> feels deliberate
            await new Promise(resolve => setTimeout(resolve, 600));

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(`${API_BASE_URL}/filings/prefill`, {
                pan: pan.toUpperCase(),
                dob: dob,
                assessmentYear: ay,
            }, { headers });

            toast.success('Identity verified');

            navigate('/itr/confirm-sources', {
                state: {
                    pan: pan.toUpperCase(),
                    dob: dob,
                    ay: ay,
                    prefillData: response.data.data,
                    sources: response.data.sources,
                },
            });

        } catch (err) {
            console.error('Identity verification failed:', err);
            setError(err.response?.data?.error || 'Verification failed. Please check your PAN and Date of Birth.');
        } finally {
            setLoading(false);
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center p-6">
            {/* Step Indicator */}
            <div className="mb-8 text-center">
                <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                    Step 1 of 5
                </span>
                <div className="flex gap-2 mt-2">
                    <div className="h-1 w-8 bg-[var(--s29-primary)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                    <div className="h-1 w-8 bg-[var(--s29-border-light)] rounded-full" />
                </div>
            </div>

            <SectionCard
                title="Verify Identity"
                description="We use this only to identify your return. Nothing is submitted yet."
            >
                <form onSubmit={handleVerify} className="space-y-8">
                    {/* Assessment Year selection */}
                    <div className="space-y-2">
                        <label className="text-[var(--s29-font-size-small)] font-semibold text-[var(--s29-text-main)]">
                            Assessment Year (AY)
                        </label>
                        <select
                            value={ay}
                            onChange={(e) => setAy(e.target.value)}
                            className="w-full px-4 py-3 rounded-[var(--s29-radius-main)] border border-[var(--s29-border-light)] bg-white focus:border-[var(--s29-primary)] outline-none transition-all"
                            disabled={loading}
                        >
                            <option value="2024-25">2024-25 (Latest)</option>
                            <option value="2023-24">2023-24</option>
                        </select>
                        <InlineHint>Choose the year for which you want to file returns.</InlineHint>
                    </div>

                    {/* PAN Input */}
                    <div className="space-y-2">
                        <label className="text-[var(--s29-font-size-small)] font-semibold text-[var(--s29-text-main)]">
                            Permanent Account Number (PAN)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={pan}
                                onChange={(e) => {
                                    setPan(e.target.value.toUpperCase());
                                    if (error) setError('');
                                }}
                                placeholder="ABCDE1234F"
                                className={`w-full px-4 py-3 rounded-[var(--s29-radius-main)] border transition-all outline-none font-mono uppercase tracking-widest ${error ? 'border-[var(--s29-error)] bg-[var(--s29-error-light)]' : 'border-[var(--s29-border-light)] focus:border-[var(--s29-primary)]'
                                    }`}
                                maxLength={10}
                                disabled={loading}
                                autoFocus
                            />
                            {validatePAN(pan) && !error && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--s29-success)] animate-in fade-in zoom-in duration-300">
                                    ✓
                                </span>
                            )}
                        </div>
                        <InlineHint>Format: 5 letters, 4 numbers, 1 letter.</InlineHint>
                    </div>

                    {/* DOB Input */}
                    <div className="space-y-2">
                        <label className="text-[var(--s29-font-size-small)] font-semibold text-[var(--s29-text-main)]">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            value={dob}
                            onChange={(e) => {
                                setDob(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full px-4 py-3 rounded-[var(--s29-radius-main)] border transition-all outline-none ${error && !dob ? 'border-[var(--s29-error)] bg-[var(--s29-error-light)]' : 'border-[var(--s29-border-light)] focus:border-[var(--s29-primary)]'
                                }`}
                            disabled={loading}
                        />
                        <InlineHint>Required as per PAN records to verify identity.</InlineHint>
                    </div>

                    {error && (
                        <div className="p-3 bg-[var(--s29-error-light)] border border-[var(--s29-error)] rounded-[var(--s29-radius-main)] text-[var(--s29-error)] text-[var(--s29-font-size-small)]">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !pan || !dob}
                        className="w-full bg-[var(--s29-primary)] text-white py-4 rounded-[var(--s29-radius-main)] font-semibold text-lg hover:bg-[var(--s29-primary-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Securely Verifying...
                            </>
                        ) : (
                            <>
                                Continue to Filing
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8">
                    <ReassuranceBanner
                        message="Your data is protected. We use official linkages for high-fidelity tax fetching."
                    />
                </div>
            </SectionCard>
        </div>
    );
};

export default PANVerification;
