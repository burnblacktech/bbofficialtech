// =====================================================
// ADMIN CA VERIFICATION QUEUE PAGE
// Manages CA firm verification with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  CheckCircle,
  XCircle,
  Search,
  Eye,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminCAVerificationQueue = () => {
  const [loading, setLoading] = useState(true);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    loadVerificationQueue();
  }, [pagination.offset, statusFilter]);

  const loadVerificationQueue = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCAVerificationQueue({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setVerificationQueue(data.queue || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load verification queue:', error);
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (firmId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to approve this CA firm verification?')) {
      return;
    }

    setProcessingAction(firmId);
    try {
      await adminService.approveCAVerification(firmId, {});
      toast.success('CA firm verification approved successfully');
      loadVerificationQueue();
    } catch (error) {
      console.error('Failed to approve verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingAction(selectedFirm.id);
    try {
      await adminService.rejectCAVerification(selectedFirm.id, {
        reason: rejectReason,
        notes: rejectNotes,
      });
      toast.success('CA firm verification rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectNotes('');
      setSelectedFirm(null);
      loadVerificationQueue();
    } catch (error) {
      console.error('Failed to reject verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessingAction(null);
    }
  };

  const openRejectModal = (firm) => {
    setSelectedFirm(firm);
    setShowRejectModal(true);
  };

  const filteredQueue = verificationQueue.filter((firm) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        firm.name?.toLowerCase().includes(searchLower) ||
        firm.email?.toLowerCase().includes(searchLower) ||
        firm.gstNumber?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">CA Verification Queue</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Review and approve/reject CA firm registrations
            </Typography.Body>
          </div>
          <Button variant="outline" onClick={loadVerificationQueue}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or GST number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Verification Queue */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No pending verifications</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  All CA firm verifications have been processed.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredQueue.map((firm) => (
                  <StaggerItem key={firm.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Typography.Body className="font-semibold">{firm.name}</Typography.Body>
                          <span className="px-2 py-0.5 text-body-small rounded-full bg-warning-100 text-warning-700">
                            {firm.verificationStatus || 'pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-regular text-neutral-600">
                          <div>
                            <span className="text-neutral-500">Email:</span> {firm.email}
                          </div>
                          <div>
                            <span className="text-neutral-500">Phone:</span> {firm.phone || 'N/A'}
                          </div>
                          <div>
                            <span className="text-neutral-500">GST:</span> {firm.gstNumber || 'N/A'}
                          </div>
                          <div>
                            <span className="text-neutral-500">Submitted:</span>{' '}
                            {new Date(firm.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(firm.id)}
                          disabled={processingAction === firm.id}
                          className="bg-success-600 hover:bg-success-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => openRejectModal(firm)}
                          disabled={processingAction === firm.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFirm(firm)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
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

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reject CA Verification</CardTitle>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setRejectNotes('');
                    setSelectedFirm(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Typography.Body className="text-neutral-600">
                  Please provide a reason for rejecting this CA firm verification.
                </Typography.Body>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Rejection Reason <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter rejection reason..."
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter additional notes..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                      setRejectNotes('');
                      setSelectedFirm(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="error"
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || processingAction === selectedFirm?.id}
                  >
                    {processingAction === selectedFirm?.id ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminCAVerificationQueue;
