// =====================================================
// DEADLINE LIST COMPONENT
// Displays deadlines in a list view with filters
// =====================================================

import React, { useState } from 'react';
import { Filter, Calendar, AlertTriangle } from 'lucide-react';
import { useDeadlines } from '../hooks/use-deadlines';
import DeadlineCard from './deadline-card';

const DeadlineList = ({ year = null, type = null }) => {
  const [filterType, setFilterType] = useState(type || 'all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past

  const { data: deadlinesData, isLoading } = useDeadlines({ year, type: filterType !== 'all' ? filterType : null });

  const deadlines = deadlinesData?.deadlines || [];

  // Filter by status
  const filteredDeadlines = deadlines.filter((deadline) => {
    if (filterStatus === 'all') return true;
    const deadlineDate = new Date(deadline.deadline_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    if (filterStatus === 'upcoming') {
      return deadlineDate >= today;
    }
    if (filterStatus === 'past') {
      return deadlineDate < today;
    }
    return true;
  });

  // Sort by date
  const sortedDeadlines = [...filteredDeadlines].sort(
    (a, b) => new Date(a.deadline_date) - new Date(b.deadline_date),
  );

  const deadlineTypes = [
    { value: 'all', label: 'All Deadlines' },
    { value: 'itr_filing', label: 'ITR Filing' },
    { value: 'advance_tax', label: 'Advance Tax' },
    { value: 'tds_deposit', label: 'TDS Deposit' },
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Loading deadlines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">Deadline Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {deadlineTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {sortedDeadlines.length > 0 ? (
          sortedDeadlines.map((deadline) => (
            <DeadlineCard key={deadline.id} deadline={deadline} />
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p>No deadlines found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlineList;

