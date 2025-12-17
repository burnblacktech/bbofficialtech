// =====================================================
// RESUME FILING MODAL COMPONENT
// Modal shown when resuming a paused filing
// =====================================================

import React from 'react';
import { X, FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import InvoiceBadge from './InvoiceBadge';

const ResumeFilingModal = ({ filing, onResume, onStartFresh, onClose }) => {
  if (!filing) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-elevation-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-heading-2 font-bold text-slate-900">Resume Filing</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filing Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-900">{filing.itrType} - AY {filing.assessmentYear}</h3>
                <p className="text-body-regular text-slate-600">Filing ID: {filing.id.slice(0, 8)}...</p>
              </div>
            </div>

            {filing.pausedAt && (
              <div className="flex items-center space-x-2 text-body-regular text-slate-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Paused on: {formatDate(filing.pausedAt)}</span>
              </div>
            )}

            {filing.updatedAt && (
              <div className="flex items-center space-x-2 text-body-regular text-slate-600">
                <CheckCircle className="w-4 h-4" />
                <span>Last saved: {formatDate(filing.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Invoice Status */}
          {filing.invoice && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Invoice Status</h4>
              <InvoiceBadge invoice={filing.invoice} />
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Before Resuming</h4>
                <ul className="text-body-regular text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Your previous progress will be restored</li>
                  <li>Any unsaved changes will be lost</li>
                  <li>You can continue from where you left off</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onStartFresh}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Start Fresh
            </button>
            <button
              onClick={onResume}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Resume Filing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeFilingModal;

