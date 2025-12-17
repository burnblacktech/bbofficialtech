// =====================================================
// AUDIT FILTERS COMPONENT
// Reusable filter component for audit logs
// =====================================================

import React, { useState } from 'react';
import { Filter, X, Calendar, User, Search, CheckCircle, XCircle } from 'lucide-react';

const AuditFilters = ({ filters, onFilterChange, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    search: '',
    userId: '',
    action: '',
    resource: '',
    success: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      userId: '',
      action: '',
      resource: '',
      success: '',
      startDate: '',
      endDate: '',
    };
    setLocalFilters(resetFilters);
    onReset(resetFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-heading-sm font-medium text-slate-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-body-sm text-slate-600 hover:text-slate-900 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search actions, resources..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>

        {/* User ID */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            User ID
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={localFilters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>

        {/* Action */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Action
          </label>
          <input
            type="text"
            value={localFilters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            placeholder="Action type"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          />
        </div>

        {/* Resource */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Resource
          </label>
          <input
            type="text"
            value={localFilters.resource}
            onChange={(e) => handleFilterChange('resource', e.target.value)}
            placeholder="Resource type"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          />
        </div>

        {/* Success Status */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={localFilters.success}
            onChange={(e) => handleFilterChange('success', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;

