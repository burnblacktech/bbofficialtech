// =====================================================
// FILE UPLOAD COMPONENT (DRAG & DROP)
// =====================================================

import React, { useState, useRef, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import documentService from '../../services/documentService';
import { enterpriseLogger } from '../../utils/logger';
import toast from 'react-hot-toast';

const FileUpload = ({
  onFileSelect,
  onUploadComplete,
  onUploadError,
  category = 'OTHER',
  filingId = null,
  memberId = null,
  maxFiles = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files) => {
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      enterpriseLogger.warn('File validation errors', { errors });
      onUploadError?.(errors);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
      onFileSelect?.(validFiles);
    }
  }, [maxFiles, onFileSelect, onUploadError]);

  const validateFile = (file) => {
    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${formatFileSize(maxSize)} limit`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check filename
    if (!file.name || file.name.length === 0) {
      errors.push('Filename is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      const results = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        try {
          const result = await uploadSingleFile(file);
          results.push({ file, result, success: true });
        } catch (error) {
          results.push({ file, error: error.message, success: false });
        }
      }

      setUploadResults(results);
      setSelectedFiles([]);

      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
      }

      if (failedUploads.length > 0) {
        onUploadError?.(failedUploads.map(r => `${r.file.name}: ${r.error}`));
      }

      enterpriseLogger.info('File upload completed', {
        totalFiles: selectedFiles.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
      });

    } catch (error) {
      enterpriseLogger.error('File upload failed', { error: error.message });
      onUploadError?.([error.message]);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadSingleFile = async (file) => {
    try {
      const result = await documentService.uploadFileWithProgress(
        file,
        category,
        filingId,
        memberId,
      );

      toast.success(`${file.name} uploaded successfully`);
      return result;
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`);
      throw error;
    }
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload Area */}
      <Card
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">
            {uploading ? '⏳' : '📁'}
          </div>

          <h3>Upload Documents</h3>

          <p className="upload-description">
            Drag and drop files here, or click to browse
          </p>

          <div className="upload-constraints">
            <p>• Maximum file size: {formatFileSize(maxSize)}</p>
            <p>• Allowed types: {allowedTypes.map(type => type.split('/')[1]).join(', ')}</p>
            <p>• Maximum files: {maxFiles}</p>
          </div>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="browse-button"
          >
            Browse Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card className="selected-files">
          <h4>Selected Files ({selectedFiles.length})</h4>
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="upload-actions">
            <Button
              variant="primary"
              onClick={uploadFiles}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card className="upload-results">
          <div className="results-header">
            <h4>Upload Results</h4>
            <Button
              variant="outline"
              size="small"
              onClick={clearResults}
            >
              Clear
            </Button>
          </div>

          <div className="results-list">
            {uploadResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-info">
                  <span className="file-icon">{getFileIcon(result.file)}</span>
                  <div className="result-details">
                    <p className="file-name">{result.file.name}</p>
                    <p className="file-size">{formatFileSize(result.file.size)}</p>
                  </div>
                </div>
                <div className="result-status">
                  {result.success ? (
                    <StatusBadge status="verified" color="green">
                      ✅ Uploaded
                    </StatusBadge>
                  ) : (
                    <StatusBadge status="failed" color="red">
                      ❌ Failed
                    </StatusBadge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
