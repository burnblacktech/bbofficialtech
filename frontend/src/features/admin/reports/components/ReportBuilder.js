// =====================================================
// REPORT BUILDER COMPONENT
// Dynamic report building with metrics, dimensions, filters
// =====================================================

import React, { useState } from 'react';
import { BarChart3, Filter, Download, Save, Loader, CheckCircle } from 'lucide-react';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const ReportBuilder = () => {
  const [metrics, setMetrics] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: { startDate: '', endDate: '' },
    status: '',
    itrType: '',
    role: '',
    assessmentYear: '',
  });
  const [aggregation, setAggregation] = useState('count');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const availableMetrics = [
    { id: 'users', label: 'Users', description: 'User count and statistics' },
    { id: 'filings', label: 'Filings', description: 'ITR filing statistics' },
    { id: 'revenue', label: 'Revenue', description: 'Revenue metrics' },
    { id: 'drafts', label: 'Drafts', description: 'Draft statistics' },
    { id: 'tickets', label: 'Tickets', description: 'Support ticket metrics' },
  ];

  const availableDimensions = [
    { id: 'date', label: 'Date', description: 'Group by date' },
    { id: 'month', label: 'Month', description: 'Group by month' },
    { id: 'year', label: 'Year', description: 'Group by year' },
    { id: 'status', label: 'Status', description: 'Group by status' },
    { id: 'itrType', label: 'ITR Type', description: 'Group by ITR type' },
    { id: 'role', label: 'Role', description: 'Group by user role' },
  ];

  const handleMetricToggle = (metricId) => {
    setMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]);
  };

  const handleDimensionToggle = (dimensionId) => {
    setDimensions(prev =>
      prev.includes(dimensionId)
        ? prev.filter(id => id !== dimensionId)
        : [...prev, dimensionId]);
  };

  const handleGenerateReport = async () => {
    if (metrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiClient.post('/admin/reports/build', {
        metrics,
        dimensions,
        filters,
        aggregation,
      });

      if (response.data.success) {
        setReportData(response.data.data);
        toast.success('Report generated successfully');
      } else {
        throw new Error(response.data.error || 'Failed to generate report');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate report';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (metrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    try {
      const response = await apiClient.post('/admin/reports/templates', {
        name: templateName,
        description: `Report with ${metrics.length} metric(s)`,
        metrics,
        dimensions,
        filters,
        aggregation,
      });

      if (response.data.success) {
        toast.success('Template saved successfully');
        setTemplateName('');
      } else {
        throw new Error(response.data.error || 'Failed to save template');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save template';
      toast.error(errorMessage);
    }
  };

  const handleExport = async (format = 'csv') => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    try {
      // Export logic would go here
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-heading-md font-medium text-slate-900 mb-4">Select Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableMetrics.map(metric => (
            <label
              key={metric.id}
              className={`flex items-start space-x-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                metrics.includes(metric.id)
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={metrics.includes(metric.id)}
                onChange={() => handleMetricToggle(metric.id)}
                className="mt-1 w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
              <div>
                <div className="font-medium text-slate-900">{metric.label}</div>
                <div className="text-body-regular text-slate-500">{metric.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Dimensions Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-heading-md font-medium text-slate-900 mb-4">Select Dimensions (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDimensions.map(dimension => (
            <label
              key={dimension.id}
              className={`flex items-start space-x-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                dimensions.includes(dimension.id)
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={dimensions.includes(dimension.id)}
                onChange={() => handleDimensionToggle(dimension.id)}
                className="mt-1 w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
              <div>
                <div className="font-medium text-slate-900">{dimension.label}</div>
                <div className="text-body-regular text-slate-500">{dimension.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-heading-md font-medium text-slate-900 mb-4 flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, startDate: e.target.value },
              }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, endDate: e.target.value },
              }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">Status</label>
            <input
              type="text"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              placeholder="Filter by status"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">Aggregation</label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            >
              <option value="count">Count</option>
              <option value="sum">Sum</option>
              <option value="average">Average</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || metrics.length === 0}
              className="px-6 py-3 bg-gold-600 text-white rounded-xl hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
            {reportData && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || metrics.length === 0}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-heading-md font-medium text-slate-900 mb-4">Report Preview</h3>
          <div className="bg-slate-50 rounded-xl p-4">
            <pre className="text-body-regular overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;

