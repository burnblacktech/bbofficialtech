// =====================================================
// ADMIN ACTIVITY LOGS PAGE
// Filtered view for admin actions only
// =====================================================

import React, { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/core/APIClient';
import AuditFilters from '../../features/admin/audit/components/AuditFilters';
import AuditLogTable from '../../features/admin/audit/components/AuditLogTable';
import toast from 'react-hot-toast';

const AdminActivityLogs = () => {
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
    queryKey: ['adminActivityLogs', filters, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append('adminUserId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', limit);
      params.append('offset', offset);

      const response = await apiClient.get(`/admin/audit/admin-activity?${params.toString()}`);
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
      params.append('type', 'admin-activity');

      const response = await apiClient.get(`/admin/audit/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin-activity-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Admin activity logs exported successfully');
    } catch (error) {
      toast.error('Failed to export admin activity logs');
    }
  };

  if (error) {
    toast.error('Failed to load admin activity logs');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-gold-600" />
                <div>
                  <h1 className="text-heading-1 font-bold text-black">Admin Activity Logs</h1>
                  <p className="text-slate-700 mt-2">View all admin actions and system changes</p>
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

        {/* Filters */}
        <AuditFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Admin Activity Logs Table */}
        <AuditLogTable
          logs={data?.data?.logs || []}
          pagination={data?.data?.pagination}
          onPageChange={handlePageChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default AdminActivityLogs;

