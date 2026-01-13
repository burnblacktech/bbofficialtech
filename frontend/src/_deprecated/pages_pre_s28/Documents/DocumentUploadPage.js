// =====================================================
// DOCUMENT UPLOAD PAGE
// =====================================================

import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/DesignSystem/components/Button';
import StatusBadge from '../../components/DesignSystem/StatusBadge';
import Modal from '../../components/common/Modal';
import FileUpload from '../../components/Documents/FileUpload';
import FileManager from '../../components/Documents/FileManager';
import { useDocumentContext } from '../../contexts/DocumentContext';
import { enterpriseLogger } from '../../utils/logger';

const DocumentUploadPage = ({
  filingId = null,
  memberId = null,
  onDocumentsUploaded,
  className = '',
}) => {
  const {
    documents,
    stats,
    categories,
    loading,
    uploading,
    uploadProgress,
    uploadResults,
    error,
    loadDocuments,
    loadStats,
    uploadFiles,
    deleteDocument,
    downloadDocument,
    clearUploadResults,
    clearError,
    getFilteredDocuments,
    getDocumentsByFiling,
    getDocumentsByMember,
    getStorageUsagePercentage,
    isStorageQuotaExceeded,
    getSuccessfulUploads,
    getFailedUploads,
  } = useDocumentContext();

  const [selectedCategory, setSelectedCategory] = useState('OTHER');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadDocuments({ filingId, memberId });
    loadStats();
  }, [filingId, memberId, loadDocuments, loadStats]);

  const handleFileSelect = (files) => {
    setSelectedFiles(files);
  };

  const handleUploadComplete = async (files) => {
    try {
      const results = await uploadFiles(files, selectedCategory, filingId, memberId);

      // Call parent callback if provided
      if (onDocumentsUploaded) {
        const successfulUploads = results.filter(r => r.success);
        onDocumentsUploaded(successfulUploads);
      }

      enterpriseLogger.info('Files uploaded successfully', {
        count: files.length,
        category: selectedCategory,
        filingId,
        memberId,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to upload files', { error: error.message });
    }
  };

  const handleUploadError = (errors) => {
    enterpriseLogger.error('Upload errors', { errors });
  };

  const handleFileDelete = async (document) => {
    try {
      await deleteDocument(document.id);

      enterpriseLogger.info('Document deleted', {
        documentId: document.id,
        filename: document.originalFilename,
      });

    } catch (error) {
      enterpriseLogger.error('Failed to delete document', { error: error.message });
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(c => c.key === category);
    return categoryData?.icon || '📎';
  };

  const getCategoryLabel = (category) => {
    const categoryData = categories.find(c => c.key === category);
    return categoryData?.label || 'Other';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageColor = () => {
    const percentage = getStorageUsagePercentage();
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'orange';
    return 'green';
  };

  const getStorageStatus = () => {
    const percentage = getStorageUsagePercentage();
    if (percentage >= 90) return 'Critical';
    if (percentage >= 75) return 'Warning';
    return 'Good';
  };

  const relevantDocuments = filingId
    ? getDocumentsByFiling(filingId)
    : memberId
      ? getDocumentsByMember(memberId)
      : getFilteredDocuments();

  return (
    <div className={`document-upload-page ${className}`}>
      {/* Header */}
      <Card className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h2>Document Management</h2>
            <p>Upload and manage your tax documents</p>
          </div>

          {stats && (
            <div className="storage-info">
              <div className="storage-bar">
                <div
                  className="storage-fill"
                  style={{
                    width: `${getStorageUsagePercentage()}%`,
                    backgroundColor: getStorageColor() === 'red' ? '#ef4444' :
                      getStorageColor() === 'orange' ? '#D4AF37' : '#10b981',
                  }}
                ></div>
              </div>
              <div className="storage-details">
                <span className="storage-used">{formatFileSize(stats.totalSize)}</span>
                <span className="storage-separator">/</span>
                <span className="storage-total">{formatFileSize(stats.maxStorageBytes)}</span>
                <StatusBadge
                  status={getStorageStatus()}
                  color={getStorageColor()}
                  className="storage-status"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="error-card">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Section */}
      <Card className="upload-section">
        <div className="upload-header">
          <h3>Upload New Documents</h3>
          <div className="category-selector">
            <Button
              variant="outline"
              onClick={() => setShowCategoryModal(true)}
              className="category-button"
            >
              {getCategoryIcon(selectedCategory)} {getCategoryLabel(selectedCategory)}
            </Button>
          </div>
        </div>

        <FileUpload
          onFileSelect={handleFileSelect}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          category={selectedCategory}
          filingId={filingId}
          memberId={memberId}
          maxFiles={10}
          maxSize={10 * 1024 * 1024} // 10MB
        />

        {/* Upload Progress */}
        {uploading && (
          <Card className="upload-progress-card">
            <div className="progress-header">
              <h4>Uploading Documents</h4>
              <span className="progress-percentage">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </Card>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <Card className="upload-results-card">
            <div className="results-header">
              <h4>Upload Results</h4>
              <Button
                variant="outline"
                size="small"
                onClick={clearUploadResults}
              >
                Clear
              </Button>
            </div>

            <div className="results-summary">
              <div className="result-stat">
                <span className="stat-icon">✅</span>
                <span className="stat-label">Successful:</span>
                <span className="stat-value">{getSuccessfulUploads().length}</span>
              </div>
              <div className="result-stat">
                <span className="stat-icon">❌</span>
                <span className="stat-label">Failed:</span>
                <span className="stat-value">{getFailedUploads().length}</span>
              </div>
            </div>

            {getFailedUploads().length > 0 && (
              <div className="failed-uploads">
                <h5>Failed Uploads:</h5>
                <ul>
                  {getFailedUploads().map((result, index) => (
                    <li key={index}>
                      {result.file.name}: {result.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* Document Library Section */}
      <div className="document-library-section">
        <div className="section-header">
          <h3>Document Library ({relevantDocuments.length})</h3>
          <p>View and manage your already uploaded files</p>
        </div>

        <FileManager
          filingId={filingId}
          memberId={memberId}
          onFileDelete={handleFileDelete}
        />
      </div>

      {/* Category Selection Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Document Category"
        size="medium"
      >
        <div className="category-grid">
          {categories.map(category => (
            <Button
              key={category.key}
              variant="outline"
              onClick={() => handleCategorySelect(category.key)}
              className="category-option"
            >
              <div className="category-option-content">
                <span className="category-icon">{category.icon}</span>
                <div className="category-details">
                  <h4>{category.label}</h4>
                  <p>{category.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentUploadPage;
