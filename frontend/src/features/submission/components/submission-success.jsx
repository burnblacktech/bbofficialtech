// =====================================================
// SUBMISSION SUCCESS COMPONENT
// Success screen after ITR submission
// =====================================================

import React from 'react';
import { CheckCircle, Download, FileText, Mail, Share2 } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';
import { useNavigate } from 'react-router-dom';
import { useExportAcknowledgmentPDF } from '../../pdf-export/hooks/use-pdf-export';
import PDFExportButton from '../../pdf-export/components/pdf-export-button';

const SubmissionSuccess = ({ submissionData, onDownloadITRV, onDownloadITR }) => {
  const navigate = useNavigate();
  const exportAcknowledgmentPDF = useExportAcknowledgmentPDF();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-success-600" />
        </div>
        <h2 className="text-heading-xl text-gray-800 mb-2">
          ITR Submitted Successfully!
        </h2>
        <p className="text-body-lg text-slate-600">
          Your Income Tax Return has been successfully filed and e-verified
        </p>
      </div>

      {/* Acknowledgment Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-heading-md text-gray-800 mb-4">Submission Details</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-body-md text-slate-600">Acknowledgment Number</span>
            <span className="text-body-md font-semibold text-gray-800 font-mono">
              {submissionData?.acknowledgmentNumber || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-body-md text-slate-600">Submission Date</span>
            <span className="text-body-md font-medium text-gray-800">
              {formatDate(submissionData?.submittedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-body-md text-slate-600">Verification Method</span>
            <span className="text-body-md font-medium text-gray-800">
              {submissionData?.verificationMethod || 'Aadhaar OTP'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-body-md text-slate-600">Assessment Year</span>
            <span className="text-body-md font-medium text-gray-800">
              {submissionData?.assessmentYear || '2024-25'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PDFExportButton
          onExport={() => {
            if (submissionData?.filingId) {
              exportAcknowledgmentPDF.mutate({
                filingId: submissionData.filingId,
                filename: `acknowledgment-${submissionData.acknowledgmentNumber || submissionData.filingId}.pdf`,
              });
            }
          }}
          isLoading={exportAcknowledgmentPDF.isPending}
          disabled={!submissionData?.filingId}
          label="Download Acknowledgment PDF"
          variant="primary"
          size="medium"
          className="w-full"
        />
        <Button
          variant="outline"
          onClick={onDownloadITRV}
          className="w-full flex items-center justify-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Download ITR-V
        </Button>
        <Button
          variant="outline"
          onClick={onDownloadITR}
          className="w-full flex items-center justify-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          Download Filed ITR
        </Button>
      </div>

      {/* Next Steps */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-6">
        <h4 className="text-body-md font-semibold text-info-900 mb-3">Next Steps</h4>
        <ul className="space-y-2 text-body-sm text-info-700">
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-info-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Save your acknowledgment number for future reference. You'll receive a confirmation
              email shortly.
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-info-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              If you're expecting a refund, it will be processed within 30-45 days of verification.
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-info-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Track your refund status in the dashboard or on the Income Tax Department portal.
            </span>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => navigate('/itr/filings')}
        >
          View Filing History
        </Button>
      </div>
    </div>
  );
};

export default SubmissionSuccess;

