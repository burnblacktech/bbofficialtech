// =====================================================
// TAX CALENDAR COMPONENT
// Displays tax deadlines in a calendar view
// =====================================================

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useDeadlines } from '../hooks/use-deadlines';
import DeadlineCard from './deadline-card';

const TaxCalendar = ({ year = null }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());

  const { data: deadlinesData, isLoading } = useDeadlines({ year: currentYear });

  const deadlines = deadlinesData?.deadlines || [];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Filter deadlines for current month
  const monthDeadlines = deadlines.filter((deadline) => {
    const deadlineDate = new Date(deadline.deadline_date);
    return (
      deadlineDate.getMonth() === currentMonth &&
      deadlineDate.getFullYear() === currentYear
    );
  });

  // Group deadlines by date
  const deadlinesByDate = monthDeadlines.reduce((acc, deadline) => {
    const date = new Date(deadline.deadline_date).getDate();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(deadline);
    return acc;
  }, {});

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-gold-600" />
            {months[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => {
            const now = new Date();
            setCurrentMonth(now.getMonth());
            setCurrentYear(now.getFullYear());
          }}
          className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] border border-gray-100"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayDeadlines = deadlinesByDate[day] || [];
            const isToday =
              day === new Date().getDate() &&
              currentMonth === new Date().getMonth() &&
              currentYear === new Date().getFullYear();
            const isPast = new Date(currentYear, currentMonth, day) < new Date();

            return (
              <div
                key={day}
                className={`min-h-[100px] border border-gray-100 p-2 ${
                  isToday ? 'bg-gold-50' : ''
                } ${isPast ? 'opacity-60' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-gold-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayDeadlines.slice(0, 2).map((deadline, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded ${
                        deadline.deadline_type === 'itr_filing'
                          ? 'bg-red-100 text-red-800'
                          : deadline.deadline_type === 'advance_tax'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      title={deadline.title}
                    >
                      {deadline.title.substring(0, 15)}
                      {deadline.title.length > 15 ? '...' : ''}
                    </div>
                  ))}
                  {dayDeadlines.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayDeadlines.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Deadlines List */}
      {monthDeadlines.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Deadlines in {months[currentMonth]}</h3>
          <div className="space-y-2">
            {monthDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}

      {monthDeadlines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p>No deadlines in {months[currentMonth]}</p>
        </div>
      )}
    </div>
  );
};

export default TaxCalendar;

