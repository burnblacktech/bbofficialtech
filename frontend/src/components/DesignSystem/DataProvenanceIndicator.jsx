// =====================================================
// DATA PROVENANCE INDICATOR COMPONENT
// Shows data source (Manual/AIS/26AS/Form16) with confidence and verification
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Upload, PenTool, CheckCircle, AlertCircle } from 'lucide-react';
import SourceChip from '../UI/SourceChip/SourceChip';
import VerificationState from '../UI/VerificationState/VerificationState';

const SOURCE_CONFIG = {
  manual: {
    icon: PenTool,
    label: 'Manual Entry',
    color: 'text-slate-600',
  },
  ais: {
    icon: Database,
    label: 'AIS',
    color: 'text-blue-600',
  },
  '26as': {
    icon: FileText,
    label: 'Form 26AS',
    color: 'text-purple-600',
  },
  form16: {
    icon: FileText,
    label: 'Form 16',
    color: 'text-green-600',
  },
  ocr: {
    icon: Upload,
    label: 'OCR',
    color: 'text-orange-600',
  },
};

const DataProvenanceIndicator = ({
  source = 'manual',
  confidence,
  verified = false,
  lastUpdated,
  showDetails = false,
  size = 'sm',
  className = '',
}) => {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.div
      className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      <span className={`${config.color} font-medium`}>{config.label}</span>

      {confidence !== undefined && confidence !== null && (
        <span className="text-slate-500 text-body-small">
          ({Math.round(confidence * 100)}%)
        </span>
      )}

      {verified && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CheckCircle className={`${iconSizes[size]} text-emerald-600`} />
        </motion.div>
      )}

      {showDetails && lastUpdated && (
        <span className="text-slate-400 text-body-small ml-1">
          • {new Date(lastUpdated).toLocaleDateString()}
        </span>
      )}
    </motion.div>
  );
};

export default DataProvenanceIndicator;

