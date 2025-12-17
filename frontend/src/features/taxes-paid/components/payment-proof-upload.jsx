// =====================================================
// PAYMENT PROOF UPLOAD COMPONENT
// Upload and manage payment proof documents
// =====================================================

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useUploadPaymentProof } from '../hooks/use-tax-payment';
import Button from '../../../components/DesignSystem/components/Button';
import toast from 'react-hot-toast';

const PaymentProofUpload = ({ paymentId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const fileInputRef = useRef(null);

  const uploadProof = useUploadPaymentProof();

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
      // Upload file to S3 or storage service first
      // For now, we'll use a placeholder - actual implementation would upload to S3
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'payment_proof');
      formData.append('paymentId', paymentId);

      // Upload file (this would typically go to a file upload endpoint)
      const uploadResponse = await fetch('/api/upload/payment-proof', {
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

      // Update payment with proof URL
      const result = await uploadProof.mutateAsync({
        paymentId,
        fileUrl,
      });

      if (result.success) {
        setUploadedUrl(fileUrl);
        toast.success('Payment proof uploaded successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } else {
        toast.error(result.error || 'Failed to upload payment proof');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload payment proof');
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-heading-md text-slate-900 mb-4">Upload Payment Proof</h3>

      {uploadedUrl ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-green-900">Proof Uploaded Successfully</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-xs text-green-700 hover:text-green-800 mt-1 inline-flex items-center"
              >
                <FileText className="h-3 w-3 mr-1" />
                View Uploaded File
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* File Input */}
          <div className="mb-4">
            <label className="block text-body-sm font-medium text-slate-700 mb-2">
              Payment Proof Document
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="payment-proof-upload"
              />
              <label
                htmlFor="payment-proof-upload"
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
            <div className="mb-4">
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
          <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-4">
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
              loading={uploadProof.isPending}
              disabled={!selectedFile}
              className="flex-1"
            >
              {uploadProof.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Proof
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentProofUpload;

