// =====================================================
// DASHBOARD WIDGETS - STATS CARDS
// Key metrics displayed with new Solar Gold / Ember palette
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
      bgGradient: 'bg-aurora-gradient',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-100',
    },
    {
      title: 'Pending Actions',
      value: widgetStats.pendingActions,
      icon: Clock,
      bgGradient: 'bg-gradient-to-br from-ember-500 to-ember-600',
      textColor: 'text-ember-600',
      bgColor: 'bg-ember-50',
      borderColor: 'border-ember-100',
    },
    {
      title: 'Documents',
      value: widgetStats.documentsUploaded,
      icon: Folder,
      bgGradient: 'bg-gradient-to-br from-info-500 to-info-600',
      textColor: 'text-info-600',
      bgColor: 'bg-info-50',
      borderColor: 'border-info-100',
    },
    {
      title: 'Tax Saved',
      value: `₹${widgetStats.taxSaved.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      bgGradient: 'bg-gradient-to-br from-success-500 to-success-600',
      textColor: 'text-success-600',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {widgets.map((widget, index) => {
        const Icon = widget.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-card border ${widget.borderColor} p-4 hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 group cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${widget.bgGradient} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <ArrowUpRight className={`h-3.5 w-3.5 ${widget.textColor} opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all`} />
            </div>
            <div>
              <p className="text-label-sm font-medium text-slate-500 mb-1">{widget.title}</p>
              <p className="text-number-md sm:text-number-lg font-bold text-slate-900 tabular-nums">{widget.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardWidgets;
