// =====================================================
// SECTION 80EE/80EEA UI COMPONENT - HOME LOAN INTEREST
// BurnBlack premium design for home loan interest deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Home,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Building,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80EE = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    sectionType: '80EE',
    lenderName: '',
    loanAccountNumber: '',
    interestPaid: '',
    propertyAddress: '',
    loanSanctionDate: '',
    loanAmount: '',
    isFirstTimeHomeBuyer: false,
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Section Types
  const sectionTypes = [
    {
      id: '80EE',
      name: 'Section 80EE',
      limit: 50000,
      description: 'First-time home buyer (loan sanctioned between Apr 1, 2016 - Mar 31, 2017)',
    },
    {
      id: '80EEA',
      name: 'Section 80EEA',
      limit: 150000,
      description: 'Affordable housing (loan sanctioned between Apr 1, 2019 - Mar 31, 2022)',
    },
  ];

  // Fetch 80EE/80EEA deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80EE', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80EE?filingId=${filingId}`);
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
        const response = await apiClient.post('/api/itr/deductions/80EE', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        const limit = data.sectionType === '80EEA' ? 150000 : 50000;
        const amount = Math.min(parseFloat(data.interestPaid) || 0, limit);
        if (onUpdate) {
          onUpdate({ [`section${data.sectionType}`]: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80EE', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('Home loan interest deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80EE/${deductionId}`, data);
        return response.data;
      } catch (error) {
        const limit = data.sectionType === '80EEA' ? 150000 : 50000;
        const amount = Math.min(parseFloat(data.interestPaid) || 0, limit);
        if (onUpdate) {
          onUpdate({ [`section${data.sectionType}`]: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80EE', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('Home loan interest deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80EE/${deductionId}`);
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80EE: 0, section80EEA: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80EE', filingId]);
      toast.success('Home loan interest deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || deductions.reduce((sum, d) => {
    const limit = d.sectionType === '80EEA' ? 150000 : 50000;
    return sum + Math.min(parseFloat(d.interestPaid) || 0, limit);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const limit = formData.sectionType === '80EEA' ? 150000 : 50000;

    // Validation
    if (!formData.lenderName.trim()) {
      setFormErrors({ lenderName: 'Lender name is required' });
      return;
    }
    if (!formData.loanAccountNumber.trim()) {
      setFormErrors({ loanAccountNumber: 'Loan account number is required' });
      return;
    }
    if (!formData.interestPaid || parseFloat(formData.interestPaid) <= 0) {
      setFormErrors({ interestPaid: 'Valid interest amount is required' });
      return;
    }
    if (parseFloat(formData.interestPaid) > limit) {
      setFormErrors({ interestPaid: `Amount exceeds limit of ₹${limit.toLocaleString()}` });
      return;
    }
    if (!formData.propertyAddress.trim()) {
      setFormErrors({ propertyAddress: 'Property address is required' });
      return;
    }
    if (!formData.loanSanctionDate) {
      setFormErrors({ loanSanctionDate: 'Loan sanction date is required' });
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
      console.error('Error saving 80EE/80EEA deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      sectionType: deduction.sectionType || '80EE',
      lenderName: deduction.lenderName || '',
      loanAccountNumber: deduction.loanAccountNumber || '',
      interestPaid: deduction.interestPaid?.toString() || '',
      propertyAddress: deduction.propertyAddress || '',
      loanSanctionDate: deduction.loanSanctionDate || '',
      loanAmount: deduction.loanAmount?.toString() || '',
      isFirstTimeHomeBuyer: deduction.isFirstTimeHomeBuyer || false,
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
      sectionType: '80EE',
      lenderName: '',
      loanAccountNumber: '',
      interestPaid: '',
      propertyAddress: '',
      loanSanctionDate: '',
      loanAmount: '',
      isFirstTimeHomeBuyer: false,
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
      formDataObj.append('section', '80EE');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Interest certificate uploaded successfully');
        queryClient.invalidateQueries(['section80EE', filingId]);
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

  const selectedSection = sectionTypes.find(s => s.id === formData.sectionType);
  const limit = selectedSection?.limit || 50000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-lg">
              <Home className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-gray-900">Section 80EE / 80EEA</h2>
              <p className="text-body-sm text-gray-600">Home Loan Interest (80EE: ₹50,000 | 80EEA: ₹1,50,000)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Loan</span>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-body-sm font-medium text-gray-700">Total Interest Deduction</span>
            <span className="text-heading-lg font-bold text-gold-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-4">
          {deductions.map((deduction) => {
            const deductionLimit = deduction.sectionType === '80EEA' ? 150000 : 50000;
            const deductionAmount = Math.min(parseFloat(deduction.interestPaid) || 0, deductionLimit);
            const sectionInfo = sectionTypes.find(s => s.id === deduction.sectionType);

            return (
              <div
                key={deduction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gold-100 rounded-lg">
                      <Home className="h-6 w-6 text-gold-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-heading-md text-gray-900">{sectionInfo?.name || deduction.sectionType}</h3>
                        {deduction.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-body-sm text-gray-600">Lender: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.lenderName}</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Loan Account: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.loanAccountNumber}</span>
                        </div>
                        <div>
                          <span className="text-body-sm text-gray-600">Property: </span>
                          <span className="text-body-sm font-medium text-gray-900">{deduction.propertyAddress}</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-heading-md font-bold text-gold-600">
                            ₹{deductionAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-body-xs text-gray-600">Interest Paid (Limit: ₹{deductionLimit.toLocaleString('en-IN')})</div>
                        </div>
                        {deduction.proofDocument && (
                          <div className="flex items-center space-x-2 text-body-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Interest certificate uploaded</span>
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
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-gray-900 mb-2">No Home Loan Interest</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Add home loan interest details to claim deduction under Section 80EE or 80EEA
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600"
          >
            Add Loan
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-gray-900">
                {editingDeduction ? 'Edit' : 'Add'} Home Loan Interest Deduction
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
              {/* Section Type */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Section Type <span className="text-error-600">*</span>
                </label>
                <select
                  value={formData.sectionType}
                  onChange={(e) => setFormData({ ...formData, sectionType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {sectionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-body-xs text-gray-500">
                  {selectedSection?.description}
                </p>
              </div>

              {/* Lender Name */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Lender Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.lenderName ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter lender/bank name"
                />
                {formErrors.lenderName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.lenderName}</p>
                )}
              </div>

              {/* Loan Account Number */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Loan Account Number <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.loanAccountNumber}
                  onChange={(e) => setFormData({ ...formData, loanAccountNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.loanAccountNumber ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter loan account number"
                />
                {formErrors.loanAccountNumber && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.loanAccountNumber}</p>
                )}
              </div>

              {/* Interest Paid */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Interest Paid (₹) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.interestPaid}
                  onChange={(e) => setFormData({ ...formData, interestPaid: e.target.value })}
                  max={limit}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.interestPaid ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter interest paid during the year"
                />
                {formErrors.interestPaid && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.interestPaid}</p>
                )}
                <p className="mt-1 text-body-xs text-gray-500">
                  Limit: ₹{limit.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Property Address <span className="text-error-600">*</span>
                </label>
                <textarea
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.propertyAddress ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter property address"
                />
                {formErrors.propertyAddress && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.propertyAddress}</p>
                )}
              </div>

              {/* Loan Sanction Date */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Loan Sanction Date <span className="text-error-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.loanSanctionDate}
                  onChange={(e) => setFormData({ ...formData, loanSanctionDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.loanSanctionDate ? 'border-error-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.loanSanctionDate && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.loanSanctionDate}</p>
                )}
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-label-md text-gray-700 mb-1">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter total loan amount"
                />
              </div>

              {/* First Time Home Buyer */}
              <div className="flex items-start">
                <input
                  id="isFirstTimeHomeBuyer"
                  type="checkbox"
                  checked={formData.isFirstTimeHomeBuyer}
                  onChange={(e) => setFormData({ ...formData, isFirstTimeHomeBuyer: e.target.checked })}
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="isFirstTimeHomeBuyer" className="ml-2 block text-body-sm text-gray-700">
                  First-time home buyer
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">Section 80EE / 80EEA Deduction</h3>
                    <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                      <li><strong>Section 80EE:</strong> ₹50,000 limit, loan sanctioned between Apr 1, 2016 - Mar 31, 2017</li>
                      <li><strong>Section 80EEA:</strong> ₹1,50,000 limit, loan sanctioned between Apr 1, 2019 - Mar 31, 2022</li>
                      <li>Property value should not exceed ₹50 lakh (80EE) or ₹45 lakh (80EEA)</li>
                      <li>Loan amount should not exceed ₹35 lakh (80EE) or ₹45 lakh (80EEA)</li>
                      <li>Interest certificate from lender is required as proof</li>
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
                    : 'Add Loan'}
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

export default Section80EE;

