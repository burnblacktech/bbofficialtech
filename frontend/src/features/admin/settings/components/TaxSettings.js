// =====================================================
// TAX SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const TaxSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    currentAssessmentYear: '',
    filingDeadline: '',
    extensionDeadline: '',
    defaultITRType: 'ITR-1',
    enableAutoComputation: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/tax');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings) => {
      const response = await apiClient.put('/admin/settings/tax', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['taxSettings']);
      toast.success('Tax settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (data?.data) {
      setFormData(prev => ({ ...prev, ...data.data }));
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gold-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Current Assessment Year
          </label>
          <input
            type="text"
            value={formData.currentAssessmentYear}
            onChange={(e) => setFormData(prev => ({ ...prev, currentAssessmentYear: e.target.value }))}
            placeholder="e.g., 2024-25"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Filing Deadline
          </label>
          <input
            type="date"
            value={formData.filingDeadline}
            onChange={(e) => setFormData(prev => ({ ...prev, filingDeadline: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Extension Deadline
          </label>
          <input
            type="date"
            value={formData.extensionDeadline}
            onChange={(e) => setFormData(prev => ({ ...prev, extensionDeadline: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Default ITR Type
          </label>
          <select
            value={formData.defaultITRType}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultITRType: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          >
            <option value="ITR-1">ITR-1</option>
            <option value="ITR-2">ITR-2</option>
            <option value="ITR-3">ITR-3</option>
            <option value="ITR-4">ITR-4</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="enableAutoComputation"
          checked={formData.enableAutoComputation}
          onChange={(e) => setFormData(prev => ({ ...prev, enableAutoComputation: e.target.checked }))}
          className="w-4 h-4 text-gold-600 focus:ring-gold-500"
        />
        <label htmlFor="enableAutoComputation" className="text-body-regular font-medium text-slate-700">
          Enable Auto Tax Computation
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="px-6 py-3 bg-gold-600 text-white rounded-xl hover:bg-gold-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {mutation.isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TaxSettings;

