import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../DesignSystem/components/Button';
import StatusBadge from '../DesignSystem/StatusBadge';
import Modal from '../common/Modal';
import { useDocumentContext } from '../../contexts/DocumentContext';

const FileManager = ({
  filingId = null,
  onFileSelect,
  onFileDelete,
  className = '',
}) => {
  const {
    documents,
    stats,
    loading,
    categories,
    loadDocuments,
    loadStats,
    deleteDocument,
    downloadDocument,
  } = useDocumentContext();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  useEffect(() => {
    loadDocuments({ filingId });
    loadStats();
  }, [filingId, loadDocuments, loadStats]);

  const handleDownload = async (document) => {
    await downloadDocument(document.id, document.originalFilename);
  };

  const handleDelete = (document) => {
    setFileToDelete(document);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const success = await deleteDocument(fileToDelete.id);
    if (success) {
      onFileDelete?.(fileToDelete);
    }
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
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
