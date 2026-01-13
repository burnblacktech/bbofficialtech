// =====================================================
// ADMIN SECURITY LOGS PAGE
// Filtered view for security events
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/core/APIClient';
import AuditFilters from '../../features/admin/audit/components/AuditFilters';
import AuditLogTable from '../../features/admin/audit/components/AuditLogTable';
import toast from 'react-hot-toast';

const AdminSecurityLogs = () => {
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    action: '',
    resource: '',
    success: '',
    startDate: '',
    endDate: '',
  });
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['securityLogs', filters, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', limit);
      params.append('offset', offset);

      const response = await apiClient.get(`/admin/audit/security?${params.toString()}`);
      return response.data;
    },
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
  };

  const handleReset = (resetFilters) => {
    setFilters(resetFilters);
    setOffset(0);
  };

  const handlePageChange = (newOffset) => {
    setOffset(newOffset);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      params.append('format', 'csv');
      params.append('type', 'security');

      const response = await apiClient.get(`/admin/audit/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Security logs exported successfully');
    } catch (error) {
      toast.error('Failed to export security logs');
    }
  };

  if (error) {
    toast.error('Failed to load security logs');
  }

  // Calculate security stats
  const logs = data?.data?.logs || [];
  const failedLogins = logs.filter(log =>
    log.action?.toLowerCase().includes('login') && !log.success).length;
  const suspiciousActivity = logs.filter(log =>
    !log.success && (log.action?.toLowerCase().includes('password') || log.action?.toLowerCase().includes('session'))).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-error-600" />
                <div>
                  <h1 className="text-heading-1 font-bold text-black">Security Logs</h1>
                  <p className="text-slate-700 mt-2">Monitor security events, failed logins, and suspicious activities</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        {(failedLogins > 0 || suspiciousActivity > 0) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {failedLogins > 0 && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-error-600" />
                  <div>
                    <h3 className="text-heading-sm font-medium text-error-900">Failed Login Attempts</h3>
                    <p className="text-body-sm text-error-700 mt-1">{failedLogins} failed login attempts detected</p>
                  </div>
                </div>
              </div>
            )}
            {suspiciousActivity > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-warning-600" />
                  <div>
                    <h3 className="text-heading-sm font-medium text-warning-900">Suspicious Activity</h3>
                    <p className="text-body-sm text-warning-700 mt-1">{suspiciousActivity} suspicious activities detected</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <AuditFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Security Logs Table */}
        <AuditLogTable
          logs={logs}
          pagination={data?.data?.pagination}
          onPageChange={handlePageChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default AdminSecurityLogs;

