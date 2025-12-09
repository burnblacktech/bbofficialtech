// =====================================================
// DISCREPANCY FILTERS COMPONENT
// Filter discrepancies by severity and source
// =====================================================

import React from 'react';
import { Filter, X } from 'lucide-react';
import Button from '../../../components/common/Button';

const DiscrepancyFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const severityOptions = [
    { id: 'all', label: 'All Severities' },
    { id: 'info', label: 'Info', color: 'text-info-600' },
    { id: 'warning', label: 'Warning', color: 'text-warning-600' },
    { id: 'critical', label: 'Critical', color: 'text-error-600' },
  ];

  const sourceOptions = [
    { id: 'all', label: 'All Sources' },
    { id: 'ais', label: 'AIS' },
    { id: '26as', label: '26AS' },
    { id: 'form16', label: 'Form 16' },
    { id: 'manual', label: 'Manual Entry' },
  ];

  const hasActiveFilters =
    filters.severity !== 'all' || filters.source !== 'all';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-heading-sm text-gray-800">Filter Discrepancies</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Filter */}
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Severity
          </label>
          <div className="flex flex-wrap gap-2">
            {severityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onFilterChange({ ...filters, severity: option.id })}
                className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                  filters.severity === option.id
                    ? 'bg-gold-100 text-gold-700 border-2 border-gold-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Source
          </label>
          <div className="flex flex-wrap gap-2">
            {sourceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onFilterChange({ ...filters, source: option.id })}
                className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                  filters.source === option.id
                    ? 'bg-gold-100 text-gold-700 border-2 border-gold-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyFilters;

