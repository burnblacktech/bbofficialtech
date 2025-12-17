// =====================================================
// FILING STATUS TRACKER - ACTIVE STATE DASHBOARD
// Visual stepper/timeline showing filing progress
// =====================================================

import React from 'react';
import { CheckCircle, Clock, Download, FileText, Calendar, Hash } from 'lucide-react';

const FilingStatusTracker = ({ filing }) => {
  // Mock filing data - replace with actual data from props
  const mockFiling = {
    acknowledgementNumber: 'ITR202400123456789',
    filingDate: '2024-08-15',
    assessmentYear: '2024-25',
    status: 'processing', // 'filed', 'processing', 'completed'
    refundAmount: 45000,
    ...filing,
  };

  const steps = [
    {
      id: 'filed',
      title: 'Filed & Verified',
      description: 'Your return has been successfully filed and e-verified',
      icon: CheckCircle,
      completed: true,
      date: 'Aug 15, 2024',
    },
    {
      id: 'processing',
      title: 'Processing by ITD',
      description: 'Income Tax Department is reviewing your return',
      icon: Clock,
      completed: mockFiling.status === 'completed',
      current: mockFiling.status === 'processing',
      date: mockFiling.status === 'processing' ? 'In Progress' : 'Aug 20, 2024',
    },
    {
      id: 'completed',
      title: 'Refund Issued',
      description: 'Your refund has been processed and credited',
      icon: CheckCircle,
      completed: mockFiling.status === 'completed',
      date: mockFiling.status === 'completed' ? 'Aug 25, 2024' : 'Expected Aug 25, 2024',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-elevation-3 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-lg font-semibold mb-2">Filing Status</h2>
            <p className="text-white text-opacity-90 text-body-sm">Assessment Year {mockFiling.assessmentYear}</p>
          </div>
          <div className="text-right">
            <div className="text-number-lg font-semibold tabular-nums">₹{mockFiling.refundAmount.toLocaleString('en-IN')}</div>
            <div className="text-white text-opacity-90 text-body-sm">Expected Refund</div>
          </div>
        </div>
      </div>

      {/* Filing Details */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Hash className="w-5 h-5 text-slate-400 mr-3" />
            <div>
              <p className="text-label-sm text-slate-500">Acknowledgement Number</p>
              <p className="font-mono text-body-sm font-medium text-slate-900">
                {mockFiling.acknowledgementNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-slate-400 mr-3" />
            <div>
              <p className="text-label-sm text-slate-500">Filing Date</p>
              <p className="text-body-sm font-medium text-slate-900">
                {new Date(mockFiling.filingDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="p-6">
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-start">
                {/* Icon and Line */}
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-100 text-green-600'
                      : step.current
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-16 mt-2 ${
                      step.completed ? 'bg-green-200' : 'bg-slate-200'
                    }`}></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-heading-sm font-semibold ${
                      step.completed ? 'text-success-600' : step.current ? 'text-info-600' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </h3>
                    <span className="text-body-sm text-slate-500">{step.date}</span>
                  </div>
                  <p className="text-slate-600 text-body-sm">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 bg-slate-50 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Download ITR-V
          </button>
          <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Download Full Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilingStatusTracker;
