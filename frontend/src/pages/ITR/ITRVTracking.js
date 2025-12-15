// =====================================================
// ITR-V TRACKING PAGE
// Dedicated page for tracking ITR-V processing and verification
// =====================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import ITRVStatusCard from '../../components/ITR/ITRVStatusCard';
import ITRVTimeline from '../../components/ITR/ITRVTimeline';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { cn } from '../../lib/utils';
import { enterpriseLogger } from '../../utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/common/Modal';

const ITRVTracking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const filingId = searchParams.get('filingId');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('');

  const { data: itrvData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['itrvStatus', filingId],
    queryFn: async () => {
      if (!filingId) return null;
      const response = await apiClient.get(`/itr/filings/${filingId}/itrv/status`);
      return response.data.data;
    },
    enabled: !!filingId,
    staleTime: 60 * 1000, // 1 minute
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/itr/filings/${filingId}/itrv/initialize`);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('ITR-V tracking initialized successfully!');
      queryClient.invalidateQueries(['itrvStatus', filingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to initialize ITR-V tracking');
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/itr/filings/${filingId}/itrv/check-status`);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Status checked from portal');
      queryClient.invalidateQueries(['itrvStatus', filingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to check status from portal');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (method) => {
      const response = await apiClient.post(`/itr/filings/${filingId}/itrv/verify`, {
        verificationMethod: method,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('ITR-V marked as verified successfully!');
      setShowVerifyModal(false);
      setVerificationMethod('');
      queryClient.invalidateQueries(['itrvStatus', filingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify ITR-V');
    },
  });

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const handleCheckStatus = () => {
    checkStatusMutation.mutate();
  };

  const handleDownload = () => {
    if (itrvData?.documentUrl) {
      window.open(itrvData.documentUrl, '_blank');
    } else {
      toast.error('ITR-V document URL not available');
    }
  };

  const handleVerify = () => {
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = () => {
    if (!verificationMethod) {
      toast.error('Please select a verification method');
      return;
    }
    verifyMutation.mutate(verificationMethod);
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading ITR-V status...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm border border-error-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-error-600" />
            <h3 className="text-lg font-semibold text-error-900">Error Loading ITR-V Status</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!itrvData && !filingId) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Filing Selected</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please select a filing to view ITR-V tracking information.
          </p>
          <Button variant="primary" onClick={() => navigate('/itr/filings')}>
            View My Filings
          </Button>
        </div>
      </div>
    );
  }

  if (!itrvData) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ITR-V Tracking Not Initialized</h3>
          <p className="text-sm text-gray-600 mb-4">
            ITR-V tracking has not been initialized for this filing. Initialize it to start tracking.
          </p>
          <Button
            variant="primary"
            onClick={handleInitialize}
            disabled={initializeMutation.isPending}
            icon={initializeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          >
            {initializeMutation.isPending ? 'Initializing...' : 'Initialize ITR-V Tracking'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ITR-V Tracking</h1>
          <p className="text-sm text-gray-600">
            Track the status of your ITR-V processing and verification
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-6">
          <ITRVStatusCard
            itrv={itrvData}
            onCheckStatus={handleCheckStatus}
            onDownload={handleDownload}
            onVerify={handleVerify}
          />
        </div>

        {/* Timeline */}
        {itrvData.timeline && itrvData.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Timeline</h2>
            <ITRVTimeline timeline={itrvData.timeline} />
          </div>
        )}

        {/* Verify Modal */}
        {showVerifyModal && (
          <Modal
            isOpen={showVerifyModal}
            onClose={() => {
              setShowVerifyModal(false);
              setVerificationMethod('');
            }}
            title="Verify ITR-V"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select the verification method you used to verify your ITR-V:
              </p>
              <Select
                label="Verification Method"
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value)}
                options={[
                  { value: '', label: 'Select method...' },
                  { value: 'AADHAAR_OTP', label: 'Aadhaar OTP' },
                  { value: 'NETBANKING', label: 'Net Banking' },
                  { value: 'DSC', label: 'Digital Signature Certificate (DSC)' },
                  { value: 'EVC', label: 'Bank Account EVC' },
                  { value: 'MANUAL', label: 'Manual Verification' },
                ]}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerificationMethod('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleVerifySubmit}
                  disabled={!verificationMethod || verifyMutation.isPending}
                  icon={verifyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {verifyMutation.isPending ? 'Verifying...' : 'Mark as Verified'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
};

export default ITRVTracking;

