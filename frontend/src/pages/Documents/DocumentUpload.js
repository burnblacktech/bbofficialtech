// =====================================================
// DOCUMENT UPLOAD UI COMPONENT
// Basic drag-drop upload with categories
// =====================================================

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import apiClient from '../../services';
import toast from 'react-hot-toast';

const DocumentUpload = () => {
  // State management
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Document categories
  const documentCategories = [
    { value: 'FORM_16', label: 'Form 16', description: 'Salary certificate from employer' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement', description: 'Bank account statements' },
    { value: 'INVESTMENT_PROOF', label: 'Investment Proof', description: 'FD, Mutual Funds, etc.' },
    { value: 'RENT_RECEIPT', label: 'Rent Receipt', description: 'House rent receipts' },
    { value: 'AADHAAR', label: 'Aadhaar', description: 'Aadhaar card copy' },
    { value: 'PAN', label: 'PAN', description: 'PAN card copy' },
    { value: 'SALARY_SLIP', label: 'Salary Slip', description: 'Monthly salary slips' },
    { value: 'OTHER', label: 'Other', description: 'Other supporting documents' }
  ];

  // File validation
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'image/webp'
    ];

    if (file.size > maxSize) {
      toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(`File ${file.name} has an unsupported format. Please upload JPG, PNG, PDF, or WebP files.`);
      return false;
    }

    return true;
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedCategory) {
      toast.error('Please select a document category first');
      return;
    }

    const validFiles = acceptedFiles.filter(validateFile);
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory);
        formData.append('originalFilename', file.name);

        const response = await apiClient.post('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });

        return {
          id: response.data.data.document.id,
          filename: response.data.data.document.filename,
          originalFilename: file.name,
          category: selectedCategory,
          size: file.size,
          status: 'UPLOADED',
          uploadedAt: new Date().toISOString()
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedFiles]);
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedCategory]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: uploading || !selectedCategory
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'UPLOADED': 'blue',
      'SCANNING': 'yellow',
      'VERIFIED': 'green',
      'FAILED': 'red',
      'DELETED': 'gray'
    };
    return colors[status] || 'gray';
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const cat = documentCategories.find(c => c.value === category);
    return cat ? cat.label : 'Unknown';
  };

  return (
    <div className="document-upload">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Document Upload</h1>
          <p>Upload your tax documents for ITR filing</p>
        </div>
      </div>

      {/* Category Selection */}
      <Card className="category-selection-card">
        <h2>Select Document Category</h2>
        <div className="category-grid">
          {documentCategories.map((category) => (
            <div
              key={category.value}
              className={`category-item ${selectedCategory === category.value ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              <h3>{category.label}</h3>
              <p>{category.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Upload Area */}
      {selectedCategory && (
        <Card className="upload-card">
          <h2>Upload Files</h2>
          <div
            {...getRootProps()}
            className={`upload-area ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <h3>
                  {isDragActive 
                    ? 'Drop files here' 
                    : 'Drag & drop files here, or click to select'
                  }
                </h3>
                <p>Supported formats: JPG, PNG, PDF, WebP (Max 10MB each)</p>
                <Button variant="secondary" disabled>
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="uploaded-files-card">
          <h2>Uploaded Files</h2>
          <div className="files-list">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-icon">
                    {file.originalFilename.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}
                  </div>
                  <div className="file-details">
                    <h4>{file.originalFilename}</h4>
                    <p>{getCategoryLabel(file.category)} • {formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="file-status">
                  <StatusBadge
                    status={file.status}
                    color={getStatusColor(file.status)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="instructions-card">
        <h2>Upload Guidelines</h2>
        <div className="instructions-list">
          <div className="instruction-item">
            <span className="instruction-icon">📋</span>
            <div className="instruction-content">
              <h4>File Formats</h4>
              <p>Upload documents in JPG, PNG, PDF, or WebP format only</p>
            </div>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">📏</span>
            <div className="instruction-content">
              <h4>File Size</h4>
              <p>Maximum file size is 10MB per document</p>
            </div>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🔍</span>
            <div className="instruction-content">
              <h4>Quality</h4>
              <p>Ensure documents are clear and readable</p>
            </div>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🔒</span>
            <div className="instruction-content">
              <h4>Security</h4>
              <p>All documents are encrypted and stored securely</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="actions-section">
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/itr/filing'}
          disabled={uploadedFiles.length === 0}
        >
          Continue to Filing
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
