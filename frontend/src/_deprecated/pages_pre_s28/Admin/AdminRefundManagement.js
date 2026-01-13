// =====================================================
// ADMIN REFUND MANAGEMENT PAGE
// Refund requests with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  IndianRupee,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminRefundManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionData, setRejectionData] = useState({
    reason: '',
    notes: '',
  });
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadRefunds();
  }, [pagination.offset, filters]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const data = await adminService.getRefunds(params);
      setRefunds(data.refunds || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing('approve');
    try {
      await adminService.approveRefund(selectedRefund.id, { notes: approvalNotes });
      toast.success('Refund approved successfully');
      setShowApproveModal(false);
      setApprovalNotes('');
      setSelectedRefund(null);
      loadRefunds();
    } catch (error) {
      console.error('Failed to approve refund:', error);
      toast.error('Failed to approve refund');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionData.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing('reject');
    try {
      await adminService.rejectRefund(selectedRefund.id, rejectionData);
      toast.success('Refund rejected');
      setShowRejectModal(false);
      setRejectionData({ reason: '', notes: '' });
      setSelectedRefund(null);
      loadRefunds();
    } catch (error) {
      console.error('Failed to reject refund:', error);
      toast.error('Failed to reject refund');
    } finally {
      setProcessing(null);
    }
  };

  const handleProcess = async (refundId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Process this refund? This will mark it as credited.')) return;

    setProcessing(refundId);
    try {
      await adminService.processRefundRequest(refundId);
      toast.success('Refund processed successfully');
      loadRefunds();
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessing(null);
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        refund.id?.toLowerCase().includes(searchLower) ||
        refund.user?.fullName?.toLowerCase().includes(searchLower) ||
        refund.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-warning-100 text-warning-700';
      case 'issued':
        return 'bg-info-100 text-info-700';
      case 'credited':
        return 'bg-success-100 text-success-700';
      case 'failed':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Refund Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage refund requests and processing
            </Typography.Body>
          </div>
          <Button variant="outline" onClick={loadRefunds}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="processing">Processing</option>
                <option value="issued">Issued</option>
                <option value="credited">Credited</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredRefunds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No refunds found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  No refund requests match your filters.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredRefunds.map((refund) => (
                  <StaggerItem key={refund.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Typography.Small className="font-mono text-neutral-600">{refund.id?.substring(0, 8)}...</Typography.Small>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(refund.status)}`}>
                            {refund.status}
                          </span>
                        </div>
                        <Typography.Body className="font-medium">{refund.user?.fullName || 'N/A'}</Typography.Body>
                        <Typography.Small className="text-neutral-500 block">
                          {refund.filing?.itrType || 'N/A'} - AY {refund.filing?.assessmentYear || 'N/A'}
                        </Typography.Small>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Typography.H3 className="text-neutral-900">
                            ₹{parseFloat(refund.expectedAmount || 0).toLocaleString('en-IN')}
                          </Typography.H3>
                          <Typography.Small className="text-neutral-500">
                            {new Date(refund.statusDate).toLocaleDateString()}
                          </Typography.Small>
                        </div>
                        <div className="flex gap-2">
                          {refund.status === 'processing' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowApproveModal(true);
                                }}
                                disabled={processing === refund.id}
                                className="bg-success-600 hover:bg-success-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="error"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing === refund.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {refund.status === 'issued' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(refund.id)}
                              disabled={processing === refund.id}
                            >
                              {processing === refund.id ? 'Processing...' : 'Process'}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setSelectedRefund(refund)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Typography.Small className="text-neutral-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </Typography.Small>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= pagination.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRefund && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Approve Refund</CardTitle>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovalNotes('');
                    setSelectedRefund(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Typography.Body className="text-neutral-600">
                  Approve refund request for ₹{parseFloat(selectedRefund.expectedAmount || 0).toLocaleString('en-IN')}
                </Typography.Body>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter approval notes..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button variant="outline" onClick={() => {
                    setShowApproveModal(false);
                    setApprovalNotes('');
                    setSelectedRefund(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} disabled={processing === 'approve'} className="bg-success-600 hover:bg-success-700">
                    {processing === 'approve' ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRefund && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reject Refund</CardTitle>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionData({ reason: '', notes: '' });
                    setSelectedRefund(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Typography.Body className="text-neutral-600">
                  Please provide a reason for rejecting this refund request.
                </Typography.Body>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Rejection Reason <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    value={rejectionData.reason}
                    onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter rejection reason..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button variant="outline" onClick={() => {
                    setShowRejectModal(false);
                    setRejectionData({ reason: '', notes: '' });
                    setSelectedRefund(null);
                  }}>
                    Cancel
                  </Button>
                  <Button variant="error" onClick={handleReject} disabled={!rejectionData.reason.trim() || processing === 'reject'}>
                    {processing === 'reject' ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Refund Detail Modal */}
        {selectedRefund && !showApproveModal && !showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Refund Details</CardTitle>
                <button onClick={() => setSelectedRefund(null)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography.Small className="text-neutral-500">Refund ID</Typography.Small>
                    <Typography.Body className="font-mono">{selectedRefund.id}</Typography.Body>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Status</Typography.Small>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedRefund.status)}`}>
                      {selectedRefund.status}
                    </span>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Amount</Typography.Small>
                    <Typography.H3>₹{parseFloat(selectedRefund.expectedAmount || 0).toLocaleString('en-IN')}</Typography.H3>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Status Date</Typography.Small>
                    <Typography.Body>{new Date(selectedRefund.statusDate).toLocaleString()}</Typography.Body>
                  </div>
                  {selectedRefund.user && (
                    <div>
                      <Typography.Small className="text-neutral-500">User</Typography.Small>
                      <Typography.Body>{selectedRefund.user.fullName}</Typography.Body>
                      <Typography.Small className="text-neutral-400">{selectedRefund.user.email}</Typography.Small>
                    </div>
                  )}
                  {selectedRefund.filing && (
                    <div>
                      <Typography.Small className="text-neutral-500">Filing</Typography.Small>
                      <Typography.Body>{selectedRefund.filing.itrType} - AY {selectedRefund.filing.assessmentYear}</Typography.Body>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminRefundManagement;
