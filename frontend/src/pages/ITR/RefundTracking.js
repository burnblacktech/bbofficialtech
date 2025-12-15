// =====================================================
// REFUND TRACKING PAGE
// Dedicated page for tracking refund status and history
// =====================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Calendar } from 'lucide-react';
import RefundStatusCard from '../../components/ITR/RefundStatusCard';
import RefundHistoryTable from '../../components/ITR/RefundHistoryTable';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { cn } from '../../lib/utils';
import { enterpriseLogger } from '../../utils/logger';

const RefundTracking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filingId = searchParams.get('filingId');

  const [refund, setRefund] = useState(null);
  const [refundHistory, setRefundHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateAccountModal, setShowUpdateAccountModal] = useState(false);
  const [showReissueModal, setShowReissueModal] = useState(false);

  useEffect(() => {
    if (filingId) {
      loadRefundStatus();
    }
    loadRefundHistory();
  }, [filingId]);

  const loadRefundStatus = async () => {
    if (!filingId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/itr/filings/${filingId}/refund/status`);
      if (response.data.success) {
        setRefund(response.data.refund);
      }
    } catch (error) {
      enterpriseLogger.error('Error loading refund status:', { error });
      toast.error('Failed to load refund status');
    } finally {
      setLoading(false);
    }
  };

  const loadRefundHistory = async () => {
    try {
      const response = await apiClient.get('/itr/refunds/history');
      if (response.data.success) {
        setRefundHistory(response.data.refunds || []);
      }
    } catch (error) {
      enterpriseLogger.error('Error loading refund history:', { error });
      toast.error('Failed to load refund history');
    }
  };

  const handleRefresh = async () => {
    setUpdating(true);
    try {
      if (filingId) {
        await loadRefundStatus();
      }
      await loadRefundHistory();
      toast.success('Refund status refreshed');
    } catch (error) {
      toast.error('Failed to refresh refund status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAccount = async (bankAccount) => {
    if (!filingId) return;

    try {
      setUpdating(true);
      const response = await apiClient.post(`/itr/filings/${filingId}/refund/update-account`, {
        bankAccount,
      });

      if (response.data.success) {
        setRefund(response.data.refund);
        setShowUpdateAccountModal(false);
        toast.success('Bank account updated successfully');
      }
    } catch (error) {
      enterpriseLogger.error('Error updating bank account:', { error });
      toast.error(error.response?.data?.error || 'Failed to update bank account');
    } finally {
      setUpdating(false);
    }
  };

  const handleReissueRequest = async (reason) => {
    if (!filingId) return;

    try {
      setUpdating(true);
      const response = await apiClient.post(`/itr/filings/${filingId}/refund/reissue-request`, {
        reason,
      });

      if (response.data.success) {
        setRefund(response.data.refund);
        setShowReissueModal(false);
        toast.success('Refund re-issue request submitted successfully');
      }
    } catch (error) {
      enterpriseLogger.error('Error requesting refund reissue:', { error });
      toast.error(error.response?.data?.error || 'Failed to request refund reissue');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gold-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-body-md text-gray-600">Loading refund status...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-body-md text-gray-600 hover:text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display-md text-gray-900">Refund Tracking</h1>
              <p className="text-body-md text-gray-600 mt-1">
                Track your ITR refund status and history
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={updating}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white"
            >
              <RefreshCw className={cn('h-4 w-4', updating && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Refund Status */}
        {filingId && refund && (
          <div className="mb-8">
            <h2 className="text-heading-lg text-gray-900 mb-4">Current Refund Status</h2>
            <RefundStatusCard
              refund={refund}
              onUpdateAccount={() => setShowUpdateAccountModal(true)}
              onReissueRequest={() => setShowReissueModal(true)}
            />
          </div>
        )}

        {/* Refund History */}
        <div>
          <h2 className="text-heading-lg text-gray-900 mb-4">Refund History</h2>
          <RefundHistoryTable refunds={refundHistory} />
        </div>
    </div>
  );
};

export default RefundTracking;

