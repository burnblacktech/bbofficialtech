// =====================================================
// FILE MANAGER COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../DesignSystem/components/Button';
import StatusBadge from '../DesignSystem/StatusBadge';
import Modal from '../common/Modal';
import documentService from '../../services/documentService';
import { enterpriseLogger } from '../../utils/logger';
import toast from 'react-hot-toast';

const FileManager = ({
  filingId = null,
  onFileSelect,
  onFileDelete,
  className = '',
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [stats, setStats] = useState(null);

  const categories = [
    { key: 'ALL', label: 'All Documents', icon: '📁' },
    { key: 'FORM_16', label: 'Form 16', icon: '📄' },
    { key: 'BANK_STATEMENT', label: 'Bank Statement', icon: '🏦' },
    { key: 'INVESTMENT_PROOF', label: 'Investment Proof', icon: '📈' },
    { key: 'RENT_RECEIPTS', label: 'Rent Receipts', icon: '🏠' },
    { key: 'CAPITAL_GAINS', label: 'Capital Gains', icon: '💰' },
    { key: 'BUSINESS_INCOME', label: 'Business Income', icon: '🏢' },
    { key: 'HOUSE_PROPERTY', label: 'House Property', icon: '🏘️' },
    { key: 'OTHER', label: 'Other', icon: '📎' },
  ];

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [filingId, selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const params = {
        filingId,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      };

      const response = await documentService.getUserDocuments(params);
      setDocuments(response.data || []);

      enterpriseLogger.info('Documents loaded', {
        count: response.data?.length || 0,
        filingId,
        category: selectedCategory,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to load documents', { error: error.message });
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await documentService.getDocumentStats();
      setStats(response.data);
    } catch (error) {
      enterpriseLogger.error('Failed to load document stats', { error: error.message });
      toast.error('Failed to load document stats');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentService.getDownloadUrl(document.id);
      const downloadUrl = response.data.downloadUrl;

      // Open download URL in new tab
      window.open(downloadUrl, '_blank');

      toast.success('Download started');
      enterpriseLogger.info('Document download initiated', {
        documentId: document.id,
        filename: document.originalFilename,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to download document', {
        error: error.message,
        documentId: document.id,
      });
      toast.error('Failed to download document');
    }
  };

  const handleDelete = (document) => {
    setFileToDelete(document);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await documentService.deleteDocument(fileToDelete.id);

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== fileToDelete.id));

      // Call parent callback
      onFileDelete?.(fileToDelete);

      toast.success('Document deleted successfully');
      enterpriseLogger.info('Document deleted', {
        documentId: fileToDelete.id,
        filename: fileToDelete.originalFilename,
      });
    } catch (error) {
      enterpriseLogger.error('Failed to delete document', {
        error: error.message,
        documentId: fileToDelete.id,
      });
      toast.error('Failed to delete document');
    } finally {
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'yellow',
      'SCANNING': 'blue',
      'VERIFIED': 'green',
      'FAILED': 'red',
      'QUARANTINED': 'red',
    };
    return statusColors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'PENDING': 'Pending',
      'SCANNING': 'Scanning',
      'VERIFIED': 'Verified',
      'FAILED': 'Failed',
      'QUARANTINED': 'Quarantined',
    };
    return statusLabels[status] || 'Unknown';
  };

  const filteredDocuments = documents.filter(doc =>
    selectedCategory === 'ALL' || doc.category === selectedCategory,
  );

  if (loading) {
    return (
      <Card className={`file-manager ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>Loading documents...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`file-manager ${className}`}>
      {/* Header with Stats */}
      {stats && (
        <Card className="stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">📁</div>
              <div className="stat-details">
                <h3>{stats.totalFiles}</h3>
                <p>Total Files</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h3>{stats.verifiedFiles}</h3>
                <p>Verified</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">💾</div>
              <div className="stat-details">
                <h3>{formatFileSize(stats.totalSize)}</h3>
                <p>Storage Used</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-details">
                <h3>{stats.storageUsedPercentage}%</h3>
                <p>Storage Used</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <Card className="category-filter">
        <h4>Filter by Category</h4>
        <div className="category-buttons">
          {categories.map(category => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? 'primary' : 'outline'}
              size="small"
              onClick={() => setSelectedCategory(category.key)}
              className="category-button"
            >
              {category.icon} {category.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Documents List */}
      <Card className="documents-list">
        <div className="list-header">
          <h4>
            Documents ({filteredDocuments.length})
            {selectedCategory !== 'ALL' && (
              <span className="category-filter-indicator">
                - {categories.find(c => c.key === selectedCategory)?.label}
              </span>
            )}
          </h4>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No Documents Found</h3>
            <p>
              {selectedCategory === 'ALL'
                ? 'Upload your first document to get started'
                : `No ${categories.find(c => c.key === selectedCategory)?.label.toLowerCase()} documents found`
              }
            </p>
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map(document => (
              <div key={document.id} className="document-card">
                <div className="document-header">
                  <div className="document-icon">{document.fileIcon}</div>
                  <div className="document-info">
                    <h5 className="document-name">{document.originalFilename}</h5>
                    <p className="document-category">{document.categoryLabel}</p>
                  </div>
                  <StatusBadge
                    status={getStatusLabel(document.verificationStatus)}
                    color={getStatusColor(document.verificationStatus)}
                  />
                </div>

                <div className="document-details">
                  <p className="document-size">{document.fileSize}</p>
                  <p className="document-date">{formatDate(document.createdAt)}</p>
                </div>

                <div className="document-actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleDownload(document)}
                    className="download-button"
                  >
                    📥 Download
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(document)}
                    className="delete-button"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Document"
        size="small"
      >
        {fileToDelete && (
          <div className="delete-confirmation">
            <div className="warning-icon">⚠️</div>
            <h3>Are you sure you want to delete this document?</h3>
            <div className="file-to-delete">
              <span className="file-icon">{fileToDelete.fileIcon}</span>
              <div className="file-details">
                <p className="file-name">{fileToDelete.originalFilename}</p>
                <p className="file-category">{fileToDelete.categoryLabel}</p>
                <p className="file-size">{fileToDelete.fileSize}</p>
              </div>
            </div>
            <p className="warning-text">
              This action cannot be undone. The document will be permanently deleted.
            </p>
            <div className="modal-actions">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete Document
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileManager;
