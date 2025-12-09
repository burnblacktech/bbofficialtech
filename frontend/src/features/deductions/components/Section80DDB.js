// =====================================================
// SECTION 80DDB UI COMPONENT - MEDICAL TREATMENT
// BurnBlack premium design for medical treatment deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  User,
  Calendar,
  Building,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80DDB = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    patientName: '',
    relationship: '',
    disease: '',
    treatmentDate: '',
    hospitalName: '',
    hospitalAddress: '',
    amount: '',
    isSeniorCitizen: false,
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const relationships = [
    { id: 'self', name: 'Self' },
    { id: 'spouse', name: 'Spouse' },
    { id: 'child', name: 'Child' },
    { id: 'parent', name: 'Parent' },
    { id: 'sibling', name: 'Sibling' },
    { id: 'other', name: 'Other' },
  ];

  const specifiedDiseases = [
    'Neurological Diseases',
    'Malignant Cancers',
    'Full Blown Acquired Immuno-Deficiency Syndrome (AIDS)',
    'Chronic Renal failure',
    'Haemophilia',
    'Thalassaemia',
  ];

  // Fetch 80DDB deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80DDB', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80DDB?filingId=${filingId}`);
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
        const response = await apiClient.post('/api/itr/deductions/80DDB', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        const limit = data.isSeniorCitizen ? 100000 : 40000;
        const amount = Math.min(parseFloat(data.amount) || 0, limit);
        if (onUpdate) {
          onUpdate({ section80DDB: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DDB', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80DDB deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80DDB/${deductionId}`, data);
        return response.data;
      } catch (error) {
        const limit = data.isSeniorCitizen ? 100000 : 40000;
        const amount = Math.min(parseFloat(data.amount) || 0, limit);
        if (onUpdate) {
          onUpdate({ section80DDB: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DDB', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('80DDB deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80DDB/${deductionId}`);
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80DDB: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80DDB', filingId]);
      toast.success('80DDB deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || deductions.reduce((sum, d) => {
    const limit = d.isSeniorCitizen ? 100000 : 40000;
    return sum + Math.min(parseFloat(d.amount) || 0, limit);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    if (!formData.patientName.trim()) {
      setFormErrors({ patientName: 'Patient name is required' });
      return;
    }
    if (!formData.relationship) {
      setFormErrors({ relationship: 'Relationship is required' });
      return;
    }
    if (!formData.disease) {
      setFormErrors({ disease: 'Disease is required' });
      return;
    }
    if (!formData.treatmentDate) {
      setFormErrors({ treatmentDate: 'Treatment date is required' });
      return;
    }
    if (!formData.hospitalName.trim()) {
      setFormErrors({ hospitalName: 'Hospital name is required' });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormErrors({ amount: 'Valid treatment amount is required' });
      return;
    }

    const limit = formData.isSeniorCitizen ? 100000 : 40000;
    if (parseFloat(formData.amount) > limit) {
      setFormErrors({ amount: `Amount exceeds limit of ₹${limit.toLocaleString()}` });
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
      console.error('Error saving 80DDB deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      patientName: deduction.patientName || '',
      relationship: deduction.relationship || '',
      disease: deduction.disease || '',
      treatmentDate: deduction.treatmentDate || '',
      hospitalName: deduction.hospitalName || '',
      hospitalAddress: deduction.hospitalAddress || '',
      amount: deduction.amount?.toString() || '',
      isSeniorCitizen: deduction.isSeniorCitizen || false,
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
      patientName: '',
      relationship: '',
      disease: '',
      treatmentDate: '',
      hospitalName: '',
      hospitalAddress: '',
      amount: '',
      isSeniorCitizen: false,
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
      formDataObj.append('section', '80DDB');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Medical bills uploaded successfully');
        queryClient.invalidateQueries(['section80DDB', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload bills');
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

  const limit = formData.isSeniorCitizen ? 100000 : 40000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-lg">
              <Activity className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-gray-900">Section 80DDB</h2>
              <p className="text-body-sm text-gray-600">Medical Treatment (Self/Dependent: ₹40,000 | Senior Citizen: ₹1,00,000)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Treatment</span>
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
            const deductionLimit = deduction.isSeniorCitizen ? 100000 : 40000;
            const deductionAmount = Math.min(parseFloat(deduction.amount) || 0, deductionLimit);

            return (
              <div
                key={deduction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gold-100 rounded-lg">
                      <Activity className="h-6 w-6 text-gold-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-heading-md text-gray-900">{deduction.patientName}</h3>
                        {deduction.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {deduction.isSeniorCitizen && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Senior Citizen
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
                          <span className="text-body-sm text-gray-600">Disease: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.disease}</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Hospital: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.hospitalName}</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Treatment Date: </span>
                          <span className="text-body-sm font-medium text-gray-900">
                            {new Date(deduction.treatmentDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="text-heading-md font-bold text-gold-600">
                            ₹{deductionAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-body-xs text-gray-600">Treatment Amount (Limit: ₹{deductionLimit.toLocaleString('en-IN')})</div>
                        </div>
                        {deduction.proofDocument && (
                          <div className="flex items-center space-x-2 text-body-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Medical bills uploaded</span>
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
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-gray-900 mb-2">No Medical Treatments</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Add medical treatment details for specified diseases to claim deduction under Section 80DDB
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600"
          >
            Add Treatment
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-gray-900">
                {editingDeduction ? 'Edit' : 'Add'} 80DDB Deduction
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
              {/* Patient Name */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Patient Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.patientName ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter patient name"
                />
                {formErrors.patientName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.patientName}</p>
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

              {/* Disease */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Specified Disease <span className="text-error-600">*</span>
                </label>
                <select
                  value={formData.disease}
                  onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.disease ? 'border-error-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select disease</option>
                  {specifiedDiseases.map((disease) => (
                    <option key={disease} value={disease}>
                      {disease}
                    </option>
                  ))}
                </select>
                {formErrors.disease && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.disease}</p>
                )}
              </div>

              {/* Treatment Date */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Treatment Date <span className="text-error-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.treatmentDate}
                  onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.treatmentDate ? 'border-error-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.treatmentDate && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.treatmentDate}</p>
                )}
              </div>

              {/* Hospital Name */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Hospital Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.hospitalName ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter hospital name"
                />
                {formErrors.hospitalName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.hospitalName}</p>
                )}
              </div>

              {/* Hospital Address */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Hospital Address
                </label>
                <textarea
                  value={formData.hospitalAddress}
                  onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter hospital address"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Treatment Amount (₹) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  max={limit}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.amount ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter treatment amount"
                />
                {formErrors.amount && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.amount}</p>
                )}
                <p className="mt-1 text-body-xs text-gray-500">
                  Limit: ₹{limit.toLocaleString('en-IN')} {formData.isSeniorCitizen && '(Senior Citizen)'}
                </p>
              </div>

              {/* Senior Citizen Checkbox */}
              <div className="flex items-start">
                <input
                  id="isSeniorCitizen"
                  type="checkbox"
                  checked={formData.isSeniorCitizen}
                  onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="isSeniorCitizen" className="ml-2 block text-body-sm text-gray-700">
                  Patient is a Senior Citizen (60+ years) - Higher limit of ₹1,00,000 applies
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">Section 80DDB Deduction Limits</h3>
                    <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                      <li>Self or Dependent (non-senior): ₹40,000</li>
                      <li>Senior Citizen (60+ years): ₹1,00,000</li>
                      <li>Only for specified diseases listed above</li>
                      <li>Medical bills and prescription required as proof</li>
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
                    : 'Add Treatment'}
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

export default Section80DDB;

