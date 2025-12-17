// =====================================================
// DOCUMENT UPLOAD COMPONENT - INTEGRATED UPLOAD & MANAGEMENT
// =====================================================

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../DesignSystem/components/Button';
import FileUpload from './FileUpload';
import FileManager from './FileManager';
import documentService from '../../services/documentService';
import { enterpriseLogger } from '../../utils/logger';
import toast from 'react-hot-toast';

const DocumentUpload = ({
  filingId = null,
  memberId = null,
  onDocumentUpload,
  onDocumentDelete,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const categories = [
    { key: 'FORM_16', label: 'Form 16', icon: '📄', description: 'Salary certificate from employer' },
    { key: 'BANK_STATEMENT', label: 'Bank Statement', icon: '🏦', description: 'Bank account statements' },
    { key: 'INVESTMENT_PROOF', label: 'Investment Proof', icon: '📈', description: 'Investment certificates and proofs' },
    { key: 'RENT_RECEIPTS', label: 'Rent Receipts', icon: '🏠', description: 'House rent receipts' },
    { key: 'OTHER', label: 'Other', icon: '📎', description: 'Other supporting documents' },
  ];

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [filingId, memberId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getUserDocuments({ filingId, memberId });
      setDocuments(response.data || []);
    } catch (error) {
      enterpriseLogger.error('Failed to load documents', { error: error.message });
      toast.error('Failed to load documents');
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
    }
  };

  const handleUploadComplete = (uploadResults) => {
    enterpriseLogger.info('Documents uploaded successfully', { count: uploadResults.length });
    toast.success(`${uploadResults.length} document(s) uploaded successfully`);

    // Reload documents and stats
    loadDocuments();
    loadStats();

    if (onDocumentUpload) {
      onDocumentUpload(uploadResults);
    }
  };

  const handleUploadError = (errors) => {
    enterpriseLogger.error('Document upload failed', { errors });
    toast.error('Some documents failed to upload');
  };

  const handleDocumentDelete = (document) => {
    enterpriseLogger.info('Document deleted', { documentId: document.id });
    toast.success('Document deleted successfully');

    // Reload documents and stats
    loadDocuments();
    loadStats();

    if (onDocumentDelete) {
      onDocumentDelete(document);
    }
  };

  const getCategoryStats = () => {
    if (!stats) return {};

    return categories.reduce((acc, category) => {
      acc[category.key] = stats.categoryCounts?.[category.key] || 0;
      return acc;
    }, {});
  };

  const categoryStats = getCategoryStats();

  return (
    <div className={`document-upload ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-heading-2 font-bold text-slate-900 mb-2">Document Management</h2>
        <p className="text-slate-600">
          Upload and manage your tax documents. Supported formats: PDF, JPG, PNG (Max 10MB)
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(category => (
              <div key={category.key} className="text-center">
                <div className="text-heading-2 mb-1">{category.icon}</div>
                <div className="text-body-regular font-medium text-slate-900">{categoryStats[category.key]}</div>
                <div className="text-body-small text-slate-500">{category.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Manage Documents ({documents.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Category Selection */}
          <Card>
            <h3 className="text-heading-4 font-medium text-slate-900 mb-4">Document Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div key={category.key} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <span className="text-heading-2 mr-3">{category.icon}</span>
                    <div>
                      <div className="font-medium text-slate-900">{category.label}</div>
                      <div className="text-body-regular text-slate-500">{category.description}</div>
                    </div>
                  </div>
                  <div className="text-body-small text-slate-400">
                    {categoryStats[category.key]} document(s) uploaded
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* File Upload */}
          <FileUpload
            category="FORM_16"
            filingId={filingId}
            memberId={memberId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={10}
            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </div>
      )}

      {activeTab === 'manage' && (
        <FileManager
          filingId={filingId}
          onFileDelete={handleDocumentDelete}
          className="min-h-96"
        />
      )}
    </div>
  );
};

export default DocumentUpload;

