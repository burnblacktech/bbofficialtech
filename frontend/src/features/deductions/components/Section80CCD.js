// =====================================================
// SECTION 80CCD UI COMPONENT - NPS CONTRIBUTIONS
// BurnBlack premium design for NPS deductions
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Shield,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  Target,
  Upload,
  Calendar,
  User,
  Users,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80CCD = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    pran: '',
    contributionType: 'self',
    selfContribution: '',
    employerContribution: '',
    tier: 'tier1',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Contribution Types
  const contributionTypes = [
    {
      id: 'self',
      name: 'Self Contribution',
      icon: User,
      color: 'emerald',
      limit: 150000,
      description: 'Your own NPS contribution',
    },
    {
      id: 'employer',
      name: 'Employer Contribution',
      icon: Building,
      color: 'royal',
      limit: 50000,
      description: 'Employer NPS contribution (additional)',
    },
    {
      id: 'both',
      name: 'Both',
      icon: Users,
      color: 'gold',
      limit: 200000,
      description: 'Self + Employer contributions',
    },
  ];

  // Fetch 80CCD deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80CCD', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80CCD?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { data: { deductions: [], totalSelfAmount: 0, totalEmployerAmount: 0, remainingSelfLimit: 150000, remainingEmployerLimit: 50000 } };
      }
    },
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/api/itr/deductions/80CCD', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          const total = (parseFloat(data.selfContribution) || 0) + (parseFloat(data.employerContribution) || 0);
          onUpdate({ section80CCD: total });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80CCD', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80CCD contribution added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add contribution');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80CCD/${deductionId}`, { filingId, ...data });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          const total = (parseFloat(data.selfContribution) || 0) + (parseFloat(data.employerContribution) || 0);
          onUpdate({ section80CCD: total });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80CCD', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('80CCD contribution updated successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80CCD: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update contribution');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80CCD/${deductionId}?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80CCD: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80CCD', filingId]);
      toast.success('80CCD contribution deleted successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80CCD: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete contribution');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalSelfAmount = deductionsData?.data?.totalSelfAmount || deductions.reduce((sum, d) => sum + (parseFloat(d.selfContribution) || 0), 0);
  const totalEmployerAmount = deductionsData?.data?.totalEmployerAmount || deductions.reduce((sum, d) => sum + (parseFloat(d.employerContribution) || 0), 0);
  const totalAmount = totalSelfAmount + totalEmployerAmount;
  const remainingSelfLimit = deductionsData?.data?.remainingSelfLimit || Math.max(0, 150000 - totalSelfAmount);
  const remainingEmployerLimit = deductionsData?.data?.remainingEmployerLimit || Math.max(0, 50000 - totalEmployerAmount);
  const selfUtilizationPercentage = Math.round((totalSelfAmount / 150000) * 100);
  const employerUtilizationPercentage = Math.round((totalEmployerAmount / 50000) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    if (!formData.pran.trim()) {
      setFormErrors({ pran: 'PRAN is required' });
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pran.toUpperCase())) {
      setFormErrors({ pran: 'Invalid PRAN format (e.g., ABCDE1234F)' });
      return;
    }

    const selfAmount = parseFloat(formData.selfContribution) || 0;
    const employerAmount = parseFloat(formData.employerContribution) || 0;

    if (selfAmount <= 0 && employerAmount <= 0) {
      setFormErrors({ contributionAmount: 'At least one contribution amount is required' });
      return;
    }

    if (selfAmount > remainingSelfLimit) {
      setFormErrors({ selfContribution: `Self contribution exceeds remaining limit of ₹${remainingSelfLimit.toLocaleString()}` });
      return;
    }

    if (employerAmount > remainingEmployerLimit) {
      setFormErrors({ employerContribution: `Employer contribution exceeds remaining limit of ₹${remainingEmployerLimit.toLocaleString()}` });
      return;
    }

    try {
      if (editingDeduction) {
        await updateDeductionMutation.mutateAsync({
          deductionId: editingDeduction.id,
          data: formData,
        });
      } else {
        await addDeductionMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving 80CCD contribution:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      pran: deduction.pran || '',
      contributionType: deduction.contributionType || 'self',
      selfContribution: deduction.selfContribution?.toString() || '',
      employerContribution: deduction.employerContribution?.toString() || '',
      tier: deduction.tier || 'tier1',
      financialYear: deduction.financialYear || '2024-25',
    });
    setShowAddForm(true);
  };

  const handleDelete = (deductionId) => {
    setDeleteConfirm({ isOpen: true, deductionId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.deductionId) {
      deleteDeductionMutation.mutate(deleteConfirm.deductionId);
    }
    setDeleteConfirm({ isOpen: false, deductionId: null });
  };

  const resetForm = () => {
    setFormData({
      pran: '',
      contributionType: 'self',
      selfContribution: '',
      employerContribution: '',
      tier: 'tier1',
      financialYear: '2024-25',
    });
    setFormErrors({});
    setEditingDeduction(null);
  };

  const handleProofUpload = async (e, deductionId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('deductionId', deductionId);
      formDataObj.append('section', '80CCD');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Proof uploaded successfully');
        queryClient.invalidateQueries(['section80CCD', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploadingProof(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-xl">
              <Shield className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-slate-900">Section 80CCD</h2>
              <p className="text-body-sm text-slate-600">NPS Contributions (Self: ₹1,50,000, Employer: ₹50,000 additional)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contribution</span>
          </button>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Self Contribution */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm font-medium text-slate-700">Self Contribution</span>
              <span className="text-heading-sm font-bold text-slate-900">₹{totalSelfAmount.toLocaleString('en-IN')} / ₹1,50,000</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(selfUtilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-body-xs text-slate-600">{selfUtilizationPercentage}% utilized</span>
              <span className="text-body-xs text-green-600 font-medium">₹{remainingSelfLimit.toLocaleString('en-IN')} remaining</span>
            </div>
          </div>

          {/* Employer Contribution */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm font-medium text-slate-700">Employer Contribution</span>
              <span className="text-heading-sm font-bold text-slate-900">₹{totalEmployerAmount.toLocaleString('en-IN')} / ₹50,000</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-royal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(employerUtilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-body-xs text-slate-600">{employerUtilizationPercentage}% utilized</span>
              <span className="text-body-xs text-green-600 font-medium">₹{remainingEmployerLimit.toLocaleString('en-IN')} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-4">
          {deductions.map((deduction) => (
            <div
              key={deduction.id}
              className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 bg-gold-100 rounded-xl">
                    <Shield className="h-6 w-6 text-gold-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-heading-md text-slate-900">NPS Contribution</h3>
                      {deduction.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-body-sm text-slate-600">PRAN: </span>
                        <span className="text-body-sm font-medium text-slate-900">{deduction.pran}</span>
                      </div>
                      <div>
                        <span className="text-body-sm text-slate-600">Tier: </span>
                        <span className="text-body-sm font-medium text-slate-900">{deduction.tier === 'tier1' ? 'Tier 1' : 'Tier 2'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {parseFloat(deduction.selfContribution || 0) > 0 && (
                          <div>
                            <div className="text-heading-sm font-bold text-emerald-600">
                              ₹{parseFloat(deduction.selfContribution || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-body-xs text-slate-600">Self Contribution</div>
                          </div>
                        )}
                        {parseFloat(deduction.employerContribution || 0) > 0 && (
                          <div>
                            <div className="text-heading-sm font-bold text-royal-600">
                              ₹{parseFloat(deduction.employerContribution || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-body-xs text-slate-600">Employer Contribution</div>
                          </div>
                        )}
                      </div>
                      {deduction.proofDocument && (
                        <div className="flex items-center space-x-2 text-body-sm text-slate-600">
                          <FileText className="h-4 w-4" />
                          <span>Proof uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleProofUpload(e, deduction.id)}
                      className="hidden"
                    />
                    <div className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                      <Upload className="h-4 w-4" />
                    </div>
                  </label>
                  <button
                    onClick={() => handleEdit(deduction)}
                    className="p-2 text-gold-600 hover:bg-gold-50 rounded-xl transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.id)}
                    className="p-2 text-error-600 hover:bg-error-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-slate-900 mb-2">No NPS Contributions</h3>
          <p className="text-body-sm text-slate-600 mb-4">
            Add your NPS contributions to claim deduction under Section 80CCD
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
          >
            Add First Contribution
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-elevation-4 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-slate-900">
                {editingDeduction ? 'Edit' : 'Add'} 80CCD Contribution
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <AlertCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PRAN */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  PRAN (Permanent Retirement Account Number) <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pran}
                  onChange={(e) => setFormData({ ...formData, pran: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.pran ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {formErrors.pran && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.pran}</p>
                )}
              </div>

              {/* Tier */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  NPS Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="tier1">Tier 1 (Tax-saving)</option>
                  <option value="tier2">Tier 2 (Voluntary)</option>
                </select>
              </div>

              {/* Self Contribution */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Self Contribution (₹)
                </label>
                <input
                  type="number"
                  value={formData.selfContribution}
                  onChange={(e) => setFormData({ ...formData, selfContribution: e.target.value })}
                  max={remainingSelfLimit}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.selfContribution ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter self contribution amount"
                />
                {formErrors.selfContribution && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.selfContribution}</p>
                )}
                <p className="mt-1 text-body-xs text-slate-500">
                  Limit: ₹1,50,000 | Remaining: ₹{remainingSelfLimit.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Employer Contribution */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Employer Contribution (₹)
                </label>
                <input
                  type="number"
                  value={formData.employerContribution}
                  onChange={(e) => setFormData({ ...formData, employerContribution: e.target.value })}
                  max={remainingEmployerLimit}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.employerContribution ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter employer contribution amount"
                />
                {formErrors.employerContribution && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.employerContribution}</p>
                )}
                <p className="mt-1 text-body-xs text-slate-500">
                  Limit: ₹50,000 (additional) | Remaining: ₹{remainingEmployerLimit.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-xl p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">NPS Contribution Limits</h3>
                    <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                      <li>Self contribution: Up to ₹1,50,000 (combined with 80C and 80CCC)</li>
                      <li>Employer contribution: Up to ₹50,000 additional (over and above ₹1,50,000)</li>
                      <li>Total possible deduction: ₹2,00,000 (₹1,50,000 + ₹50,000)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeductionMutation.isPending || updateDeductionMutation.isPending}
                  className="flex-1 py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  {addDeductionMutation.isPending || updateDeductionMutation.isPending
                    ? 'Saving...'
                    : editingDeduction
                    ? 'Update'
                    : 'Add Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, deductionId: null })}
        onConfirm={confirmDelete}
        title="Delete Contribution"
        message="Are you sure you want to delete this contribution? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80CCD;

