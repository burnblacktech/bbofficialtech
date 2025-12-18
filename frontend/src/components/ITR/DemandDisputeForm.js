// =====================================================
// DEMAND DISPUTE FORM COMPONENT
// Form for disputing tax demands
// =====================================================

import React, { useState } from 'react';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';
import toast from 'react-hot-toast';

const DemandDisputeForm = ({
  demand,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDocuments, setDisputeDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement actual file upload to backend
      // For now, just add file names to the list
      const newDocuments = files.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL
        size: file.size,
        type: file.type,
      }));

      setDisputeDocuments([...disputeDocuments, ...newDocuments]);
      toast.success(`${files.length} file(s) added`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = disputeDocuments.filter((_, i) => i !== index);
    setDisputeDocuments(newDocuments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for disputing the demand');
      return;
    }

    if (disputeReason.trim().length < 50) {
      toast.error('Please provide a detailed reason (at least 50 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        disputeReason: disputeReason.trim(),
        disputeDocuments: disputeDocuments.map(doc => doc.url), // In real implementation, these would be server URLs
      });
    } catch (error) {
      toast.error('Failed to submit dispute');
      console.error('Dispute error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Warning */}
      <div className="bg-warning-50 border border-warning-200 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-regular font-medium text-warning-900 mb-1">
              Disputing a Tax Demand
            </p>
            <p className="text-body-small text-warning-700">
              Please provide a detailed reason for disputing this demand. Include all relevant facts,
              supporting documents, and legal basis for your dispute. This will be reviewed by the
              Income Tax Department.
            </p>
          </div>
        </div>
      </div>

      {/* Demand Info */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-body-regular">
          <div>
            <p className="text-slate-600">Demand Number</p>
            <p className="font-medium text-slate-900">{demand?.demandNumber}</p>
          </div>
          <div>
            <p className="text-slate-600">Amount</p>
            <p className="font-medium text-slate-900">
              ₹{demand?.totalAmount?.toLocaleString('en-IN') || '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Dispute Reason */}
      <div>
        <label htmlFor="disputeReason" className="block text-body-regular font-medium text-slate-700 mb-2">
          Reason for Dispute <span className="text-error-500">*</span>
        </label>
        <textarea
          id="disputeReason"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="Provide a detailed explanation of why you are disputing this demand. Include relevant facts, legal provisions, and any other supporting information..."
          required
          minLength={50}
        />
        <p className="mt-1 text-body-small text-slate-500">
          Minimum 50 characters required. {disputeReason.length}/50
        </p>
      </div>

      {/* Document Upload */}
      <div>
        <label className="block text-body-regular font-medium text-slate-700 mb-2">
          Supporting Documents (Optional)
        </label>
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4">
          <input
            type="file"
            id="fileUpload"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="fileUpload"
            className={cn(
              'flex flex-col items-center justify-center cursor-pointer',
              uploading && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-body-regular text-slate-600">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </span>
            <span className="text-body-small text-slate-500 mt-1">
              PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
            </span>
          </label>
        </div>

        {/* Uploaded Documents List */}
        {disputeDocuments.length > 0 && (
          <div className="mt-3 space-y-2">
            {disputeDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-body-regular text-slate-700 truncate">{doc.name}</span>
                  {doc.size && (
                    <span className="text-body-small text-slate-500">
                      ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index)}
                  className="ml-2 p-1 text-slate-400 hover:text-error-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !disputeReason.trim() || disputeReason.trim().length < 50}
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          {submitting ? 'Submitting Dispute...' : 'Submit Dispute'}
        </Button>
      </div>
    </form>
  );
};

export default DemandDisputeForm;

