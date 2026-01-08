// =====================================================
// PAN VERIFICATION - ITR Filing Entry Point
// Requires a valid PAN to start the filing journey
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import ReassuranceBanner from '../../components/ReassuranceBanner';

const API_BASE_URL = getApiBaseUrl();

const PANVerification = () => {
    const navigate = useNavigate();
    const [pan, setPan] = useState('');
    const [dob, setDob] = useState('');
    const [ay, setAy] = useState('2024-25');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validatePAN = (val) => {
        const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
        return regex.test(val);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        if (!pan) {
            setError('PAN is required');
            return;
        }

        if (!validatePAN(pan)) {
            setError('Please enter a valid 10-digit PAN (e.g., ABCDE1234F)');
            return;
        }

        if (!dob) {
            setError('Date of Birth is required');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Step 1: Trigger Prefill (Identity Lock)
            toast.loading('Verifying identity & fetching data...', { id: 'prefetch' });

            const response = await axios.post(`${API_BASE_URL}/filings/prefill`, {
                pan: pan.toUpperCase(),
                dob: dob, // Passing DOB for identity lock
                assessmentYear: ay,
            }, { headers });

            toast.success('Identity verified & data fetched!', { id: 'prefetch' });

            // Step 2: Navigate to Income Sources with identity and prefill data
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
            const errorMsg = err.response?.data?.error || 'Verification failed. Please check your PAN and Date of Birth.';
            setError(errorMsg);
            toast.error(errorMsg, { id: 'prefetch' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Brand/Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 mb-2">
                        Verify your PAN
                    </h1>
                    <p className="text-slate-600">
                        We use your PAN to securely fetch your tax data from Govt. portals.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <form onSubmit={handleVerify} className="space-y-6">
                        {/* Assessment Year selection */}
                        <div>
                            <label htmlFor="ay" className="block text-sm font-medium text-slate-700 mb-2">
                                Assessment Year (AY)
                            </label>
                            <select
                                id="ay"
                                value={ay}
                                onChange={(e) => setAy(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary-500 outline-none text-lg transition-all"
                                disabled={loading}
                            >
                                <option value="2024-25">2024-25 (Current)</option>
                                <option value="2023-24">2023-24 (Previous)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="pan" className="block text-sm font-medium text-slate-700 mb-2">
                                Permanent Account Number (PAN)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="pan"
                                    value={pan}
                                    onChange={(e) => {
                                        setPan(e.target.value.toUpperCase());
                                        if (error) setError('');
                                    }}
                                    placeholder="ABCDE1234F"
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-lg font-mono uppercase tracking-widest ${error ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary-500'
                                        }`}
                                    maxLength={10}
                                    disabled={loading}
                                    autoFocus
                                />
                                {validatePAN(pan) && !error && (
                                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-6 h-6" />
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-2">
                                Date of Birth (as per PAN)
                            </label>
                            <input
                                type="date"
                                id="dob"
                                value={dob}
                                onChange={(e) => {
                                    setDob(e.target.value);
                                    if (error) setError('');
                                }}
                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-lg ${error && !dob ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary-500'
                                    }`}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !pan || !dob}
                            className="w-full bg-primary-600 text-white py-4 rounded-xl font-medium text-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify Identity
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <ReassuranceBanner
                            type="security"
                            message="Your data is encrypted and only used for your ITR filing."
                        />
                    </div>
                </div>

                <p className="text-center mt-6 text-sm text-slate-500">
                    Trusted by 50,000+ taxpayers across India.
                </p>
            </div>
        </div>
    );
};

export default PANVerification;
