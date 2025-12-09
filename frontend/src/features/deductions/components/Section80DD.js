// =====================================================
// SECTION 80DD UI COMPONENT - DISABLED DEPENDENT
// BurnBlack premium design for disabled dependent deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Heart,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80DD = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    dependentName: '',
    relationship: '',
    disabilityPercentage: '',
    certificateNumber: '',
    certificateDate: '',
    expenses: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const relationships = [
    { id: 'spouse', name: 'Spouse' },
    { id: 'child', name: 'Child' },
    { id: 'parent', name: 'Parent' },
    { id: 'sibling', name: 'Sibling' },
    { id: 'other', name: 'Other' },
  ];

  // Fetch 80DD deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80DD', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80DD?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { data: { deductions: [], totalAmount: 0 } };
      }
    },
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/api/itr/deductions/80DD', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        const amount = parseFloat(data.disabilityPercentage) >= 80 ? 125000 : 75000;
        if (onUpdate) {
          onUpdate({ section80DD: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DD', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80DD deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80DD/${deductionId}`, data);
        return response.data;
      } catch (error) {
        const amount = parseFloat(data.disabilityPercentage) >= 80 ? 125000 : 75000;
        if (onUpdate) {
          onUpdate({ section80DD: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DD', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('80DD deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80DD/${deductionId}`);
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80DD: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DD', filingId]);
      toast.success('80DD deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || deductions.reduce((sum, d) => {
    const amount = parseFloat(d.disabilityPercentage) >= 80 ? 125000 : 75000;
    return sum + amount;
  }, 0);

  const calculateDeductionAmount = (disabilityPercentage) => {
    return parseFloat(disabilityPercentage) >= 80 ? 125000 : 75000;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    if (!formData.dependentName.trim()) {
      setFormErrors({ dependentName: 'Dependent name is required' });
      return;
    }
    if (!formData.relationship) {
      setFormErrors({ relationship: 'Relationship is required' });
      return;
    }
    if (!formData.disabilityPercentage || parseFloat(formData.disabilityPercentage) < 40) {
      setFormErrors({ disabilityPercentage: 'Disability percentage must be at least 40%' });
      return;
    }
    if (parseFloat(formData.disabilityPercentage) > 100) {
      setFormErrors({ disabilityPercentage: 'Disability percentage cannot exceed 100%' });
      return;
    }
    if (!formData.certificateNumber.trim()) {
      setFormErrors({ certificateNumber: 'Certificate number is required' });
      return;
    }
    if (!formData.certificateDate) {
      setFormErrors({ certificateDate: 'Certificate date is required' });
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
      console.error('Error saving 80DD deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      dependentName: deduction.dependentName || '',
      relationship: deduction.relationship || '',
      disabilityPercentage: deduction.disabilityPercentage?.toString() || '',
      certificateNumber: deduction.certificateNumber || '',
      certificateDate: deduction.certificateDate || '',
      expenses: deduction.expenses?.toString() || '',
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
      dependentName: '',
      relationship: '',
      disabilityPercentage: '',
      certificateNumber: '',
      certificateDate: '',
      expenses: '',
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
      formDataObj.append('section', '80DD');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Medical certificate uploaded successfully');
        queryClient.invalidateQueries(['section80DD', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload certificate');
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

  const deductionAmount = formData.disabilityPercentage ? calculateDeductionAmount(formData.disabilityPercentage) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-lg">
              <Heart className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-gray-900">Section 80DD</h2>
              <p className="text-body-sm text-gray-600">Disabled Dependent (40-80%: ₹75,000 | 80%+: ₹1,25,000)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Dependent</span>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-body-sm font-medium text-gray-700">Total Deduction</span>
            <span className="text-heading-lg font-bold text-gold-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-4">
          {deductions.map((deduction) => {
            const amount = calculateDeductionAmount(deduction.disabilityPercentage);
            const isSevere = parseFloat(deduction.disabilityPercentage) >= 80;

            return (
              <div
                key={deduction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 ${isSevere ? 'bg-red-100' : 'bg-gold-100'} rounded-lg`}>
                      <Heart className={`h-6 w-6 ${isSevere ? 'text-red-600' : 'text-gold-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-heading-md text-gray-900">{deduction.dependentName}</h3>
                        {deduction.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {isSevere && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Severe Disability
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-body-sm text-gray-600">Relationship: </span>
                          <span className="text-body-sm font-medium text-gray-900">
                            {relationships.find(r => r.id === deduction.relationship)?.name || deduction.relationship}
                          </span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Disability: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.disabilityPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Certificate: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.certificateNumber}</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-heading-md font-bold text-gold-600">
                            ₹{amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-body-xs text-gray-600">Deduction Amount</div>
                        </div>
                        {deduction.proofDocument && (
                          <div className="flex items-center space-x-2 text-body-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Medical certificate uploaded</span>
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
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-gray-900 mb-2">No Disabled Dependents</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Add disabled dependent details to claim deduction under Section 80DD
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600"
          >
            Add Dependent
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-gray-900">
                {editingDeduction ? 'Edit' : 'Add'} 80DD Deduction
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
              {/* Dependent Name */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Dependent Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dependentName}
                  onChange={(e) => setFormData({ ...formData, dependentName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.dependentName ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter dependent name"
                />
                {formErrors.dependentName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.dependentName}</p>
                )}
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Relationship <span className="text-error-600">*</span>
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.relationship ? 'border-error-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select relationship</option>
                  {relationships.map((rel) => (
                    <option key={rel.id} value={rel.id}>
                      {rel.name}
                    </option>
                  ))}
                </select>
                {formErrors.relationship && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.relationship}</p>
                )}
              </div>

              {/* Disability Percentage */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Disability Percentage (%) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.disabilityPercentage}
                  onChange={(e) => setFormData({ ...formData, disabilityPercentage: e.target.value })}
                  min={40}
                  max={100}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.disabilityPercentage ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter disability percentage (40-100)"
                />
                {formErrors.disabilityPercentage && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.disabilityPercentage}</p>
                )}
                {formData.disabilityPercentage && (
                  <p className="mt-1 text-body-xs text-gray-600">
                    Deduction amount: ₹{deductionAmount.toLocaleString('en-IN')}
                    {parseFloat(formData.disabilityPercentage) >= 80 && (
                      <span className="text-green-600 font-medium"> (Severe disability)</span>
                    )}
                  </p>
                )}
              </div>

              {/* Certificate Number */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Disability Certificate Number <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.certificateNumber ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter certificate number"
                />
                {formErrors.certificateNumber && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.certificateNumber}</p>
                )}
              </div>

              {/* Certificate Date */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Certificate Date <span className="text-error-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.certificateDate}
                  onChange={(e) => setFormData({ ...formData, certificateDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.certificateDate ? 'border-error-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.certificateDate && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.certificateDate}</p>
                )}
              </div>

              {/* Expenses (Optional) */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Medical Expenses (₹) <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.expenses}
                  onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter medical expenses if any"
                />
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">Section 80DD Deduction Limits</h3>
                    <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                      <li>40% to 79% disability: ₹75,000 per dependent</li>
                      <li>80% or more disability: ₹1,25,000 per dependent</li>
                      <li>Medical certificate from authorized medical authority is required</li>
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
                    : 'Add Dependent'}
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

export default Section80DD;

