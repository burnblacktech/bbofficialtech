// =====================================================
// SALARY DETAILS - Screen 3A (Frozen v1 Specification)
// Progressive Entry: Employer List → Add Employer → Details
// First concrete data-entry surface
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import FileUpload from '../../components/Documents/FileUpload';
import documentService from '../../services/api/documentService';

const API_BASE_URL = getApiBaseUrl();

const SalaryDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployer, setEditingEmployer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        periodFrom: '',
        periodTo: '',
        hasForm16: null,
        grossSalary: '',
        tdsDeducted: '',
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            setFiling(response.data.data || response.data);
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const employers = filing?.jsonPayload?.income?.salary?.employers || [];

    const handleAddEmployer = () => {
        setFormData({
            name: '',
            periodFrom: '',
            periodTo: '',
            hasForm16: null,
            grossSalary: '',
            tdsDeducted: '',
        });
        setEditingEmployer(null);
        setShowAddModal(true);
    };

    const handleEditEmployer = (employer, index) => {
        setFormData({
            name: employer.name || '',
            periodFrom: employer.periodFrom || '',
            periodTo: employer.periodTo || '',
            hasForm16: employer.hasForm16 ?? null,
            grossSalary: employer.grossSalary || '',
            tdsDeducted: employer.tdsDeducted || '',
        });
        setEditingEmployer(index);
        setShowAddModal(true);
    };

    const handleSaveEmployer = async () => {
        if (!formData.name || !formData.periodFrom || !formData.periodTo) {
            toast.error('Please fill employer name and employment period');
            return;
        }

        try {
            const updatedEmployers = [...employers];
            const employerData = {
                name: formData.name,
                periodFrom: formData.periodFrom,
                periodTo: formData.periodTo,
                hasForm16: formData.hasForm16,
                grossSalary: formData.grossSalary ? parseFloat(formData.grossSalary) : null,
                tdsDeducted: formData.tdsDeducted ? parseFloat(formData.tdsDeducted) : null,
            };

            if (editingEmployer !== null) {
                updatedEmployers[editingEmployer] = employerData;
            } else {
                updatedEmployers.push(employerData);
            }

            // Update filing
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        salary: {
                            ...filing.jsonPayload?.income?.salary,
                            employers: updatedEmployers,
                        },
                    },
                },
            }, { headers });

            toast.success(editingEmployer !== null ? 'Employer updated' : 'Employer added');
            setShowAddModal(false);
            fetchFiling();
        } catch (error) {
            toast.error('Failed to save employer');
        }
    };

    const handleDeleteEmployer = async (index) => {
        // eslint-disable-next-line no-alert
        if (!window.confirm('Remove this employer?')) return;

        try {
            const updatedEmployers = employers.filter((_, i) => i !== index);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        salary: {
                            ...filing.jsonPayload?.income?.salary,
                            employers: updatedEmployers,
                        },
                    },
                },
            }, { headers });

            toast.success('Employer removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove employer');
        }
    };

    const getEmployerStatus = (employer) => {
        if (!employer.grossSalary) return 'Details incomplete';
        return 'Complete';
    };

    const allEmployersComplete = employers.length > 0 && employers.every(e => e.grossSalary);

    const handleForm16Upload = async (results) => {
        const success = results.find(r => r.success);
        if (!success) return;

        const file = success.file;
        try {
            toast.loading('Extracting data from Form 16...', { id: 'ocr' });
            const result = await documentService.processForm16(file);
            if (result.success && result.extractedData) {
                const data = result.extractedData;
                setFormData({
                    name: data.employer?.name || '',
                    periodFrom: '',
                    periodTo: '',
                    hasForm16: true,
                    grossSalary: data.financial?.grossSalary || '',
                    tdsDeducted: data.financial?.tds || '',
                });
                setEditingEmployer(null);
                setShowAddModal(true);
                toast.success('Form 16 data extracted! Please verify.', { id: 'ocr' });
            } else {
                toast.error('Could not extract data. Please enter manually.', { id: 'ocr' });
            }
        } catch (err) {
            toast.error('Failed to process Form 16', { id: 'ocr' });
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
                            Salary Details
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us about where your salary came from this year.
                    </p>
                </div>

                {/* Reassurance: Normalization */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="Most people have 1-2 employers. This is normal."
                    />
                </div>

                {/* Form 16 Upload (Primary Path) */}
                <div className="mb-8">
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-primary-600 rounded-lg">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Add via Form 16</h2>
                                <p className="text-sm text-slate-600">Drop your Form 16 PDF here for instant auto-population</p>
                            </div>
                        </div>
                        <FileUpload
                            onUploadComplete={handleForm16Upload}
                            category="FORM_16"
                            filingId={filingId}
                            maxFiles={1}
                            className="bg-white border-2 border-dashed border-primary-200"
                        />
                    </div>
                </div>

                {/* Employer List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Your salary sources
                    </h2>

                    {employers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No employers added yet</p>
                            <p className="text-sm mt-1">Click "Add employer" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {employers.map((employer, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-slate-900 mb-1">
                                                {employer.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 mb-2">
                                                {employer.periodFrom} – {employer.periodTo}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded ${getEmployerStatus(employer) === 'Complete'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {getEmployerStatus(employer)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditEmployer(employer, index)}
                                                className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEmployer(index)}
                                                className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddEmployer}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add another employer
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back to Income Story
                    </button>
                    <button
                        onClick={() => {
                            if (allEmployersComplete) {
                                navigate(`/filing/${filingId}/income-story`);
                            } else {
                                toast('Please complete all employer details', { icon: '⏳' });
                            }
                        }}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        {allEmployersComplete ? 'Continue' : 'Save & continue'}
                    </button>
                </div>

                {/* Add/Edit Employer Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingEmployer !== null ? 'Edit Employer' : 'Add Employer'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Step 1: Identity */}
                                <div>
                                    <h3 className="font-medium text-slate-900 mb-4">Employer Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Employer name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="e.g., TechCorp India Pvt Ltd"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Period from *
                                                </label>
                                                <input
                                                    type="month"
                                                    value={formData.periodFrom}
                                                    onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Period to *
                                                </label>
                                                <input
                                                    type="month"
                                                    value={formData.periodTo}
                                                    onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Details (Optional at this stage) */}
                                <div>
                                    <h3 className="font-medium text-slate-900 mb-4">Salary Details (Optional)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Do you have Form 16?
                                            </label>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setFormData({ ...formData, hasForm16: true })}
                                                    className={`flex-1 py-2 px-4 border rounded-lg ${formData.hasForm16 === true
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                        : 'border-slate-300 text-slate-700'
                                                        }`}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, hasForm16: false })}
                                                    className={`flex-1 py-2 px-4 border rounded-lg ${formData.hasForm16 === false
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                        : 'border-slate-300 text-slate-700'
                                                        }`}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Gross salary
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.grossSalary}
                                                onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="e.g., 1200000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                TDS deducted
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.tdsDeducted}
                                                onChange={(e) => setFormData({ ...formData, tdsDeducted: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="e.g., 120000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEmployer}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    {editingEmployer !== null ? 'Update' : 'Add Employer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryDetails;
