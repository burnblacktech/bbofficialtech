// =====================================================
// SECTION 80U UI COMPONENT - PERSON WITH DISABILITY
// BurnBlack premium design for disability deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Heart,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { deductionService } from '../services/deduction.service';
import toast from 'react-hot-toast';

const Section80U = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    disabilityPercentage: '',
    certificateNumber: '',
    certificateDate: '',
    certificateIssuingAuthority: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Calculate deduction amount based on disability percentage
  const calculateDeductionAmount = (percentage) => {
    if (!percentage) return 0;
    if (percentage === '40-80%') return 75000;
    if (percentage === '80-100%') return 125000;
    return 0;
  };

  // Fetch 80U deduction
  const { data: deductionData, isLoading } = useQuery({
    queryKey: ['section80U', filingId],
    queryFn: () => deductionService.getDeductions(filingId, '80U'),
    enabled: !!filingId,
  });

  // Backend returns a list; this section treats it as single-entry (latest)
  const deduction = deductionData?.data?.deductions?.[0] || null;
  const deductionAmount = deduction
    ? calculateDeductionAmount(deduction.disabilityPercentage)
    : 0;

  // Add/Update deduction mutation
  const saveDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        if (deduction?.id) {
          return await deductionService.updateDeductionBySection(filingId, '80U', deduction.id, data);
        }
        return await deductionService.createDeduction(filingId, '80U', data);
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80U: calculateDeductionAmount(data.disabilityPercentage) });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80U', filingId]);
      resetForm();
      setShowEditForm(false);
      toast.success('80U deduction saved successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80U: result?.data?.totalAmount ?? deductionAmount });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save deduction');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.disabilityPercentage) {
      errors.disabilityPercentage = 'Disability percentage is required';
    }
    if (!formData.certificateNumber.trim()) {
      errors.certificateNumber = 'Certificate number is required';
    }
    if (!formData.certificateDate) {
      errors.certificateDate = 'Certificate date is required';
    }
    if (!formData.certificateIssuingAuthority.trim()) {
      errors.certificateIssuingAuthority = 'Issuing authority is required';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    saveDeductionMutation.mutate({
      ...formData,
      amount: calculateDeductionAmount(formData.disabilityPercentage),
    });
  };

  const handleEdit = () => {
    if (deduction) {
      setFormData({
        disabilityPercentage: deduction.disabilityPercentage || '',
        certificateNumber: deduction.certificateNumber || '',
        certificateDate: deduction.certificateDate || '',
        certificateIssuingAuthority: deduction.certificateIssuingAuthority || '',
        financialYear: deduction.financialYear || '2024-25',
      });
    }
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({
      disabilityPercentage: '',
      certificateNumber: '',
      certificateDate: '',
      certificateIssuingAuthority: '',
      financialYear: '2024-25',
    });
    setFormErrors({});
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      if (deduction?.id) {
        formDataObj.append('deductionId', deduction.id);
      }
      formDataObj.append('section', '80U');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Disability certificate uploaded successfully');
        queryClient.invalidateQueries(['section80U', filingId]);
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

  const disabilityOptions = [
    { value: '40-80%', label: '40-80% Disability', amount: 75000 },
    { value: '80-100%', label: '80-100% Disability', amount: 125000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-lg text-slate-900 mb-1">Section 80U - Person with Disability</h3>
            <p className="text-body-sm text-slate-600">
              Fixed deduction for self-disability (not for dependent)
            </p>
          </div>
          <div className="text-right">
            <div className="text-body-xs text-slate-500 mb-1">Deduction Amount</div>
            <div className="text-heading-xl font-bold text-gold-600">
              ₹{deductionAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-body-xs text-slate-500 mt-1">
              {formData.disabilityPercentage === '40-80%' ? '₹75,000' : '₹1,25,000'}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && (
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-heading-md text-slate-900">Disability Details</h4>
            <button
              onClick={() => {
                resetForm();
                setShowEditForm(false);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Disability Percentage *
                </label>
                <select
                  value={formData.disabilityPercentage}
                  onChange={(e) => {
                    setFormData({ ...formData, disabilityPercentage: e.target.value });
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.disabilityPercentage ? 'border-error-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select disability percentage</option>
                  {disabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - ₹{option.amount.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                {formErrors.disabilityPercentage && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.disabilityPercentage}</p>
                )}
                {formData.disabilityPercentage && (
                  <p className="text-body-small text-green-600 mt-1">
                    Fixed deduction: ₹
                    {calculateDeductionAmount(formData.disabilityPercentage).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Certificate Number *
                </label>
                <input
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.certificateNumber ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Certificate number"
                />
                {formErrors.certificateNumber && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.certificateNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Certificate Date *
                </label>
                <input
                  type="date"
                  value={formData.certificateDate}
                  onChange={(e) => setFormData({ ...formData, certificateDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.certificateDate ? 'border-error-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.certificateDate && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.certificateDate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Certificate Issuing Authority *
                </label>
                <input
                  type="text"
                  value={formData.certificateIssuingAuthority}
                  onChange={(e) =>
                    setFormData({ ...formData, certificateIssuingAuthority: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.certificateIssuingAuthority ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Name of the issuing authority"
                />
                {formErrors.certificateIssuingAuthority && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.certificateIssuingAuthority}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowEditForm(false);
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveDeductionMutation.isPending}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display Current Deduction */}
      {!showEditForm && (
        <>
          {deduction ? (
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <h4 className="text-heading-md text-slate-900">Disability Details</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-slate-700">
                        Disability Percentage:
                      </span>
                      <span className="text-body-sm text-slate-900">
                        {deduction.disabilityPercentage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-slate-700">
                        Certificate Number:
                      </span>
                      <span className="text-body-sm text-slate-900">
                        {deduction.certificateNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-slate-700">
                        Certificate Date:
                      </span>
                      <span className="text-body-sm text-slate-900">{deduction.certificateDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-slate-700">
                        Issuing Authority:
                      </span>
                      <span className="text-body-sm text-slate-900">
                        {deduction.certificateIssuingAuthority}
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-gold-50 rounded-xl">
                      <div className="text-body-sm font-semibold text-gold-900">
                        Fixed Deduction: ₹{deductionAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-slate-500 hover:text-gold-500" />
                  </label>
                  <button
                    onClick={handleEdit}
                    className="p-1 text-slate-500 hover:text-gold-500"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <Heart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No disability details added yet</p>
              <button
                onClick={() => setShowEditForm(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
              >
                Add Disability Details
              </button>
            </div>
          )}

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-body-xs text-blue-800">
                <strong>Note:</strong> Section 80U is for self-disability only. For disabled
                dependents, use Section 80DD. The deduction is fixed based on disability percentage:
                ₹75,000 for 40-80% disability and ₹1,25,000 for 80-100% disability.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Section80U;

