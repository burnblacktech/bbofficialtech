// =====================================================
// ITR-3 AUDIT INFORMATION
// Tax audit details (if applicable)
// Form 3CA/3CB/3CD details
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const ITR3AuditInformation = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        isAuditApplicable: false,
        auditReportForm: '3CD',
        auditorName: '',
        auditorPAN: '',
        auditorMembershipNumber: '',
        auditReportDate: '',
        auditReportNumber: '',
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const data = response.data.data || response.data;
            setFiling(data);

            // Pre-populate from existing data
            const audit = data?.jsonPayload?.business?.audit || {};
            setFormData({
                isAuditApplicable: audit.isAuditApplicable || false,
                auditReportForm: audit.auditReportForm || '3CD',
                auditorName: audit.auditorName || '',
                auditorPAN: audit.auditorPAN || '',
                auditorMembershipNumber: audit.auditorMembershipNumber || '',
                auditReportDate: audit.auditReportDate || '',
                auditReportNumber: audit.auditReportNumber || '',
            });
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (formData.isAuditApplicable) {
            if (!formData.auditorName || !formData.auditorPAN) {
                toast.error('Please fill auditor details');
                return;
            }
        }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    business: {
                        ...filing.jsonPayload?.business,
                        audit: formData,
                    },
                },
            }, { headers });

            toast.success('Audit information saved');
            navigate(`/filing/${filingId}/income-story`);
        } catch (error) {
            toast.error('Failed to save audit information');
        }
    };

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Audit Information
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tax audit details (if applicable under Section 44AB).
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="info"
                        message="Tax audit is mandatory if turnover > ₹1 Crore (business) or ₹50 Lakh (profession)."
                    />
                </div>

                {/* Audit Form */}
                <Card>
                    <div className="space-y-6">
                        {/* Audit Applicable */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Is Tax Audit Applicable?
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={formData.isAuditApplicable === true}
                                        onChange={() => setFormData({ ...formData, isAuditApplicable: true })}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <span>Yes</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={formData.isAuditApplicable === false}
                                        onChange={() => setFormData({ ...formData, isAuditApplicable: false })}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>

                        {formData.isAuditApplicable && (
                            <>
                                {/* Audit Report Form */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Audit Report Form
                                    </label>
                                    <select
                                        value={formData.auditReportForm}
                                        onChange={(e) => setFormData({ ...formData, auditReportForm: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="3CA">Form 3CA (Company)</option>
                                        <option value="3CB">Form 3CB (Non-Company)</option>
                                        <option value="3CD">Form 3CD (Tax Audit Report)</option>
                                    </select>
                                </div>

                                {/* Auditor Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Auditor Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.auditorName}
                                        onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter auditor's full name"
                                    />
                                </div>

                                {/* Auditor PAN */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Auditor PAN *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.auditorPAN}
                                        onChange={(e) => setFormData({ ...formData, auditorPAN: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                                        placeholder="e.g., ABCDE1234F"
                                        maxLength="10"
                                    />
                                </div>

                                {/* Membership Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Auditor Membership Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.auditorMembershipNumber}
                                        onChange={(e) => setFormData({ ...formData, auditorMembershipNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="ICAI membership number"
                                    />
                                </div>

                                {/* Audit Report Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Date of Audit Report
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.auditReportDate}
                                        onChange={(e) => setFormData({ ...formData, auditReportDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Audit Report Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Audit Report Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.auditReportNumber}
                                        onChange={(e) => setFormData({ ...formData, auditReportNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter audit report number"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
};

export default ITR3AuditInformation;
