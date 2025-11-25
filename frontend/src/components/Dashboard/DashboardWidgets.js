// =====================================================
// DASHBOARD WIDGETS - STATS CARDS
// Key metrics displayed as colorful cards
// =====================================================

import React from 'react';
import { FileText, Clock, Folder, TrendingUp, ArrowUpRight } from 'lucide-react';

const DashboardWidgets = ({ stats }) => {
  // Default stats if not provided
  const defaultStats = {
    totalFilings: 0,
    pendingActions: 0,
    documentsUploaded: 0,
    taxSaved: 0,
  };

  const widgetStats = stats || defaultStats;

  const widgets = [
    {
      title: 'Total Filings',
      value: widgetStats.totalFilings,
      icon: FileText,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Actions',
      value: widgetStats.pendingActions,
      icon: Clock,
      color: 'yellow',
      bgGradient: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Documents',
      value: widgetStats.documentsUploaded,
      icon: Folder,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tax Saved',
      value: `₹${widgetStats.taxSaved.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {widgets.map((widget, index) => {
        const Icon = widget.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4 sm:mb-5">
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-xl bg-gradient-to-br ${widget.bgGradient} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <ArrowUpRight className={`h-4 w-4 sm:h-5 sm:w-5 ${widget.textColor} opacity-40 group-hover:opacity-60 transition-opacity`} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">{widget.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{widget.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardWidgets;

