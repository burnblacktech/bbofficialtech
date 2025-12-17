// =====================================================
// SHARED DOCUMENT UPLOADER COMPONENT
// Drag-and-drop file upload with validation and preview
// =====================================================

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, CheckCircle2, AlertCircle } from 'lucide-react';

const DocumentUploader = ({
  onUpload,
  onDelete,
  existingFiles = [],
  maxFiles = 5,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 10,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const validateFile = (file) => {
    const errors = [];

    // Check file type
    const allowedTypes = accept.split(',').map((t) => t.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not allowed. Allowed types: ${accept}`);
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    return errors;
  };

  const handleFiles = useCallback(
    async (files) => {
      const fileArray = Array.from(files);
      const newErrors = [];

      // Check total file count
      if (existingFiles.length + fileArray.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        setErrors(newErrors);
        return;
      }

      // Validate each file
      fileArray.forEach((file) => {
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
          newErrors.push(...fileErrors);
        }
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors([]);
      setUploading(true);

      try {
        for (const file of fileArray) {
          if (onUpload) {
            await onUpload(file);
          }
        }
      } catch (error) {
        setErrors([error.message || 'Upload failed']);
      } finally {
        setUploading(false);
      }
    },
    [existingFiles.length, maxFiles, onUpload, accept, maxSizeMB],
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return Image;
    }
    return FileText;
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-gold-500 bg-gold-50'
            : 'border-slate-300 hover:border-gray-400 bg-slate-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={accept}
          onChange={handleFileInput}
          disabled={uploading || existingFiles.length >= maxFiles}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-heading-sm font-medium text-slate-700 mb-1">
            {uploading ? 'Uploading...' : 'Drag and drop files here'}
          </p>
          <p className="text-body-sm text-slate-500">
            or <span className="text-gold-600 font-medium">browse</span> to upload
          </p>
          <p className="text-body-xs text-slate-400 mt-2">
            Supported: {accept} (Max {maxSizeMB}MB per file, {maxFiles} files max)
          </p>
        </label>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-error-50 border border-red-200 rounded-xl p-3">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-red-800 text-body-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-heading-sm font-medium text-slate-900">Uploaded Files</h4>
          {existingFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.name || file.fileName || 'file');
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-body-sm font-medium text-slate-900">
                      {file.name || file.fileName || `File ${index + 1}`}
                    </div>
                    {file.size && (
                      <div className="text-body-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.uploaded && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(index)}
                      className="p-1 text-slate-500 hover:text-error-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;

