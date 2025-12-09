// =====================================================
// AUDIT INFORMATION FORM COMPONENT (Feature-First)
// For ITR-3 forms - Tax audit details
// =====================================================

import React, { useEffect } from 'react';
import { AlertTriangle, FileText, Upload, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuditInformation, useUpdateAuditInformation, useCheckAuditApplicability } from '../hooks/use-audit-information';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { auditInformationSchema } from '../schema/audit-information.schema';

const AuditInformationForm = ({ filingId, selectedITR, onUpdate }) => {
  const isITR3 = selectedITR === 'ITR-3' || selectedITR === 'ITR3';
  const { data: auditInfoData, isLoading, isError } = useAuditInformation(filingId);
  const updateAuditInformationMutation = useUpdateAuditInformation(filingId);
  const checkApplicabilityMutation = useCheckAuditApplicability(filingId);

  const { watch, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(auditInformationSchema),
    defaultValues: auditInfoData || {
      isAuditApplicable: false,
      auditReason: '',
      auditReportNumber: '',
      auditReportDate: '',
      caDetails: {
        caName: '',
        membershipNumber: '',
        firmName: '',
        firmAddress: '',
      },
      bookOfAccountsMaintained: false,
      form3CDFiled: false,
    },
  });

  const auditInfo = watch();
  const auditApplicability = auditInfoData?.applicability || { applicable: false, reasons: [] };

  // Update form when data loads
  useEffect(() => {
    if (auditInfoData) {
      Object.keys(auditInfoData).forEach((key) => {
        if (key !== 'applicability') {
          setValue(key, auditInfoData[key]);
        }
      });
    }
  }, [auditInfoData, setValue]);

  // Check applicability on mount
  useEffect(() => {
    if (filingId && isITR3) {
      checkApplicabilityMutation.mutate();
    }
  }, [filingId, isITR3]);

  // Auto-save on change with debounce
  useEffect(() => {
    if (!filingId || !auditInfo?.isAuditApplicable) return;

    const timeoutId = setTimeout(() => {
      handleSubmit((data) => {
        updateAuditInformationMutation.mutate(data);
        if (onUpdate) {
          onUpdate({ auditInfo: data });
        }
      })();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [auditInfo, filingId, handleSubmit, updateAuditInformationMutation, onUpdate]);

  const handleChange = (field, value) => {
    setValue(field, value);
    if (onUpdate) {
      onUpdate({ auditInfo: { ...auditInfo, [field]: value } });
    }
  };

  const handleCAChange = (field, value) => {
    setValue(`caDetails.${field}`, value);
    if (onUpdate) {
      onUpdate({
        auditInfo: {
          ...auditInfo,
          caDetails: { ...auditInfo.caDetails, [field]: value },
        },
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    toast.success('Audit report uploaded successfully');
    handleChange('auditReportFile', file.name);
  };

  if (!isITR3) {
    return null;
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading audit information...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-600">Error loading audit information</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Tax Audit Information
        </h3>
      </div>

      {/* Audit Applicability Check */}
      {auditApplicability.applicable && (
        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-2">Tax Audit is Applicable (Section 44AB)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                {auditApplicability.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                You must get your accounts audited by a Chartered Accountant and file Form 3CD.
              </p>
            </div>
          </div>
        </div>
      )}

      {!auditApplicability.applicable && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">Tax Audit Not Applicable</h4>
              <p className="text-sm text-green-800 mt-1">
                Based on your turnover/receipts and profit margins, tax audit is not required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Information Form */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="space-y-6">
          {/* Is Audit Applicable */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={auditInfo.isAuditApplicable || false}
                onChange={(e) => handleChange('isAuditApplicable', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Tax audit is applicable (Section 44AB)
              </span>
            </label>
            {auditInfo.isAuditApplicable && auditInfo.auditReason && (
              <p className="text-xs text-gray-600 mt-1 ml-6">{auditInfo.auditReason}</p>
            )}
          </div>

          {auditInfo.isAuditApplicable && (
            <>
              {/* Audit Report Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Audit Report Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audit Report Number *
                    </label>
                    <input
                      type="text"
                      value={auditInfo.auditReportNumber || ''}
                      onChange={(e) => handleChange('auditReportNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Enter audit report number"
                      required={auditInfo.isAuditApplicable}
                    />
                    {errors.auditReportNumber && (
                      <p className="text-xs text-red-600 mt-1">{errors.auditReportNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Audit Report *
                    </label>
                    <input
                      type="date"
                      value={auditInfo.auditReportDate || ''}
                      onChange={(e) => handleChange('auditReportDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      required={auditInfo.isAuditApplicable}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.auditReportDate && (
                      <p className="text-xs text-red-600 mt-1">{errors.auditReportDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Audit Report Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Audit Report (PDF)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {auditInfo.auditReportFile && (
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {auditInfo.auditReportFile}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
                </div>
              </div>

              {/* CA Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Chartered Accountant Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CA Name *
                    </label>
                    <input
                      type="text"
                      value={auditInfo.caDetails?.caName || ''}
                      onChange={(e) => handleCAChange('caName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      required={auditInfo.isAuditApplicable}
                    />
                    {errors.caDetails?.caName && (
                      <p className="text-xs text-red-600 mt-1">{errors.caDetails.caName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Membership Number *
                    </label>
                    <input
                      type="text"
                      value={auditInfo.caDetails?.membershipNumber || ''}
                      onChange={(e) => handleCAChange('membershipNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="ICAI membership number"
                      required={auditInfo.isAuditApplicable}
                    />
                    {errors.caDetails?.membershipNumber && (
                      <p className="text-xs text-red-600 mt-1">{errors.caDetails.membershipNumber.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CA Firm Name
                    </label>
                    <input
                      type="text"
                      value={auditInfo.caDetails?.firmName || ''}
                      onChange={(e) => handleCAChange('firmName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CA Firm Address
                    </label>
                    <textarea
                      value={auditInfo.caDetails?.firmAddress || ''}
                      onChange={(e) => handleCAChange('firmAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auditInfo.bookOfAccountsMaintained || false}
                      onChange={(e) => handleChange('bookOfAccountsMaintained', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-gold-500"
                    />
                    <span className="text-sm text-gray-700">
                      Book of accounts maintained as per Income Tax Act
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auditInfo.form3CDFiled || false}
                      onChange={(e) => handleChange('form3CDFiled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-gold-500"
                    />
                    <span className="text-sm text-gray-700">
                      Form 3CD has been filed
                    </span>
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Audit report must be obtained before the due date of filing return</li>
                      <li>Form 3CD must be filed along with the audit report</li>
                      <li>Failure to get accounts audited may result in penalty</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditInformationForm;

