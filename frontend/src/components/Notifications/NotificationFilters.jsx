// =====================================================
// NOTIFICATION FILTERS COMPONENT
// Filter notifications by type and read status
// =====================================================

import React from 'react';
import { Filter } from 'lucide-react';

const NotificationFilters = ({ filters, onFilterChange }) => {
  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'filing_update', label: 'Filing Updates' },
    { value: 'document_request', label: 'Document Requests' },
    { value: 'deadline_reminder', label: 'Deadline Reminders' },
    { value: 'refund_update', label: 'Refund Updates' },
    { value: 'system_announcement', label: 'System Announcements' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-slate-600" />
        <h3 className="text-heading-sm font-semibold text-slate-900">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Notification Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
          >
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Read Status Filter */}
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={filters.read}
            onChange={(e) => onFilterChange('read', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;

