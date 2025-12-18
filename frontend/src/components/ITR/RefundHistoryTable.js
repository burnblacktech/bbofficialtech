// =====================================================
// REFUND HISTORY TABLE COMPONENT
// Table showing refund history across all years
// =====================================================

import React, { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { formatIndianCurrency } from '../../lib/format';
import { cn } from '../../utils';
import Button from '../DesignSystem/components/Button';

const RefundHistoryTable = ({ refunds = [] }) => {
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get unique assessment years
  const assessmentYears = [...new Set(refunds.map(r => r.assessmentYear))].sort().reverse();

  // Filter refunds
  const filteredRefunds = refunds.filter(refund => {
    if (filterYear !== 'all' && refund.assessmentYear !== filterYear) return false;
    if (filterStatus !== 'all' && refund.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      credited: 'bg-success-100 text-success-800',
      issued: 'bg-info-100 text-info-800',
      processing: 'bg-warning-100 text-warning-800',
      failed: 'bg-error-100 text-error-800',
      adjusted: 'bg-gold-100 text-gold-800',
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-label-sm font-medium', styles[status] || 'bg-slate-100 text-gray-800')}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (refunds.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-body-md text-slate-600">No refund history found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-label-md font-medium text-slate-700">Filter:</span>
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by assessment year"
        >
          <option value="all">All Years</option>
          {assessmentYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="credited">Credited</option>
          <option value="issued">Issued</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="adjusted">Adjusted</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                Assessment Year
              </th>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                ITR Type
              </th>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                Status Date
              </th>
              <th className="px-6 py-3 text-left text-label-sm font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRefunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-body-md text-slate-900">
                  {refund.assessmentYear}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-body-md text-slate-900">
                  {refund.itrType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-number-md font-medium tabular-nums text-slate-900">
                    {formatIndianCurrency(refund.expectedAmount)}
                  </span>
                  {refund.interestAmount > 0 && (
                    <span className="text-body-sm text-slate-600 ml-2">
                      (+ {formatIndianCurrency(refund.interestAmount)} interest)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(refund.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-body-md text-slate-600">
                  {refund.statusDate
                    ? new Date(refund.statusDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    onClick={() => {
                      // Navigate to refund details
                      window.location.href = `/itr/refund-tracking?filingId=${refund.filingId}`;
                    }}
                    size="sm"
                    variant="outline"
                    className="text-body-sm"
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRefunds.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-body-md text-slate-600">No refunds found matching the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default RefundHistoryTable;

