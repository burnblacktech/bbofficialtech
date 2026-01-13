// =====================================================
// ADMIN FILING DETAILS PAGE
// Comprehensive filing detail view with tabs and operations
// =====================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Edit,
  Flag,
  MessageSquare,
  File,
  User,
  Calendar,
  IndianRupee,
  Activity,
  Download,
  Eye,
} from 'lucide-react';
import {
  useAdminFilingDetails,
  useAdminFilingAuditLog,
  useAdminFilingDocuments,
  useUpdateAdminFiling,
  useReprocessAdminFiling,
  useCancelAdminFiling,
  useOverrideAdminFilingValidation,
  useFlagAdminFilingForReview,
  useAddAdminFilingNotes,
} from '../../features/admin/filings/hooks/use-filings';
import toast from 'react-hot-toast';

const AdminFilingDetails = () => {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOperations, setShowOperations] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch filing details
  const { data: filingData, isLoading } = useAdminFilingDetails(filingId);
  const { data: auditLogData } = useAdminFilingAuditLog(filingId);
  const { data: documentsData } = useAdminFilingDocuments(filingId);

  // Mutations
  const updateFilingMutation = useUpdateAdminFiling();
  const reprocessFilingMutation = useReprocessAdminFiling();
  const cancelFilingMutation = useCancelAdminFiling();
  const overrideValidationMutation = useOverrideAdminFilingValidation();
  const flagForReviewMutation = useFlagAdminFilingForReview();
  const addNotesMutation = useAddAdminFilingNotes();

  const filing = filingData?.data?.filing || filingData?.filing;
  const auditLog = auditLogData?.data?.auditLog || auditLogData?.auditLog || [];
  const documents = documentsData?.data?.documents || documentsData?.documents || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'data', label: 'Data', icon: FileText },
    { id: 'documents', label: 'Documents', icon: File },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'discrepancies', label: 'Discrepancies', icon: AlertCircle },
    { id: 'audit', label: 'Audit Log', icon: Activity },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'verified':
        return 'bg-success-100 text-success-800';
      case 'processing':
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'failed':
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      case 'draft':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleReprocess = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to reprocess this filing?')) {
      reprocessFilingMutation.mutate({ filingId, reason: 'Admin reprocess request' });
    }
  };

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (reason) {
      cancelFilingMutation.mutate({ filingId, reason });
    }
  };

  const handleOverrideValidation = () => {
    // eslint-disable-next-line no-alert
    const reason = window.prompt('Please provide a reason for overriding validation:');
    if (reason) {
      overrideValidationMutation.mutate({ filingId, reason });
    }
  };

  const handleFlagForReview = () => {
    // eslint-disable-next-line no-alert
    const reason = window.prompt('Please provide a reason for flagging:');
    if (reason) {
      flagForReviewMutation.mutate({ filingId, reason });
    }
  };

  const handleAddNotes = () => {
    if (!notes.trim()) {
      toast.error('Please enter notes');
      return;
    }
    addNotesMutation.mutate({ filingId, notes, reason: 'Admin notes' });
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading filing details...</p>
        </div>
      </div>
    );
  }

  if (!filing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-heading-4 font-semibold text-neutral-900 mb-2">Filing not found</h3>
          <p className="text-body-regular text-neutral-500 mb-4">The filing you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/filings')}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Back to Filings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/filings')}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-heading-2 font-bold text-neutral-900">Filing Details</h1>
                <p className="text-body-regular text-neutral-500 mt-1">
                  ID: {filing.id} • {filing.acknowledgmentNumber || 'No Acknowledgment'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(filing.status)}`}>
                {filing.status || 'Unknown'}
              </span>
              <button
                onClick={() => setShowOperations(!showOperations)}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl text-body-regular font-medium hover:bg-primary-600 transition-colors"
              >
                Operations
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Operations Panel */}
      {showOperations && (
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-4 font-semibold text-neutral-900">Admin Operations</h3>
              <button
                onClick={() => setShowOperations(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleReprocess}
                disabled={reprocessFilingMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 border border-primary-300 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reprocess</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelFilingMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 border border-error-300 rounded-xl text-error-700 hover:bg-error-50 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleOverrideValidation}
                disabled={overrideValidationMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 border border-warning-300 rounded-xl text-warning-700 hover:bg-warning-50 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Override Validation</span>
              </button>
              <button
                onClick={handleFlagForReview}
                disabled={flagForReviewMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 border border-info-300 rounded-xl text-info-700 hover:bg-info-50 transition-colors disabled:opacity-50"
              >
                <Flag className="h-4 w-4" />
                <span>Flag for Review</span>
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-start space-x-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add admin notes..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
                <button
                  onClick={handleAddNotes}
                  disabled={addNotesMutation.isLoading || !notes.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-body-regular font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">User</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-neutral-400" />
                  <p className="text-body-regular font-medium text-neutral-900">
                    {filing.userName || filing.user?.fullName || 'N/A'}
                  </p>
                </div>
                <p className="text-body-small text-neutral-500 mt-1">
                  {filing.userEmail || filing.user?.email || ''}
                </p>
              </div>
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">ITR Type</p>
                <p className="text-body-regular font-medium text-neutral-900">
                  {filing.itrType || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">Assessment Year</p>
                <p className="text-body-regular font-medium text-neutral-900">
                  {filing.assessmentYear || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(filing.status)}`}>
                  {filing.status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">Created</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <p className="text-body-regular font-medium text-neutral-900">
                    {formatDate(filing.createdAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-body-regular text-neutral-500 mb-1">Last Updated</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <p className="text-body-regular font-medium text-neutral-900">
                    {formatDate(filing.updatedAt)}
                  </p>
                </div>
              </div>
              {filing.totalIncome && (
                <div>
                  <p className="text-body-regular text-neutral-500 mb-1">Total Income</p>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-neutral-400" />
                    <p className="text-body-regular font-medium text-neutral-900">
                      {formatCurrency(filing.totalIncome)}
                    </p>
                  </div>
                </div>
              )}
              {filing.totalTax && (
                <div>
                  <p className="text-body-regular text-neutral-500 mb-1">Total Tax</p>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-neutral-400" />
                    <p className="text-body-regular font-medium text-neutral-900">
                      {formatCurrency(filing.totalTax)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <pre className="text-body-small bg-neutral-50 p-4 rounded-xl overflow-x-auto">
              {JSON.stringify(filing.data || filing, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <File className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">No documents found for this filing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-body-regular font-medium text-neutral-900">
                          {doc.fileName || doc.name || `Document ${doc.id}`}
                        </p>
                        <p className="text-body-small text-neutral-500">
                          {doc.documentType || doc.type} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 p-1">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-4">
              {auditLog.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500">No timeline events found</p>
                </div>
              ) : (
                auditLog.map((event, index) => (
                  <div key={event.id || index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                      {index < auditLog.length - 1 && (
                        <div className="w-0.5 h-12 bg-neutral-200 ml-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-body-regular font-medium text-neutral-900">
                        {event.action || event.description || 'Event'}
                      </p>
                      <p className="text-body-small text-neutral-500 mt-1">
                        {formatDate(event.timestamp || event.createdAt)}
                      </p>
                      {event.userName && (
                        <p className="text-body-small text-neutral-400 mt-1">
                          by {event.userName}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'discrepancies' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500">No discrepancies found</p>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-3">
              {auditLog.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500">No audit log entries found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {auditLog.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-body-regular text-neutral-500">
                            {formatDate(entry.timestamp || entry.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-regular text-neutral-900">
                            {entry.action || entry.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-regular text-neutral-500">
                            {entry.userName || entry.user?.fullName || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-regular text-neutral-500">
                            {entry.ipAddress || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.success !== false ? (
                              <CheckCircle className="h-5 w-5 text-success-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-error-600" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFilingDetails;

