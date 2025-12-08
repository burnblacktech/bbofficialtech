// =====================================================
// ADMIN DOCUMENTS PAGE
// Enterprise-grade document management for admins
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Edit,
  File,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Settings,
} from 'lucide-react';
import {
  useAdminDocuments,
  useAdminStorageStats,
  useDeleteAdminDocument,
  useReprocessAdminDocument,
} from '../../features/admin/documents/hooks/use-documents';
import toast from 'react-hot-toast';

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Build query params
  const queryParams = {
    page,
    limit,
    search: searchTerm || undefined,
    documentType: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    assessmentYear: filterYear !== 'all' ? filterYear : undefined,
  };

  // Fetch documents
  const { data: documentsData, isLoading } = useAdminDocuments(queryParams);
  const { data: storageStats } = useAdminStorageStats();

  // Mutations
  const deleteDocumentMutation = useDeleteAdminDocument();
  const reprocessDocumentMutation = useReprocessAdminDocument();

  const documents = documentsData?.data?.documents || documentsData?.documents || [];
  const pagination = documentsData?.data?.pagination || documentsData?.pagination;
  const storage = storageStats?.data?.storage || storageStats?.storage || {};

  const handleViewDocument = (documentId) => {
    // Navigate to document detail view (to be created)
    navigate(`/admin/documents/${documentId}`);
  };

  const handleDeleteDocument = (documentId) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocumentMutation.mutate({ documentId, reason: 'Admin deletion' });
    }
  };

  const handleReprocessDocument = (documentId) => {
    reprocessDocumentMutation.mutate({ documentId, reason: 'Admin reprocess request' });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'verified':
        return 'bg-success-100 text-success-800';
      case 'processing':
        return 'bg-warning-100 text-warning-800';
      case 'failed':
      case 'error':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Document Management</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Manage and monitor all uploaded documents
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Templates</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Storage Stats */}
      {storage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">Storage Usage</p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(storage.used || 0)} / {formatFileSize(storage.total || 0)} used
                  </p>
                </div>
              </div>
              <div className="w-32 h-2 bg-neutral-200 rounded-full">
                <div
                  className="h-2 bg-primary-500 rounded-full"
                  style={{
                    width: `${storage.total ? (storage.used / storage.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search documents by user, type, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Document Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="FORM_16">Form 16</option>
                  <option value="FORM_16A">Form 16A</option>
                  <option value="AIS">AIS</option>
                  <option value="FORM_26AS">26AS</option>
                  <option value="RENT_RECEIPT">Rent Receipt</option>
                  <option value="SALE_DEED">Sale Deed</option>
                  <option value="BROKER_STATEMENT">Broker Statement</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="processed">Processed</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Assessment Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Years</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No documents found</h3>
            <p className="text-sm text-neutral-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterYear !== 'all'
                ? 'No documents match your filters'
                : 'No documents available'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <File className="h-5 w-5 text-primary-600 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-neutral-900">
                                {doc.fileName || doc.name || `Document ${doc.id}`}
                              </div>
                              <div className="text-xs text-neutral-500">ID: {doc.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {doc.userName || doc.user?.fullName || 'N/A'}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {doc.userEmail || doc.user?.email || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                            {doc.documentType || doc.type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status || doc.verificationStatus)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status || doc.verificationStatus)}`}>
                              {doc.status || doc.verificationStatus || 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {formatFileSize(doc.fileSize || doc.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {formatDate(doc.createdAt || doc.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDocument(doc.id)}
                              className="text-primary-600 hover:text-primary-900 p-1"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReprocessDocument(doc.id)}
                              className="text-warning-600 hover:text-warning-900 p-1"
                              title="Reprocess"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-error-600 hover:text-error-900 p-1"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Showing {((pagination.currentPage - 1) * limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} documents
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-neutral-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDocuments;

