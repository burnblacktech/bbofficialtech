// =====================================================
// DATA SOURCE BADGE
// Displays data source indicator with icon and label
// =====================================================

import React from 'react';
import { FileText, Database, User, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DATA_SOURCE_LABELS } from '../../services/AutoPopulationService';

const SOURCE_ICONS = {
  verified: CheckCircle,
  previous_year: RefreshCw,
  form16: FileText,
  ais: Database,
  form26as: Database,
  eri: Database,
  user_profile: User,
  manual: AlertCircle,
};

const SOURCE_COLORS = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  previous_year: 'bg-blue-50 text-blue-700 border-blue-200',
  form16: 'bg-purple-50 text-purple-700 border-purple-200',
  ais: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  form26as: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  eri: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  user_profile: 'bg-slate-50 text-slate-700 border-slate-200',
  manual: 'bg-amber-50 text-amber-700 border-amber-200',
};

const DataSourceBadge = ({
  source,
  onRefresh = null,
  className = '',
  showIcon = true,
  size = 'sm', // 'sm' | 'md'
}) => {
  if (!source) return null;

  const sourceKey = typeof source === 'string' ? source : source.source;
  const Icon = SOURCE_ICONS[sourceKey] || FileText;
  const colorClass = SOURCE_COLORS[sourceKey] || SOURCE_COLORS.manual;
  const label = DATA_SOURCE_LABELS[sourceKey] || 'Unknown Source';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border',
        colorClass,
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span className="font-medium">{label}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-1 hover:opacity-70 transition-opacity"
          title="Refresh from source"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default DataSourceBadge;

