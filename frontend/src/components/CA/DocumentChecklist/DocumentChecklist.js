// =====================================================
// DOCUMENT CHECKLIST COMPONENT
// Checklist per ITR type with upload status
// =====================================================

import React, { useState } from 'react';
import { CheckCircle, XCircle, Upload, FileText, Eye } from 'lucide-react';
import Button from '../../DesignSystem/components/Button';
import FileUpload from '../../UI/FileUpload/FileUpload';
import { cn } from '../../../lib/utils';

const DocumentChecklist = ({
  itrType,
  documents = [],
  onUpload,
  onRequest,
  className = '',
}) => {
  const [expandedDoc, setExpandedDoc] = useState(null);

  const getRequiredDocuments = () => {
    const baseDocs = [
      { id: 'form16', label: 'Form 16', required: true },
      { id: 'pan', label: 'PAN Card', required: true },
      { id: 'aadhaar', label: 'Aadhaar Card', required: true },
      { id: 'bank', label: 'Bank Statement', required: false },
    ];

    if (itrType === 'ITR-2' || itrType === 'ITR2') {
      return [
        ...baseDocs,
        { id: 'capital-gains', label: 'Capital Gains Statement', required: false },
        { id: 'property-docs', label: 'Property Documents', required: false },
      ];
    }

    if (itrType === 'ITR-3' || itrType === 'ITR3') {
      return [
        ...baseDocs,
        { id: 'audit-report', label: 'Tax Audit Report (3CD)', required: true },
        { id: 'balance-sheet', label: 'Balance Sheet', required: true },
        { id: 'pnl', label: 'Profit & Loss Statement', required: true },
      ];
    }

    return baseDocs;
  };

  const requiredDocs = getRequiredDocuments();
  const docStatus = documents.reduce((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});

  const getStatus = (docId) => {
    return docStatus[docId]?.status || 'missing'; // 'uploaded' | 'missing' | 'pending'
  };

  const toggleExpand = (docId) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-heading-md font-semibold text-gray-800 mb-4" style={{ fontSize: '18px', fontWeight: 600 }}>
        Required Documents
      </h3>

      {requiredDocs.map((doc) => {
        const status = getStatus(doc.id);
        const docData = docStatus[doc.id];

        return (
          <div
            key={doc.id}
              className={cn(
              'border rounded-xl p-4 transition-colors',
              {
                'border-success-200 bg-success-50': status === 'uploaded',
                'border-error-200 bg-error-50': status === 'missing' && doc.required,
                'border-slate-200 bg-white': status === 'missing' && !doc.required,
                'border-warning-200 bg-warning-50': status === 'pending',
              },
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {status === 'uploaded' ? (
                  <CheckCircle className="w-5 h-5 text-success-500" />
                ) : status === 'pending' ? (
                  <div className="w-5 h-5 border-2 border-warning-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className={cn(
                    'w-5 h-5',
                    doc.required ? 'text-error-500' : 'text-slate-400',
                  )} />
                )}

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-body-md font-medium text-gray-800" style={{ fontSize: '14px', fontWeight: 500 }}>
                      {doc.label}
                    </span>
                    {doc.required && (
                      <span className="text-label-sm text-error-500" style={{ fontSize: '11px', fontWeight: 500 }}>
                        Required
                      </span>
                    )}
                  </div>
                  {docData?.uploadedAt && (
                    <span className="text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      Uploaded {new Date(docData.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {docData?.fileUrl && (
                  <button
                    onClick={() => window.open(docData.fileUrl, '_blank')}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    aria-label={`View ${doc.label}`}
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                )}
                {status !== 'uploaded' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpand(doc.id)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                )}
                {onRequest && status === 'missing' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRequest(doc.id)}
                  >
                    Request
                  </Button>
                )}
              </div>
            </div>

            {/* Upload Form */}
            {expandedDoc === doc.id && status !== 'uploaded' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <FileUpload
                  label={`Upload ${doc.label}`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={5 * 1024 * 1024}
                  onChange={(files) => {
                    if (files.length > 0 && onUpload) {
                      onUpload(doc.id, files[0]);
                      setExpandedDoc(null);
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DocumentChecklist;

