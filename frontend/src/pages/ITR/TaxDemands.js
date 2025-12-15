// =====================================================
// TAX DEMANDS PAGE
// Main page for managing tax demands
// =====================================================

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertCircle, CheckCircle, Clock, IndianRupee, TrendingUp, FileText } from 'lucide-react';
import StatusBadge from '../../components/DesignSystem/StatusBadge';
import DemandCard from '../../components/ITR/DemandCard';
import DemandPaymentForm from '../../components/ITR/DemandPaymentForm';
import DemandDisputeForm from '../../components/ITR/DemandDisputeForm';
import NoticeTimeline from '../../components/ITR/NoticeTimeline';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { cn } from '../../lib/utils';
import { enterpriseLogger } from '../../utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/common/Modal';
import { formatIndianCurrency } from '../../lib/format';

const TaxDemands = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const demandId = searchParams.get('id');
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    demandType: searchParams.get('demandType') || '',
    assessmentYear: searchParams.get('assessmentYear') || '',
  });

  const { data: demandsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['taxDemands', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.demandType) params.append('demandType', filters.demandType);
      if (filters.assessmentYear) params.append('assessmentYear', filters.assessmentYear);

      const response = await apiClient.get(`/itr/tax-demands?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: demandDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['taxDemand', demandId],
    queryFn: async () => {
      if (!demandId) return null;
      const response = await apiClient.get(`/itr/tax-demands/${demandId}`);
      return response.data.data;
    },
    enabled: !!demandId,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ demandId, paymentData }) => {
      const response = await apiClient.post(`/itr/tax-demands/${demandId}/payment`, paymentData);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedDemand(null);
      queryClient.invalidateQueries(['taxDemands']);
      queryClient.invalidateQueries(['taxDemand']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async ({ demandId, disputeData }) => {
      const response = await apiClient.post(`/itr/tax-demands/${demandId}/dispute`, disputeData);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Demand disputed successfully!');
      setShowDisputeModal(false);
      setSelectedDemand(null);
      queryClient.invalidateQueries(['taxDemands']);
      queryClient.invalidateQueries(['taxDemand']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit dispute');
    },
  });

  const handleViewDemand = (demand) => {
    setSearchParams({ id: demand.id });
    setSelectedDemand(demand);
  };

  const handlePay = (demand) => {
    setSelectedDemand(demand);
    setShowPaymentModal(true);
  };

  const handleDispute = (demand) => {
    setSelectedDemand(demand);
    setShowDisputeModal(true);
  };

  const handleSubmitPayment = async (paymentData) => {
    if (!selectedDemand) return;
    await recordPaymentMutation.mutateAsync({
      demandId: selectedDemand.id,
      paymentData,
    });
  };

  const handleSubmitDispute = async (disputeData) => {
    if (!selectedDemand) return;
    await disputeMutation.mutateAsync({
      demandId: selectedDemand.id,
      disputeData,
    });
  };

  const demands = demandsData?.demands || [];
  const overdueCount = demands.filter(d => d.isOverdue).length;
  const pendingCount = demands.filter(d => d.status === 'pending').length;
  const totalOutstanding = demands.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0);
  const totalPaid = demands.reduce((sum, d) => sum + (d.paidAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading tax demands...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-error-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-error-600" />
              <h3 className="text-lg font-semibold text-error-900">Error Loading Demands</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
            </p>
            <Button variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (demandId && demandDetail) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSearchParams({});
              setSelectedDemand(null);
            }}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Back to Demands
          </Button>
        </div>

        <DemandCard
          demand={demandDetail}
          onPay={handlePay}
          onDispute={handleDispute}
        />

        {/* Breakdown */}
        {demandDetail.breakdown && Object.keys(demandDetail.breakdown).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(demandDetail.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatIndianCurrency(parseFloat(value))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        {demandDetail.paymentHistory && demandDetail.paymentHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            <div className="space-y-3">
              {demandDetail.paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatIndianCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                    </p>
                    {payment.transactionId && (
                      <p className="text-xs text-gray-400 mt-1">
                        Txn ID: {payment.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {demandDetail.timeline && demandDetail.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <NoticeTimeline timeline={demandDetail.timeline} />
          </div>
        )}

        {/* Dispute Info */}
        {demandDetail.status === 'disputed' && demandDetail.disputeReason && (
          <div className="bg-white rounded-lg shadow-sm border border-warning-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispute Information</h2>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Dispute Status</p>
              <StatusBadge status={demandDetail.disputeStatus || 'pending'} size="md" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dispute Reason</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{demandDetail.disputeReason}</p>
            </div>
            {demandDetail.disputeDocuments && demandDetail.disputeDocuments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Supporting Documents</p>
                <div className="space-y-2">
                  {demandDetail.disputeDocuments.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedDemand && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedDemand(null);
            }}
            title="Record Payment"
            size="large"
          >
            <DemandPaymentForm
              demand={selectedDemand}
              onSubmit={handleSubmitPayment}
              onCancel={() => {
                setShowPaymentModal(false);
                setSelectedDemand(null);
              }}
            />
          </Modal>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedDemand && (
          <Modal
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false);
              setSelectedDemand(null);
            }}
            title="Dispute Tax Demand"
            size="large"
          >
            <DemandDisputeForm
              demand={selectedDemand}
              onSubmit={handleSubmitDispute}
              onCancel={() => {
                setShowDisputeModal(false);
                setSelectedDemand(null);
              }}
            />
          </Modal>
        )}
      </div>
    );
  }

  // List View
  return (
    <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tax Demands</h1>
          <p className="text-sm text-gray-600">
            Manage tax demands from Income Tax Department
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Demands</p>
                <p className="text-2xl font-bold text-gray-900">{demands.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-error-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error-50 rounded-lg">
                <IndianRupee className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatIndianCurrency(totalOutstanding)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-warning-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-success-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatIndianCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="disputed">Disputed</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demand Type</label>
              <select
                value={filters.demandType}
                onChange={(e) => setFilters({ ...filters, demandType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="INTEREST">Interest</option>
                <option value="PENALTY">Penalty</option>
                <option value="TAX">Tax</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Year</label>
              <input
                type="text"
                value={filters.assessmentYear}
                onChange={(e) => setFilters({ ...filters, assessmentYear: e.target.value })}
                placeholder="e.g., 2024-25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Demands List */}
        {demands.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Demands Found</h3>
            <p className="text-sm text-gray-600">
              {Object.values(filters).some(f => f)
                ? 'No demands match your filters. Try adjusting your search criteria.'
                : 'You don\'t have any tax demands yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onView={handleViewDemand}
                onPay={handlePay}
                onDispute={handleDispute}
              />
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedDemand && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedDemand(null);
            }}
            title="Record Payment"
            size="large"
          >
            <DemandPaymentForm
              demand={selectedDemand}
              onSubmit={handleSubmitPayment}
              onCancel={() => {
                setShowPaymentModal(false);
                setSelectedDemand(null);
              }}
            />
          </Modal>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedDemand && (
          <Modal
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false);
              setSelectedDemand(null);
            }}
            title="Dispute Tax Demand"
            size="large"
          >
            <DemandDisputeForm
              demand={selectedDemand}
              onSubmit={handleSubmitDispute}
              onCancel={() => {
                setShowDisputeModal(false);
                setSelectedDemand(null);
              }}
            />
          </Modal>
        )}
    </div>
  );
};

export default TaxDemands;

