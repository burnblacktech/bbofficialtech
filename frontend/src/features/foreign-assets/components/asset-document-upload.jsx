// =====================================================
// ASSET DOCUMENT UPLOAD COMPONENT
// Upload and manage supporting documents for foreign assets
// =====================================================

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';
import { useUploadDocument } from '../hooks/use-foreign-assets';
import Button from '../../../components/DesignSystem/components/Button';
import toast from 'react-hot-toast';

const AssetDocumentUpload = ({ filingId, assetId, existingDocuments = [], onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState('bank_statement');
  const fileInputRef = useRef(null);

  const uploadDocument = useUploadDocument();

  const documentTypes = [
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'property_deed', label: 'Property Deed' },
    { value: 'share_certificate', label: 'Share Certificate' },
    { value: 'valuation_report', label: 'Valuation Report' },
    { value: 'dtaa_certificate', label: 'DTAA Certificate' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPEG, PNG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      // Upload file to storage service first
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'foreign_asset_document');
      formData.append('filingId', filingId);
      formData.append('assetId', assetId);

      // Upload file (this would typically go to a file upload endpoint)
      const uploadResponse = await fetch('/api/upload/foreign-asset-document', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.url || uploadData.fileUrl;

      // Update asset with document URL
      const result = await uploadDocument.mutateAsync({
        filingId,
        assetId,
        documentUrl: fileUrl,
        documentType,
      });

      if (result.success) {
        toast.success('Document uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setDocumentType('bank_statement');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } else {
        toast.error(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error', { error });
      toast.error('Failed to upload document');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : 'Document';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-heading-md text-slate-900 mb-4">Supporting Documents</h3>

      {/* Existing Documents */}
      {existingDocuments && existingDocuments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-heading-sm text-slate-900 font-medium mb-3">Uploaded Documents</h4>
          <div className="space-y-2">
            {existingDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-body-sm font-medium text-slate-900">
                      {getDocumentTypeLabel(doc.type)}
                    </p>
                    {doc.uploadedAt && (
                      <p className="text-body-xs text-slate-500">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                  title="View Document"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Document */}
      <div className="space-y-4">
        <h4 className="text-heading-sm text-slate-900 font-medium">Upload New Document</h4>

        {/* Document Type Selection */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Document File
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              id="asset-document-upload"
            />
            <label
              htmlFor="asset-document-upload"
              className="cursor-pointer"
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-body-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-body-xs text-slate-600">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-body-sm text-slate-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-body-xs text-slate-500">
                    PDF, JPEG, or PNG (max 5MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div>
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-48 rounded-xl border border-slate-200"
              />
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-elevation-2 hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
            <div>
              <p className="text-body-sm text-info-900 mb-1">Accepted Formats</p>
              <ul className="text-body-xs text-info-700 list-disc list-inside space-y-1">
                <li>PDF documents</li>
                <li>JPEG/PNG images</li>
                <li>Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {selectedFile && (
            <Button
              onClick={handleRemove}
              variant="outline"
              className="flex-1"
            >
              Remove
            </Button>
          )}
          <Button
            onClick={handleUpload}
            loading={uploadDocument.isPending}
            disabled={!selectedFile}
            className="flex-1"
          >
            {uploadDocument.isPending ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssetDocumentUpload;

