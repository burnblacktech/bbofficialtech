// =====================================================
// ASSESSMENT NOTICES PAGE
// Main page for managing assessment notices
// =====================================================

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Filter, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import NoticeCard from '../../components/ITR/NoticeCard';
import NoticeResponseForm from '../../components/ITR/NoticeResponseForm';
import NoticeTimeline from '../../components/ITR/NoticeTimeline';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import Button from '../../components/DesignSystem/components/Button';
import { cn } from '../../utils';
import { enterpriseLogger } from '../../utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/common/Modal';

const AssessmentNotices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const noticeId = searchParams.get('id');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    noticeType: searchParams.get('noticeType') || '',
    assessmentYear: searchParams.get('assessmentYear') || '',
  });

  const { data: noticesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assessmentNotices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.noticeType) params.append('noticeType', filters.noticeType);
      if (filters.assessmentYear) params.append('assessmentYear', filters.assessmentYear);

      const response = await apiClient.get(`/itr/assessment-notices?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: noticeDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['assessmentNotice', noticeId],
    queryFn: async () => {
      if (!noticeId) return null;
      const response = await apiClient.get(`/itr/assessment-notices/${noticeId}`);
      return response.data.data;
    },
    enabled: !!noticeId,
  });

  const checkPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/itr/assessment-notices/check-portal');
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.count} new notice(s) from portal`);
      queryClient.invalidateQueries(['assessmentNotices']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to check portal');
    },
  });

  const submitResponseMutation = useMutation({
    mutationFn: async ({ noticeId, responseData }) => {
      const response = await apiClient.post(`/itr/assessment-notices/${noticeId}/response`, responseData);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Response submitted successfully!');
      setShowResponseModal(false);
      setSelectedNotice(null);
      queryClient.invalidateQueries(['assessmentNotices']);
      queryClient.invalidateQueries(['assessmentNotice']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit response');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ noticeId, status }) => {
      const response = await apiClient.patch(`/itr/assessment-notices/${noticeId}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['assessmentNotices']);
      queryClient.invalidateQueries(['assessmentNotice']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const handleViewNotice = (notice) => {
    setSearchParams({ id: notice.id });
    setSelectedNotice(notice);
  };

  const handleRespond = (notice) => {
    setSelectedNotice(notice);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async (responseData) => {
    if (!selectedNotice) return;
    await submitResponseMutation.mutateAsync({
      noticeId: selectedNotice.id,
      responseData,
    });
  };

  const handleCheckPortal = () => {
    checkPortalMutation.mutate();
  };

  const notices = noticesData?.notices || [];
  const overdueCount = notices.filter(n => n.isOverdue).length;
  const pendingCount = notices.filter(n => n.status === 'pending').length;

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading assessment notices...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="bg-white rounded-xl shadow-elevation-1 border border-error-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-error-600" />
            <h3 className="text-heading-4 font-semibold text-error-900">Error Loading Notices</h3>
          </div>
          <p className="text-body-regular text-slate-600 mb-4">
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Detail View
  if (noticeId && noticeDetail) {
    return (
      <div>
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                setSearchParams({});
                setSelectedNotice(null);
              }}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Notices
            </Button>
          </div>

          <NoticeCard
            notice={noticeDetail}
            onRespond={handleRespond}
          />

          {noticeDetail.timeline && noticeDetail.timeline.length > 0 && (
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 mt-6">
              <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Timeline</h2>
              <NoticeTimeline timeline={noticeDetail.timeline} />
            </div>
          )}

          {noticeDetail.responseText && (
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 mt-6">
              <h2 className="text-heading-4 font-semibold text-slate-900 mb-4">Response</h2>
              <p className="text-body-regular text-slate-700 whitespace-pre-wrap">{noticeDetail.responseText}</p>
              {noticeDetail.responseDocuments && noticeDetail.responseDocuments.length > 0 && (
                <div className="mt-4">
                  <p className="text-body-regular font-medium text-slate-700 mb-2">Attached Documents:</p>
                  <div className="space-y-2">
                    {noticeDetail.responseDocuments.map((doc, index) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-body-regular text-primary-600 hover:text-primary-700"
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

        {/* Response Modal */}
        {showResponseModal && selectedNotice && (
          <Modal
            isOpen={showResponseModal}
            onClose={() => {
              setShowResponseModal(false);
              setSelectedNotice(null);
            }}
            title="Submit Response"
            size="large"
          >
            <NoticeResponseForm
              notice={selectedNotice}
              onSubmit={handleSubmitResponse}
              onCancel={() => {
                setShowResponseModal(false);
                setSelectedNotice(null);
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-heading-2 font-bold text-slate-900 mb-2">Assessment Notices</h1>
              <p className="text-body-regular text-slate-600">
                Manage assessment notices from Income Tax Department
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleCheckPortal}
                disabled={checkPortalMutation.isPending}
                icon={<RefreshCw className={cn('w-4 h-4', checkPortalMutation.isPending && 'animate-spin')} />}
              >
                Check Portal
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info-50 rounded-xl">
                  <Clock className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-body-regular text-slate-600">Total Notices</p>
                  <p className="text-heading-2 font-bold text-slate-900">{notices.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-elevation-1 border border-warning-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-body-regular text-slate-600">Pending</p>
                  <p className="text-heading-2 font-bold text-slate-900">{pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-elevation-1 border border-error-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-error-600" />
                </div>
                <div>
                  <p className="text-body-regular text-slate-600">Overdue</p>
                  <p className="text-heading-2 font-bold text-slate-900">{overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="responded">Responded</option>
                  <option value="resolved">Resolved</option>
                  <option value="disputed">Disputed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Notice Type</label>
                <select
                  value={filters.noticeType}
                  onChange={(e) => setFilters({ ...filters, noticeType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="143(1)">143(1)</option>
                  <option value="142(1)">142(1)</option>
                  <option value="148">148</option>
                  <option value="153A">153A</option>
                  <option value="153C">153C</option>
                  <option value="154">154</option>
                  <option value="156">156</option>
                  <option value="245">245</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Assessment Year</label>
                <input
                  type="text"
                  value={filters.assessmentYear}
                  onChange={(e) => setFilters({ ...filters, assessmentYear: e.target.value })}
                  placeholder="e.g., 2024-25"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notices List */}
        {notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No Notices Found</h3>
            <p className="text-body-regular text-slate-600 mb-4">
              {Object.values(filters).some(f => f)
                ? 'No notices match your filters. Try adjusting your search criteria.'
                : 'You don\'t have any assessment notices yet.'}
            </p>
            {!Object.values(filters).some(f => f) && (
              <Button variant="primary" onClick={handleCheckPortal}>
                Check Portal for New Notices
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onView={handleViewNotice}
                onRespond={handleRespond}
              />
            ))}
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedNotice && (
          <Modal
            isOpen={showResponseModal}
            onClose={() => {
              setShowResponseModal(false);
              setSelectedNotice(null);
            }}
            title="Submit Response"
            size="large"
          >
            <NoticeResponseForm
              notice={selectedNotice}
              onSubmit={handleSubmitResponse}
              onCancel={() => {
                setShowResponseModal(false);
                setSelectedNotice(null);
              }}
            />
          </Modal>
        )}
    </div>
  );
};

export default AssessmentNotices;

