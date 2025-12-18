// =====================================================
// DISCREPANCY MANAGER COMPONENT
// Main component managing all discrepancies with smart grouping
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, CheckSquare, Square } from 'lucide-react';
import DiscrepancyGroup from './DiscrepancyGroup';
import AISuggestionCard from './AISuggestionCard';
import { cn } from '../../../utils';
import Button from '../../../components/DesignSystem/components/Button';

const DiscrepancyManager = ({
  discrepancies = [],
  grouped = {},
  suggestions = [],
  onResolve,
  onBulkResolve,
  className = '',
}) => {
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Filter discrepancies
  const filteredDiscrepancies = discrepancies.filter(d => {
    if (searchTerm && !d.fieldPath?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.fieldName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) {
      return false;
    }
    if (filterSection !== 'all') {
      const section = d.fieldPath?.split('.')[0];
      if (section !== filterSection) {
        return false;
      }
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedDiscrepancies.size === filteredDiscrepancies.length) {
      setSelectedDiscrepancies(new Set());
    } else {
      setSelectedDiscrepancies(new Set(filteredDiscrepancies.map((_, index) => index)));
    }
  };

  const handleBulkResolve = (action) => {
    const selected = Array.from(selectedDiscrepancies).map(index => filteredDiscrepancies[index]);
    if (onBulkResolve) {
      onBulkResolve(selected, action);
      setSelectedDiscrepancies(new Set());
    }
  };

  const sections = Object.keys(grouped.bySection || {});

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-lg text-gray-800">
            Data Discrepancies
          </h3>
          <p className="text-body-md text-slate-600 mt-1">
            {filteredDiscrepancies.length} discrepancy{filteredDiscrepancies.length !== 1 ? 'ies' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSuggestions(!showSuggestions)}
            variant="outline"
            size="sm"
          >
            {showSuggestions ? 'Hide' : 'Show'} AI Suggestions
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search discrepancies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            aria-label="Search discrepancies"
          />
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by section"
        >
          <option value="all">All Sections</option>
          {sections.map(section => (
            <option key={section} value={section}>{section.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-label-md font-semibold text-slate-900">AI-Powered Suggestions</h4>
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <AISuggestionCard
              key={index}
              suggestion={suggestion}
              onApply={() => {
                if (onResolve) {
                  onResolve(suggestion.discrepancy, suggestion.suggestion.action, suggestion.suggestion.suggestedValue);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedDiscrepancies.size > 0 && (
        <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-body-md font-medium text-info-900">
            {selectedDiscrepancies.size} discrepancy{selectedDiscrepancies.size !== 1 ? 'ies' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkResolve('accept_source')}
              size="sm"
              variant="outline"
            >
              Accept Source Values
            </Button>
            <Button
              onClick={() => handleBulkResolve('accept_manual')}
              size="sm"
              variant="outline"
            >
              Keep Manual Values
            </Button>
          </div>
        </div>
      )}

      {/* Grouped Discrepancies */}
      <div className="space-y-4">
        {Object.entries(grouped.bySection || {}).map(([section, sectionDiscrepancies]) => {
          const filtered = sectionDiscrepancies.filter(d => {
            if (searchTerm && !d.fieldPath?.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
            }
            if (filterSeverity !== 'all' && d.severity !== filterSeverity) {
              return false;
            }
            return true;
          });

          if (filtered.length === 0) return null;

          return (
            <DiscrepancyGroup
              key={section}
              section={section}
              discrepancies={filtered}
              selectedIndices={selectedDiscrepancies}
              onSelect={(index) => {
                const newSelected = new Set(selectedDiscrepancies);
                if (newSelected.has(index)) {
                  newSelected.delete(index);
                } else {
                  newSelected.add(index);
                }
                setSelectedDiscrepancies(newSelected);
              }}
              onResolve={onResolve}
              onBulkResolve={(action) => {
                if (onBulkResolve) {
                  onBulkResolve(filtered, action);
                }
              }}
            />
          );
        })}
      </div>

      {filteredDiscrepancies.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400" aria-hidden="true" />
          <p className="text-body-md text-slate-600">No discrepancies found matching your filters</p>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyManager;

