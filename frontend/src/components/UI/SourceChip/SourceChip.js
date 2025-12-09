// =====================================================
// SOURCE CHIP COMPONENT
// Display data source with color coding
// =====================================================

import React from 'react';
import { FileText, FileSearch, FileCheck, FileSpreadsheet, PenTool, Sparkles, Landmark } from 'lucide-react';
import { COLORS } from '../../../constants/designTokens';
import Tooltip from '../../common/Tooltip';

const sourceConfig = {
  form16: {
    color: COLORS.source.form16,
    icon: FileText,
    label: 'Form 16',
    tooltip: 'Data extracted from Form 16',
  },
  ais: {
    color: COLORS.source.ais,
    icon: FileSearch,
    label: 'AIS',
    tooltip: 'Data from Annual Information Statement',
  },
  '26as': {
    color: COLORS.source['26as'],
    icon: FileCheck,
    label: '26AS',
    tooltip: 'Data from Form 26AS',
  },
  broker: {
    color: COLORS.source.broker,
    icon: FileSpreadsheet,
    label: 'Broker',
    tooltip: 'Data from broker statement',
  },
  bank: {
    color: '#EC4899',
    icon: Landmark,
    label: 'Bank',
    tooltip: 'Data from bank statement',
  },
  manual: {
    color: COLORS.source.manual,
    icon: PenTool,
    label: 'Manual',
    tooltip: 'Manually entered data',
  },
  ai: {
    color: 'linear-gradient(135deg, #D4AF37 0%, #FFE4A0 100%)',
    icon: Sparkles,
    label: 'AI Extracted',
    tooltip: 'AI-generated suggestion',
  },
  'auto-filled': {
    color: COLORS.info[500],
    icon: Sparkles,
    label: 'Auto-filled',
    tooltip: 'Automatically filled data',
  },
};

const SourceChip = ({
  source,
  verified = false,
  className = '',
  showIcon = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  documentName,
}) => {
  if (!source || !sourceConfig[source]) {
    return null;
  }

  const config = sourceConfig[source];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-label-sm px-2 py-0.5',
    md: 'text-label-md px-2.5 py-1',
    lg: 'text-label-lg px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const chip = (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-medium ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      style={{
        backgroundColor: typeof config.color === 'string' && !config.color.includes('gradient')
          ? `${config.color}1A`
          : undefined,
        background: config.color.includes('gradient') ? config.color : undefined,
        color: typeof config.color === 'string' && !config.color.includes('gradient')
          ? config.color
          : '#FFFFFF',
        border: verified ? `1px solid ${config.color}` : 'none',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{documentName || config.label}</span>
      {verified && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );

  if (config.tooltip) {
    return (
      <Tooltip content={config.tooltip}>
        {chip}
      </Tooltip>
    );
  }

  return chip;
};

export default SourceChip;

