// =====================================================
// ADMIN USER VERIFICATION QUEUE
// Manages pending user verifications (email, phone, PAN)
// =====================================================

import { useState, useEffect } from 'react';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Shield,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const AdminVerificationQueue = () => {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, [filterType]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await api.get('/admin/verification/pending', { params });
      setVerifications(response.data?.data?.verifications || []);
    } catch (error) {
      console.error('Failed to load verifications:', error);
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (verification) => {
    setSelectedVerification(verification);
    setActionType('approve');
    setReason('');
    setShowActionModal(true);
  };

  const handleReject = (verification) => {
    setSelectedVerification(verification);
    setActionType('reject');
    setReason('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const endpoint = `/admin/verification/${selectedVerification.type}/${selectedVerification.id}/${actionType}`;
      const payload = actionType === 'reject' ? { reason } : { reason: reason || 'Approved by admin' };

      await api.post(endpoint, payload);
      toast.success(`Verification ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowActionModal(false);
      setSelectedVerification(null);
      setActionType(null);
      setReason('');
      loadVerifications();
    } catch (error) {
      console.error(`Failed to ${actionType} verification:`, error);
      toast.error(error.response?.data?.error || `Failed to ${actionType} verification`);
    } finally {
      setProcessing(false);
    }
  };

  const getVerificationIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-info-600" />;
      case 'phone':
        return <Phone className="h-5 w-5 text-success-600" />;
      case 'pan':
        return <CreditCard className="h-5 w-5 text-warning-600" />;
      default:
        return <Shield className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getVerificationColor = (type) => {
    switch (type) {
      case 'email':
        return 'bg-info-100 text-info-700';
      case 'phone':
        return 'bg-success-100 text-success-700';
      case 'pan':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const filteredVerifications = filterType === 'all'
    ? verifications
    : verifications.filter(v => v.type === filterType);

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Verification Queue</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Review and approve pending user verifications
            </Typography.Body>
          </div>
          <Button variant="outline" onClick={loadVerifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
              >
                All ({verifications.length})
              </button>
              <button
                onClick={() => setFilterType('email')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'email'
                  ? 'bg-info-100 text-info-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Email ({verifications.filter(v => v.type === 'email').length})
              </button>
              <button
                onClick={() => setFilterType('phone')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'phone'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
              >
                <Phone className="h-4 w-4 inline mr-2" />
                Phone ({verifications.filter(v => v.type === 'phone').length})
              </button>
              <button
                onClick={() => setFilterType('pan')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'pan'
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                PAN ({verifications.filter(v => v.type === 'pan').length})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Verifications List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No pending verifications</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  All verifications have been processed.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredVerifications.map((verification) => (
                  <StaggerItem key={`${verification.type}-${verification.id}`} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getVerificationColor(verification.type)}`}>
                          {getVerificationIcon(verification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Typography.Body className="font-medium">{verification.userName || 'Unknown User'}</Typography.Body>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getVerificationColor(verification.type)}`}>
                              {verification.type.toUpperCase()}
                            </span>
                          </div>
                          <Typography.Small className="text-neutral-500 block mb-2">
                            {verification.type === 'email' && verification.userEmail}
                            {verification.type === 'phone' && verification.userPhone}
                            {verification.type === 'pan' && verification.userPAN}
                          </Typography.Small>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Clock className="h-3 w-3" />
                            Submitted {new Date(verification.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(verification)}
                          className="text-success-600 border-success-300 hover:bg-success-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(verification)}
                          className="text-error-600 border-error-300 hover:bg-error-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Modal */}
        {showActionModal && selectedVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {actionType === 'approve' ? 'Approve Verification' : 'Reject Verification'}
                </CardTitle>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedVerification(null);
                    setActionType(null);
                    setReason('');
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Typography.Small className="text-neutral-600 mb-2 block">
                    User: {selectedVerification.userName}
                  </Typography.Small>
                  <Typography.Small className="text-neutral-600 mb-2 block">
                    Type: {selectedVerification.type.toUpperCase()}
                  </Typography.Small>
                  <Typography.Small className="text-neutral-600 block">
                    Value: {
                      selectedVerification.type === 'email' && selectedVerification.userEmail
                      || selectedVerification.type === 'phone' && selectedVerification.userPhone
                      || selectedVerification.type === 'pan' && selectedVerification.userPAN
                    }
                  </Typography.Small>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {actionType === 'reject' ? 'Rejection Reason' : 'Notes'} <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder={actionType === 'reject' ? 'Enter rejection reason...' : 'Enter notes (optional)...'}
                    required={actionType === 'reject'}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowActionModal(false);
                      setSelectedVerification(null);
                      setActionType(null);
                      setReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === 'approve' ? 'primary' : 'error'}
                    onClick={submitAction}
                    disabled={processing || (actionType === 'reject' && !reason.trim())}
                  >
                    {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
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

export default AdminVerificationQueue;
