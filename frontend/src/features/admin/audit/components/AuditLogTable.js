// =====================================================
// AUDIT LOG TABLE COMPONENT
// Reusable table component for displaying audit logs
// =====================================================

import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogTable = ({ logs, pagination, onPageChange, onExport, isLoading }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  };

  const handlePageChange = (newOffset) => {
    if (onPageChange) {
      onPageChange(newOffset);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading audit logs...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-600">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header with Export */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-heading-sm font-medium text-slate-900">Audit Logs</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-gold-600 text-white rounded-xl hover:bg-gold-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                    {log.user?.fullName || log.user?.email || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                    {log.resource || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.success ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-success-100 text-success-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-error-100 text-error-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-regular">
                    <button
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      className="text-gold-600 hover:text-gold-700 flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
                {expandedRow === log.id && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 bg-slate-50">
                      <div className="space-y-2">
                        <div>
                          <strong>Resource ID:</strong> {log.resourceId || '-'}
                        </div>
                        {log.errorMessage && (
                          <div>
                            <strong>Error:</strong> {log.errorMessage}
                          </div>
                        )}
                        {log.metadata && (
                          <div>
                            <strong>Metadata:</strong>
                            <pre className="mt-2 p-2 bg-slate-100 rounded text-body-small overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-body-regular text-slate-700">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="px-3 py-2 border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-body-regular text-slate-700">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-3 py-2 border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;

