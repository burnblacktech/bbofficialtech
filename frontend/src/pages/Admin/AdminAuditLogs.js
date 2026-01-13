// =====================================================
// ADMIN AUDIT LOGS PAGE
// Main audit logs page with filters and table
// =====================================================

import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/core/APIClient';
import AuditFilters from '../../features/admin/audit/components/AuditFilters';
import AuditLogTable from '../../features/admin/audit/components/AuditLogTable';
import toast from 'react-hot-toast';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const AdminAuditLogs = () => {
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    action: '',
    resource: '',
    success: '',
    startDate: '',
    endDate: '' });
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogs', filters, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      params.append('limit', limit);
      params.append('offset', offset);

      const response = await apiClient.get(`/admin/audit/logs?${params.toString()}`);
      return response.data;
    } });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0); // Reset to first page when filters change
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

      const response = await apiClient.get(`/admin/audit/export?${params.toString()}`, {
        responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Audit logs exported successfully');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  if (error) {
    toast.error('Failed to load audit logs');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-1 font-bold text-black">Audit Logs</h1>
              <p className="text-slate-700 mt-2">View and filter all system audit logs</p>
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

        {/* Audit Logs Table */}
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

export default AdminAuditLogs;

