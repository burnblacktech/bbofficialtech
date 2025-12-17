// =====================================================
// PDF EXPORT BUTTON COMPONENT
// Reusable button component for PDF export functionality
// =====================================================

import React from 'react';
import { Download, Loader } from 'lucide-react';

const PDFExportButton = ({
  onExport,
  isLoading = false,
  disabled = false,
  label = 'Export PDF',
  variant = 'primary',
  size = 'medium',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gold-500 text-white hover:bg-gold-600',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-gray-300',
    outline: 'border-2 border-gold-500 text-gold-600 hover:bg-gold-50',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onExport}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </button>
  );
};

export default PDFExportButton;

