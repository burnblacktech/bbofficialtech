// =====================================================
// SCENARIO BUILDER COMPONENT
// Component for building tax-saving simulation scenarios
// =====================================================

import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, Building2, Heart, Home, Calculator, Save, FolderOpen, Star, Download } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ScenarioBuilder = ({ filingId, onSimulate, onCompare }) => {
  const queryClient = useQueryClient();
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState({
    type: 'section80C',
    name: '',
    description: '',
    changes: {},
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Fetch saved scenarios
  const { data: savedScenariosData, refetch: refetchScenarios } = useQuery({
    queryKey: ['scenarios', filingId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filingId) params.append('filingId', filingId);
      const response = await apiClient.get(`/itr/scenarios?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!filingId,
  });

  const savedScenarios = savedScenariosData?.scenarios || [];

  // Save scenario mutation
  const saveScenarioMutation = useMutation({
    mutationFn: async (scenarioData) => {
      const response = await apiClient.post('/itr/scenarios', {
        filingId,
        ...scenarioData,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Scenario saved successfully!');
      setShowSaveModal(false);
      queryClient.invalidateQueries(['scenarios', filingId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save scenario');
    },
  });

  const handleSaveScenario = () => {
    if (!currentScenario.name || !currentScenario.changes.amount) {
      toast.error('Please provide a scenario name and amount');
      return;
    }
    saveScenarioMutation.mutate({
      name: currentScenario.name,
      description: currentScenario.description,
      scenarioType: currentScenario.type,
      changes: currentScenario.changes,
    });
  };

  const handleLoadScenario = (savedScenario) => {
    setCurrentScenario({
      type: savedScenario.scenarioType,
      name: savedScenario.name,
      description: savedScenario.description || '',
      changes: savedScenario.changes,
    });
    setShowLoadModal(false);
    toast.success('Scenario loaded!');
  };

  const scenarioTypes = [
    {
      id: 'section80C',
      label: 'Section 80C Investment',
      icon: TrendingUp,
      description: 'ELSS, PPF, NSC, Tax-saving FD, etc.',
      maxAmount: 150000,
      fields: [
        {
          name: 'amount',
          label: 'Investment Amount',
          type: 'number',
          placeholder: 'Enter amount',
          max: 150000,
        },
        {
          name: 'investmentType',
          label: 'Investment Type',
          type: 'select',
          options: [
            { value: 'elss', label: 'ELSS Mutual Fund' },
            { value: 'ppf', label: 'PPF' },
            { value: 'nsc', label: 'NSC' },
            { value: 'taxSavingFD', label: 'Tax Saving FD' },
            { value: 'lifeInsurance', label: 'Life Insurance Premium' },
            { value: 'sukanyaSamriddhi', label: 'Sukanya Samriddhi Yojana' },
          ],
        },
      ],
    },
    {
      id: 'section80CCD',
      label: 'NPS Contribution (Section 80CCD)',
      icon: Building2,
      description: 'Additional NPS contribution for extra deduction',
      maxAmount: 50000,
      fields: [
        {
          name: 'amount',
          label: 'NPS Contribution Amount',
          type: 'number',
          placeholder: 'Enter amount',
          max: 50000,
        },
      ],
    },
    {
      id: 'section80D',
      label: 'Health Insurance (Section 80D)',
      icon: Heart,
      description: 'Health insurance premium for self/family',
      maxAmount: 25000,
      fields: [
        {
          name: 'amount',
          label: 'Premium Amount',
          type: 'number',
          placeholder: 'Enter premium amount',
          max: 25000,
        },
        {
          name: 'coverageType',
          label: 'Coverage Type',
          type: 'select',
          options: [
            { value: 'self', label: 'Self' },
            { value: 'family', label: 'Family' },
            { value: 'parents', label: 'Parents' },
            { value: 'selfAndParents', label: 'Self + Parents' },
          ],
        },
      ],
    },
    {
      id: 'hraOptimization',
      label: 'HRA Optimization',
      icon: Home,
      description: 'Optimize House Rent Allowance exemption',
      fields: [
        {
          name: 'rentPaid',
          label: 'Rent Paid (Annual)',
          type: 'number',
          placeholder: 'Enter annual rent paid',
        },
        {
          name: 'hra',
          label: 'HRA Received',
          type: 'number',
          placeholder: 'Enter HRA received',
        },
        {
          name: 'basicSalary',
          label: 'Basic Salary',
          type: 'number',
          placeholder: 'Enter basic salary',
        },
      ],
    },
    {
      id: 'section24',
      label: 'Home Loan Interest (Section 24)',
      icon: Home,
      description: 'Interest on home loan deduction',
      maxAmount: 200000,
      fields: [
        {
          name: 'interestAmount',
          label: 'Interest Amount',
          type: 'number',
          placeholder: 'Enter interest amount',
          max: 200000,
        },
      ],
    },
  ];

  const handleScenarioTypeChange = (type) => {
    const scenarioType = scenarioTypes.find(st => st.id === type);
    setCurrentScenario({
      type,
      name: scenarioType?.label || '',
      changes: {},
    });
  };

  const handleFieldChange = (fieldName, value) => {
    setCurrentScenario(prev => ({
      ...prev,
      changes: {
        ...prev.changes,
        [fieldName]: value,
      },
    }));
  };

  const handleAddScenario = () => {
    if (!currentScenario.type || !currentScenario.changes.amount) {
      return;
    }

    const newScenario = {
      id: `scenario-${Date.now()}`,
      ...currentScenario,
      name: currentScenario.name || scenarioTypes.find(st => st.id === currentScenario.type)?.label,
    };

    setScenarios(prev => [...prev, newScenario]);
    setCurrentScenario({
      type: 'section80C',
      name: '',
      changes: {},
    });
  };

  const handleRemoveScenario = (scenarioId) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
  };

  const handleSimulate = () => {
    if (scenarios.length === 0) {
      // Simulate single scenario
      if (currentScenario.type && currentScenario.changes.amount) {
        onSimulate({
          id: `scenario-${Date.now()}`,
          ...currentScenario,
          name: currentScenario.name || scenarioTypes.find(st => st.id === currentScenario.type)?.label,
        });
      }
    } else if (scenarios.length === 1) {
      // Simulate single scenario from list
      onSimulate(scenarios[0]);
    } else {
      // Compare multiple scenarios
      onCompare(scenarios);
    }
  };

  const selectedScenarioType = scenarioTypes.find(st => st.id === currentScenario.type);

  return (
    <div className="space-y-6">
      {/* Scenario Type Selection */}
      <div>
        <label className="block text-body-sm font-medium text-slate-700 mb-3">
          Select Scenario Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarioTypes.map((scenarioType) => {
            const Icon = scenarioType.icon;
            return (
              <button
                key={scenarioType.id}
                onClick={() => handleScenarioTypeChange(scenarioType.id)}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  currentScenario.type === scenarioType.id
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start">
                  <Icon className={`h-5 w-5 mr-3 mt-0.5 ${
                    currentScenario.type === scenarioType.id ? 'text-gold-600' : 'text-slate-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-body-sm font-medium text-slate-900 mb-1">
                      {scenarioType.label}
                    </h4>
                    <p className="text-body-xs text-slate-600">
                      {scenarioType.description}
                    </p>
                    {scenarioType.maxAmount && (
                      <p className="text-body-xs text-slate-500 mt-1">
                        Max: ₹{scenarioType.maxAmount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Fields */}
      {selectedScenarioType && (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-heading-sm text-slate-900 font-medium mb-4">
            Configure {selectedScenarioType.label}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedScenarioType.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-body-sm font-medium text-slate-700 mb-2">
                  {field.label}
                  {field.max && (
                    <span className="text-body-xs text-slate-500 ml-2">
                      (Max: ₹{field.max.toLocaleString('en-IN')})
                    </span>
                  )}
                </label>
                {field.type === 'number' ? (
                  <input
                    type="number"
                    value={currentScenario.changes[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
                    placeholder={field.placeholder}
                    max={field.max}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={currentScenario.changes[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleAddScenario}
              disabled={!currentScenario.changes.amount && currentScenario.type !== 'hraOptimization'}
              className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Scenarios
            </button>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      {scenarios.length > 0 && (
        <div>
          <h3 className="text-heading-sm text-slate-900 font-medium mb-4">
            Scenarios to Compare ({scenarios.length})
          </h3>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const scenarioType = scenarioTypes.find(st => st.id === scenario.type);
              const Icon = scenarioType?.icon || Calculator;
              return (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gold-600 mr-3" />
                    <div>
                      <p className="text-body-sm font-medium text-slate-900">{scenario.name}</p>
                      <p className="text-body-xs text-slate-600">
                        Amount: ₹{parseFloat(scenario.changes.amount || scenario.changes.interestAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveScenario(scenario.id)}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoadModal(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Saved
          </button>
          {scenarios.length > 0 || (currentScenario.changes.amount && currentScenario.name) ? (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-info-500 text-white rounded-xl hover:bg-info-600 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Scenario
            </button>
          ) : null}
        </div>
        <button
          onClick={handleSimulate}
          disabled={scenarios.length === 0 && (!currentScenario.changes.amount && currentScenario.type !== 'hraOptimization')}
          className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {scenarios.length > 1 ? 'Compare Scenarios' : 'Simulate Scenario'}
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Save Scenario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Scenario Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="e.g., Max 80C Investment"
                />
              </div>
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={currentScenario.description}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  rows={3}
                  placeholder="Add a description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={!currentScenario.name || saveScenarioMutation.isPending}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:bg-gray-300"
              >
                {saveScenarioMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Load Saved Scenario</h3>
            {savedScenarios.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No saved scenarios found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleLoadScenario(scenario)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{scenario.name}</h4>
                          {scenario.isFavorite && (
                            <Star className="h-4 w-4 text-gold-500 fill-current" />
                          )}
                        </div>
                        {scenario.description && (
                          <p className="text-body-regular text-slate-600 mt-1">{scenario.description}</p>
                        )}
                        <p className="text-body-small text-slate-500 mt-1">
                          Type: {scenario.scenarioType} • Created: {new Date(scenario.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadScenario(scenario);
                        }}
                        className="ml-4 px-3 py-1 bg-gold-500 text-white rounded hover:bg-gold-600 text-body-regular"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioBuilder;

