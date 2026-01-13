import React, { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Download,
  FileText,
  Calendar,
  User,
  Shield,
  ArrowLeft,
  Printer,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { enterpriseLogger } from '../utils/logger';
import itrService from '../services/api/itrService';
import { ensureJourneyStart, trackEvent } from '../utils/analyticsEvents';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../components/DesignSystem/EnterpriseComponents';

const Acknowledgment = () => {
  const { filingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State for UI interactions - Justification: Track user actions and UI state
  const [isDownloading, setIsDownloading] = useState(false); // Justification: Show loading state during download
  const [isPrinting, setIsPrinting] = useState(false); // Justification: Show loading state during print
  const [isSharing, setIsSharing] = useState(false); // Justification: Show loading state during share

  // Get acknowledgment number from navigation state - Justification: Pass data between pages
  const ackNumberFromState = location.state?.ackNumber || location.state?.acknowledgmentNumber || null;

  // Funnel analytics: acknowledgment view
  React.useEffect(() => {
    ensureJourneyStart();
    trackEvent('itr_ack_view', {
      filingId: filingId || null,
      ackNumber: ackNumberFromState || null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch filing details - Justification: Display complete filing information
  const { data: filingResponse, isLoading: filingLoading } = useQuery(
    ['filing', filingId],
    () => itrService.getFilingById(filingId),
    {
      enabled: !!filingId,
      onError: (error) => {
        toast.error('Failed to load filing details');
        enterpriseLogger.error('Failed to load filing details', { error, filingId });
      },
    },
  );

  const filing = filingResponse?.filing || null;
  const ackNumber = useMemo(() => {
    return ackNumberFromState || filing?.acknowledgmentNumber || null;
  }, [ackNumberFromState, filing?.acknowledgmentNumber]);

  const statusLabel = useMemo(() => {
    const s = String(filing?.status || '').toLowerCase();
    if (!s) return 'Unknown';
    if (s === 'submitted') return 'Submitted';
    if (s === 'acknowledged') return 'Acknowledged';
    if (s === 'processed') return 'Processed';
    if (s === 'paused') return 'Paused';
    if (s === 'draft') return 'Draft';
    return s;
  }, [filing?.status]);

  // Handle download acknowledgment - Justification: Allow users to save acknowledgment as PDF
  const handleDownloadAcknowledgment = async () => {
    if (!filingId) {
      toast.error('Filing ID is required');
      return;
    }

    setIsDownloading(true);
    try {
      // downloadAcknowledgment already handles the download internally
      await itrService.downloadAcknowledgment(filingId);
      toast.success('Acknowledgment downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download acknowledgment');
      enterpriseLogger.error('Download acknowledgment failed', { error, filingId });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle print acknowledgment - Justification: Allow users to print acknowledgment
  const handlePrintAcknowledgment = () => {
    setIsPrinting(true);
    try {
      window.print();
      toast.success('Print dialog opened!');
    } catch (error) {
      toast.error('Failed to open print dialog');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle share acknowledgment - Justification: Allow users to share acknowledgment via email
  const handleShareAcknowledgment = () => {
    setIsSharing(true);
    try {
      const subject = `ITR Filing Acknowledgment - ${ackNumber}`;
      const itrType = filing?.itrType || filing?.itr_type || 'N/A';
      const ay = filing?.assessmentYear || filing?.assessment_year || 'N/A';
      const body = `Dear Taxpayer,\n\nYour ITR filing has been successfully submitted.\n\nAcknowledgment Number: ${ackNumber}\nFiling Date: ${new Date().toLocaleDateString()}\nITR Type: ${filing?.filing?.itr_type}\nAssessment Year: ${filing?.filing?.assessment_year}\n\nThank you for using our platform.\n\nBest regards,\nBurnblack Team`;
      const safeBody = `Dear Taxpayer,\n\nYour ITR filing has been successfully submitted.\n\nAcknowledgment Number: ${ackNumber || 'Pending'}\nFiling Date: ${filing?.submittedAt ? new Date(filing.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}\nITR Type: ${itrType}\nAssessment Year: ${ay}\n\nThank you for using our platform.\n\nBest regards,\nBurnblack Team`;

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(safeBody)}`;
      window.open(mailtoLink);
      toast.success('Email client opened!');
    } catch (error) {
      toast.error('Failed to open email client');
    } finally {
      setIsSharing(false);
    }
  };

  // Loading state - Justification: Better UX during data fetching
  if (filingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Header - Justification: Clear confirmation of successful filing */}
      <div className="bg-white shadow rounded-xl mb-6">
        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h1 className="text-heading-2 font-bold text-slate-900 mb-2">
            Filing Submitted Successfully!
          </h1>
          <p className="text-slate-600 mb-6">
            Your ITR has been successfully submitted to the Income Tax Department.
          </p>

          {/* Acknowledgment Number - Justification: Most important information prominently displayed */}
          <div className="bg-success-50 border border-success-200 rounded-xl p-4 mb-6">
            <h2 className="text-heading-4 font-semibold text-success-800 mb-2">
              Acknowledgment Number
            </h2>
            <p className="text-heading-2 font-mono font-bold text-success-900">
              {ackNumber || 'Pending (use Filing ID below)'}
            </p>
            {!ackNumber && filingId && (
              <p className="text-body-small text-success-800 mt-1 font-mono break-all">
                Filing ID: {filingId}
              </p>
            )}
            <p className="text-body-regular text-success-700 mt-1">
              Please save this number for future reference
            </p>
          </div>
        </div>
      </div>

      {/* Filing Details - Justification: Complete filing summary for user reference */}
      <div className="bg-white shadow rounded-xl mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-heading-4 font-medium text-slate-900">Filing Details</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">Taxpayer Name</p>
                  <p className="text-body-regular text-slate-600">
                    {filing?.formData?.personalInfo?.fullName ||
                      filing?.formData?.personal_info?.full_name ||
                      'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FileText className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">ITR Type</p>
                  <p className="text-body-regular text-slate-600">{filing?.itrType || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">Assessment Year</p>
                  <p className="text-body-regular text-slate-600">{filing?.assessmentYear || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">Submission Date</p>
                  <p className="text-body-regular text-slate-600">
                    {filing?.submittedAt ? new Date(filing.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Shield className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">Verification Method</p>
                  <p className="text-body-regular text-slate-600">
                    {filing?.verificationMethod || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-body-regular font-medium text-slate-900">Status</p>
                  <p className="text-body-regular text-success-600 font-medium">{statusLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information - Justification: Legal and procedural information */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-6 mb-6">
        <h3 className="text-heading-4 font-medium text-info-900 mb-3">Important Information</h3>
        <div className="space-y-3 text-body-regular text-info-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-info-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              Your acknowledgment number serves as proof of filing. Please keep it safe.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-info-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              You can track your filing status on the Income Tax Department website using your PAN.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-info-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              If you need to make any corrections, you can file a revised return within the specified time limit.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-info-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              Keep all supporting documents safe for at least 6 years as per Income Tax Act.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Justification: Allow users to download, print, and share acknowledgment */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-heading-4 font-medium text-slate-900 mb-4">What would you like to do next?</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Download Acknowledgment */}
          <button
            onClick={handleDownloadAcknowledgment}
            disabled={isDownloading}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">
              {isDownloading ? 'Downloading...' : 'Download'}
            </span>
            <span className="text-body-small text-slate-500">Save as PDF</span>
          </button>

          {/* Track ITR-V */}
          <button
            onClick={() => navigate(`/itr/itrv-tracking?filingId=${filingId}`)}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50"
            disabled={!filingId}
          >
            <FileText className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">Track ITR-V</span>
            <span className="text-body-small text-slate-500">Verification status</span>
          </button>

          {/* Track Refund */}
          <button
            onClick={() => navigate(`/itr/refund-tracking?filingId=${filingId}`)}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50"
            disabled={!filingId}
          >
            <Download className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">Track Refund</span>
            <span className="text-body-small text-slate-500">Refund timeline</span>
          </button>

          {/* Print Acknowledgment */}
          <button
            onClick={handlePrintAcknowledgment}
            disabled={isPrinting}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">
              {isPrinting ? 'Printing...' : 'Print'}
            </span>
            <span className="text-body-small text-slate-500">Print copy</span>
          </button>

          {/* Share Acknowledgment */}
          <button
            onClick={handleShareAcknowledgment}
            disabled={isSharing}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">
              {isSharing ? 'Opening...' : 'Share'}
            </span>
            <span className="text-body-small text-slate-500">Send via email</span>
          </button>

          {/* Back to Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <ArrowLeft className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-body-regular font-medium text-slate-900">Dashboard</span>
            <span className="text-body-small text-slate-500">View all filings</span>
          </button>
        </div>
      </div>

      {/* Next Steps - Justification: Guide users on what to expect next */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-heading-4 font-medium text-slate-900 mb-3">What happens next?</h3>
        <div className="space-y-3 text-body-regular text-slate-700">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              <strong>Processing:</strong> The Income Tax Department will process your return within 2-3 weeks.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              <strong>Intimation:</strong> You will receive an intimation under Section 143(1) if there are any adjustments.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              <strong>Refund:</strong> If you're eligible for a refund, it will be processed and credited to your bank account.
            </p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>
              <strong>Communication:</strong> Any further communication will be sent to your registered email and mobile number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Acknowledgment;
