// =====================================================
// FILE UPLOAD COMPONENT - ENHANCED
// Drag & drop file upload with preview
// =====================================================

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { cn } from '../../../lib/utils';

const FileUpload = ({
  label,
  accept,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  value = [],
  onChange,
  error,
  helperText,
  disabled = false,
  className = '',
  id,
  required = false,
  showPreview = true,
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const inputId = id || `file-upload-${label?.toLowerCase().replace(/\s/g, '-') || 'file'}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const validateFile = (file) => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`;
    }
    if (accept && !accept.split(',').some(type => {
      const pattern = type.trim().replace('*', '.*');
      return new RegExp(pattern).test(file.type);
    })) {
      return `File type not allowed. Accepted: ${accept}`;
    }
    return null;
  };

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // Show errors (could use toast)
      console.error('File upload errors:', errors);
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...value, ...validFiles] : validFiles;
      onChange(newFiles);

      // Generate previews
      if (showPreview) {
        validFiles.forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setPreviews(prev => [...prev, { file, preview: e.target.result }]);
            };
            reader.readAsDataURL(file);
          } else {
            setPreviews(prev => [...prev, { file, preview: null }]);
          }
        });
      }
    }
  }, [value, multiple, maxSize, accept, onChange, showPreview]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-info-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-error-500" />;
    }
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label-lg text-slate-700 mb-1.5"
          style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[10px] p-6 text-center transition-all cursor-pointer',
          {
            'border-slate-300 bg-slate-50 hover:border-gold-400 hover:bg-gold-50': !isDragging && !error && !disabled,
            'border-gold-500 bg-gold-100': isDragging && !error && !disabled,
            'border-error-500 bg-error-50': error,
            'border-slate-200 bg-slate-100 cursor-not-allowed': disabled,
          },
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={inputId}
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={required}
          {...props}
        />

        <Upload className={cn(
          'w-10 h-10 mx-auto mb-2',
          {
            'text-slate-400': !isDragging && !error,
            'text-gold-500': isDragging,
            'text-error-500': error,
          },
        )} />
        <p className="text-body-md text-slate-600 mb-1" style={{ fontSize: '14px', lineHeight: '22px' }}>
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
          {accept && `Accepted: ${accept}`}
          {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
        </p>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-gray-800 truncate" style={{ fontSize: '14px', lineHeight: '22px' }}>
                    {file.name}
                  </p>
                  <p className="text-body-sm text-slate-500" style={{ fontSize: '13px', lineHeight: '20px' }}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 rounded hover:bg-slate-200 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {showPreview && previews.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {previews.map((item, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
              {item.preview ? (
                <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  {getFileIcon(item.file)}
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded text-white hover:bg-opacity-70"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-body-sm text-error-600"
          style={{ fontSize: '13px', lineHeight: '20px' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1.5 text-body-sm text-slate-500"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FileUpload;

