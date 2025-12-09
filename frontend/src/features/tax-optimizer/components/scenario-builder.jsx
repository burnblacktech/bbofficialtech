// =====================================================
// SCENARIO BUILDER COMPONENT
// Component for building tax-saving simulation scenarios
// =====================================================

import React, { useState } from 'react';
import { Plus, X, TrendingUp, Building2, Heart, Home, Calculator } from 'lucide-react';
import Button from '../../../components/common/Button';

const ScenarioBuilder = ({ filingId, onSimulate, onCompare }) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState({
    type: 'section80C',
    name: '',
    changes: {},
  });

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
        <label className="block text-body-sm font-medium text-gray-700 mb-3">
          Select Scenario Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarioTypes.map((scenarioType) => {
            const Icon = scenarioType.icon;
            return (
              <button
                key={scenarioType.id}
                onClick={() => handleScenarioTypeChange(scenarioType.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  currentScenario.type === scenarioType.id
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <Icon className={`h-5 w-5 mr-3 mt-0.5 ${
                    currentScenario.type === scenarioType.id ? 'text-gold-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-body-sm font-medium text-gray-900 mb-1">
                      {scenarioType.label}
                    </h4>
                    <p className="text-body-xs text-gray-600">
                      {scenarioType.description}
                    </p>
                    {scenarioType.maxAmount && (
                      <p className="text-body-xs text-gray-500 mt-1">
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
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-heading-sm text-gray-900 font-medium mb-4">
            Configure {selectedScenarioType.label}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedScenarioType.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-body-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.max && (
                    <span className="text-body-xs text-gray-500 ml-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={currentScenario.changes[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
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
              className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
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
          <h3 className="text-heading-sm text-gray-900 font-medium mb-4">
            Scenarios to Compare ({scenarios.length})
          </h3>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const scenarioType = scenarioTypes.find(st => st.id === scenario.type);
              const Icon = scenarioType?.icon || Calculator;
              return (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gold-600 mr-3" />
                    <div>
                      <p className="text-body-sm font-medium text-gray-900">{scenario.name}</p>
                      <p className="text-body-xs text-gray-600">
                        Amount: ₹{parseFloat(scenario.changes.amount || scenario.changes.interestAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveScenario(scenario.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
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
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSimulate}
          disabled={scenarios.length === 0 && (!currentScenario.changes.amount && currentScenario.type !== 'hraOptimization')}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {scenarios.length > 1 ? 'Compare Scenarios' : 'Simulate Scenario'}
        </button>
      </div>
    </div>
  );
};

export default ScenarioBuilder;

