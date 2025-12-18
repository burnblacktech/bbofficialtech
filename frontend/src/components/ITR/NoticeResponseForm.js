// =====================================================
// NOTICE RESPONSE FORM COMPONENT
// Form for submitting responses to assessment notices
// =====================================================

import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';
import toast from 'react-hot-toast';

const NoticeResponseForm = ({
  notice,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [responseText, setResponseText] = useState(notice?.responseText || '');
  const [responseDocuments, setResponseDocuments] = useState(notice?.responseDocuments || []);
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

      setResponseDocuments([...responseDocuments, ...newDocuments]);
      toast.success(`${files.length} file(s) added`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = responseDocuments.filter((_, i) => i !== index);
    setResponseDocuments(newDocuments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!responseText.trim() && responseDocuments.length === 0) {
      toast.error('Please provide a response text or upload documents');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        responseText: responseText.trim(),
        responseDocuments: responseDocuments.map(doc => doc.url), // In real implementation, these would be server URLs
      });
    } catch (error) {
      toast.error('Failed to submit response');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Response Text */}
      <div>
        <label htmlFor="responseText" className="block text-body-regular font-medium text-slate-700 mb-2">
          Response Text <span className="text-error-500">*</span>
        </label>
        <textarea
          id="responseText"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter your response to the assessment notice..."
          required={responseDocuments.length === 0}
        />
        <p className="mt-1 text-body-small text-slate-500">
          Provide a detailed response explaining your position regarding this notice
        </p>
      </div>

      {/* Document Upload */}
      <div>
        <label className="block text-body-regular font-medium text-slate-700 mb-2">
          Supporting Documents
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
        {responseDocuments.length > 0 && (
          <div className="mt-3 space-y-2">
            {responseDocuments.map((doc, index) => (
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
          disabled={submitting || (!responseText.trim() && responseDocuments.length === 0)}
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </div>
    </form>
  );
};

export default NoticeResponseForm;

