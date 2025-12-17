// =====================================================
// DISCREPANCY HISTORY COMPONENT
// Component showing resolution audit trail
// =====================================================

import React, { useState } from 'react';
import { Clock, User, CheckCircle, FileText, Download } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import Button from '../../../components/DesignSystem/components/Button';

const DiscrepancyHistory = ({
  history = [],
  onExport,
  className = '',
}) => {
  const [filterDate, setFilterDate] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  // Filter history
  const filteredHistory = history.filter(entry => {
    if (filterDate !== 'all') {
      const entryDate = new Date(entry.resolvedAt);
      const now = new Date();
      const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));

      if (filterDate === 'today' && daysDiff > 0) return false;
      if (filterDate === 'week' && daysDiff > 7) return false;
      if (filterDate === 'month' && daysDiff > 30) return false;
    }
    if (filterAction !== 'all' && entry.resolutionAction !== filterAction) {
      return false;
    }
    return true;
  });

  const getActionLabel = (action) => {
    switch (action) {
      case 'accept_manual':
        return 'Accepted Manual Value';
      case 'accept_source':
        return 'Accepted Source Value';
      case 'custom':
        return 'Custom Value';
      case 'explained':
        return 'Explained';
      default:
        return action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'accept_manual':
        return 'bg-info-100 text-info-800';
      case 'accept_source':
        return 'bg-success-100 text-success-800';
      case 'custom':
        return 'bg-gold-100 text-gold-800';
      case 'explained':
        return 'bg-slate-100 text-gray-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  if (history.length === 0) {
    return (
      <div className={cn('rounded-xl border border-slate-200 p-8 text-center', className)}>
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No resolution history found</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-heading-lg font-semibold text-slate-900">Resolution History</h3>
        {onExport && (
          <Button
            onClick={onExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by date"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by action"
        >
          <option value="all">All Actions</option>
          <option value="accept_manual">Accepted Manual</option>
          <option value="accept_source">Accepted Source</option>
          <option value="custom">Custom Value</option>
          <option value="explained">Explained</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredHistory.map((entry, index) => (
          <div
            key={entry.id || index}
            className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-l-0"
          >
            <div className="absolute -left-2 top-0">
              <div className="h-4 w-4 rounded-full bg-primary-600 border-2 border-white" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className={cn('px-2 py-1 rounded-full text-label-sm font-medium', getActionColor(entry.resolutionAction))}>
                      {getActionLabel(entry.resolutionAction)}
                    </span>
                  </div>
                  <p className="text-body-md font-medium text-slate-900 capitalize">
                    {entry.fieldPath?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-label-sm text-slate-600">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {new Date(entry.resolvedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <p className="text-body-sm text-slate-600">Manual Value</p>
                  <p className="text-number-md font-medium tabular-nums">
                    {typeof entry.manualValue === 'number'
                      ? formatIndianCurrency(entry.manualValue)
                      : entry.manualValue || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-slate-600">Source Value</p>
                  <p className="text-number-md font-medium tabular-nums">
                    {typeof entry.sourceValue === 'number'
                      ? formatIndianCurrency(entry.sourceValue)
                      : entry.sourceValue || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-slate-600">Resolved Value</p>
                  <p className="text-number-md font-medium tabular-nums">
                    {typeof entry.resolvedValue === 'number'
                      ? formatIndianCurrency(entry.resolvedValue)
                      : entry.resolvedValue || '-'}
                  </p>
                </div>
              </div>

              {entry.explanation && (
                <div className="mt-2 p-2 bg-slate-50 rounded-xl">
                  <p className="text-label-md font-medium mb-1 text-slate-900">Explanation:</p>
                  <p className="text-body-md text-slate-700">{entry.explanation}</p>
                </div>
              )}

              {entry.confidenceScore > 0 && (
                <div className="mt-2 text-body-sm text-slate-600">
                  AI Confidence: {Math.round(entry.confidenceScore * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No resolutions found matching the selected filters
        </div>
      )}
    </div>
  );
};

export default DiscrepancyHistory;

