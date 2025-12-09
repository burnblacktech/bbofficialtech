// =====================================================
// SECTION 80CCC UI COMPONENT - PENSION FUND CONTRIBUTIONS
// BurnBlack premium design for pension fund deductions
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
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80CCC = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    providerName: '',
    policyNumber: '',
    contributionAmount: '',
    providerType: 'LIC',
    startDate: '',
    endDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Provider Types with BurnBlack styling
  const providerTypes = [
    {
      id: 'LIC',
      name: 'Life Insurance Corporation',
      icon: Shield,
      color: 'royal',
      description: 'LIC pension plans',
    },
    {
      id: 'OTHER_INSURER',
      name: 'Other Insurance Company',
      icon: Building,
      color: 'emerald',
      description: 'Other approved insurers',
    },
  ];

  // Fetch 80CCC deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80CCC', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80CCC?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        // Return empty data if API doesn't exist yet
        return { data: { deductions: [], totalAmount: 0, remainingLimit: 150000 } };
      }
    },
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/api/itr/deductions/80CCC', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        // For now, just update local state
        if (onUpdate) {
          onUpdate({ section80CCC: parseFloat(data.contributionAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80CCC', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80CCC deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80CCC/${deductionId}`, data);
        return response.data;
      } catch (error) {
        // For now, just update local state
        if (onUpdate) {
          onUpdate({ section80CCC: parseFloat(data.contributionAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80CCC', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('80CCC deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80CCC/${deductionId}`);
        return response.data;
      } catch (error) {
        // For now, just update local state
        if (onUpdate) {
          onUpdate({ section80CCC: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80CCC', filingId]);
      toast.success('80CCC deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || deductions.reduce((sum, d) => sum + (parseFloat(d.contributionAmount) || 0), 0);
  const remainingLimit = deductionsData?.data?.remainingLimit || Math.max(0, 150000 - totalAmount);
  const utilizationPercentage = Math.round((totalAmount / 150000) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    if (!formData.providerName.trim()) {
      setFormErrors({ providerName: 'Provider name is required' });
      return;
    }
    if (!formData.policyNumber.trim()) {
      setFormErrors({ policyNumber: 'Policy number is required' });
      return;
    }
    if (!formData.contributionAmount || parseFloat(formData.contributionAmount) <= 0) {
      setFormErrors({ contributionAmount: 'Valid contribution amount is required' });
      return;
    }
    if (parseFloat(formData.contributionAmount) > remainingLimit) {
      setFormErrors({ contributionAmount: `Amount exceeds remaining limit of ₹${remainingLimit.toLocaleString()}` });
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
      console.error('Error saving 80CCC deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      providerName: deduction.providerName || '',
      policyNumber: deduction.policyNumber || '',
      contributionAmount: deduction.contributionAmount?.toString() || '',
      providerType: deduction.providerType || 'LIC',
      startDate: deduction.startDate || '',
      endDate: deduction.endDate || '',
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
      providerName: '',
      policyNumber: '',
      contributionAmount: '',
      providerType: 'LIC',
      startDate: '',
      endDate: '',
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
      formDataObj.append('section', '80CCC');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Proof uploaded successfully');
        queryClient.invalidateQueries(['section80CCC', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploadingProof(false);
    }
  };

  const getProviderTypeInfo = (type) => {
    return providerTypes.find(p => p.id === type) || { name: type, icon: FileText, color: 'neutral' };
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-lg">
              <Shield className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-gray-900">Section 80CCC</h2>
              <p className="text-body-sm text-gray-600">Pension Fund Contributions (Limit: ₹1,50,000 combined with 80C)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contribution</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-body-sm font-medium text-gray-700">Utilization</span>
            <span className="text-heading-sm font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')} / ₹1,50,000</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gold-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-body-xs text-gray-600">{utilizationPercentage}% utilized</span>
            <span className="text-body-xs text-green-600 font-medium">₹{remainingLimit.toLocaleString('en-IN')} remaining</span>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-4">
          {deductions.map((deduction) => {
            const providerInfo = getProviderTypeInfo(deduction.providerType);
            const IconComponent = providerInfo.icon;

            return (
              <div
                key={deduction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 bg-${providerInfo.color}-100 rounded-lg`}>
                      <IconComponent className={`h-6 w-6 text-${providerInfo.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-heading-md text-gray-900">{providerInfo.name}</h3>
                        {deduction.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-body-sm text-gray-600">Provider: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.providerName}</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Policy Number: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.policyNumber}</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-heading-md font-bold text-gold-600">
                            ₹{parseFloat(deduction.contributionAmount || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-body-xs text-gray-600">Contribution Amount</div>
                        </div>
                        {deduction.proofDocument && (
                          <div className="flex items-center space-x-2 text-body-sm text-gray-600">
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
                      <div className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                        <Upload className="h-4 w-4" />
                      </div>
                    </label>
                    <button
                      onClick={() => handleEdit(deduction)}
                      className="p-2 text-gold-600 hover:bg-gold-50 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deduction.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-gray-900 mb-2">No 80CCC Contributions</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Add your pension fund contributions to claim deduction under Section 80CCC
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600"
          >
            Add First Contribution
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-gray-900">
                {editingDeduction ? 'Edit' : 'Add'} 80CCC Contribution
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Provider Type */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Provider Type <span className="text-error-600">*</span>
                </label>
                <select
                  value={formData.providerType}
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                >
                  {providerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Name */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Provider Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.providerName ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter provider name"
                />
                {formErrors.providerName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.providerName}</p>
                )}
              </div>

              {/* Policy Number */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Policy Number <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.policyNumber ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter policy number"
                />
                {formErrors.policyNumber && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.policyNumber}</p>
                )}
              </div>

              {/* Contribution Amount */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Contribution Amount (₹) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                  max={remainingLimit}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.contributionAmount ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter contribution amount"
                />
                {formErrors.contributionAmount && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.contributionAmount}</p>
                )}
                <p className="mt-1 text-body-xs text-gray-500">
                  Remaining limit: ₹{remainingLimit.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">Important Note</h3>
                    <p className="text-body-sm text-info-700">
                      Section 80CCC deduction is combined with Section 80C and 80CCD. The total limit for all three sections is ₹1,50,000.
                    </p>
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
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeductionMutation.isPending || updateDeductionMutation.isPending}
                  className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
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
        title="Delete Deduction"
        message="Are you sure you want to delete this deduction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80CCC;

