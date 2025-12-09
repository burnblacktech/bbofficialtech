// =====================================================
// TAX OPTIMIZER COMPONENT
// Main component for tax optimization (What-if Analysis)
// =====================================================

import React, { useState } from 'react';
import { TrendingUp, Lightbulb, Calculator, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOptimizationOpportunities, useSimulateScenario, useCompareScenarios, useApplySimulation } from '../hooks/use-tax-optimizer';
import ScenarioBuilder from './scenario-builder';
import SimulationResults from './simulation-results';
import AISuggestions from './ai-suggestions';

const TaxOptimizer = ({ filingId, currentTaxComputation, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('opportunities');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [scenariosToCompare, setScenariosToCompare] = useState([]);

  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useOptimizationOpportunities(filingId);
  const simulateScenario = useSimulateScenario();
  const compareScenarios = useCompareScenarios();
  const applySimulation = useApplySimulation();

  const opportunities = opportunitiesData?.opportunities || [];
  const summary = opportunitiesData?.summary;

  const handleSimulate = async (scenario) => {
    setSelectedScenario(scenario);
    const result = await simulateScenario.mutateAsync({
      filingId,
      scenario,
    });

    if (result.success) {
      setSimulationResult(result);
      setActiveTab('results');
    }
  };

  const handleCompare = async (scenarios) => {
    setScenariosToCompare(scenarios);
    const result = await compareScenarios.mutateAsync({
      filingId,
      scenarios,
    });

    if (result.success) {
      setSimulationResult(result);
      setActiveTab('results');
    }
  };

  const handleApply = async (scenarioId, changes) => {
    const result = await applySimulation.mutateAsync({
      filingId,
      scenarioId,
      changes,
    });

    if (result.success && onUpdate) {
      onUpdate();
      toast.success('Changes applied to your ITR!');
    }
  };

  const tabs = [
    { id: 'opportunities', label: 'Opportunities', icon: Lightbulb },
    { id: 'simulate', label: 'Simulate', icon: Calculator },
    { id: 'results', label: 'Results', icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-lg text-gray-900">Tax Optimizer</h2>
            <p className="text-body-sm text-gray-600 mt-1">
              Simulate tax-saving scenarios and optimize your tax liability
            </p>
          </div>
          {currentTaxComputation && (
            <div className="text-right">
              <p className="text-body-xs text-gray-500">Current Tax Liability</p>
              <p className="text-heading-md font-semibold text-gray-900">
                ₹{parseFloat(currentTaxComputation.totalTaxLiability || 0).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-body-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            {isLoadingOpportunities ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
                <h3 className="text-heading-md text-gray-900 mb-2">No Optimization Opportunities</h3>
                <p className="text-body-sm text-gray-600">
                  Your tax planning looks optimal! You can still simulate scenarios manually.
                </p>
              </div>
            ) : (
              <>
                <AISuggestions
                  opportunities={opportunities}
                  onSimulate={handleSimulate}
                  summary={summary}
                />
                <div className="mt-6">
                  <h3 className="text-heading-sm text-gray-900 font-medium mb-4">
                    Or create a custom scenario
                  </h3>
                  <ScenarioBuilder
                    filingId={filingId}
                    onSimulate={handleSimulate}
                    onCompare={handleCompare}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'simulate' && (
          <ScenarioBuilder
            filingId={filingId}
            onSimulate={handleSimulate}
            onCompare={handleCompare}
          />
        )}

        {activeTab === 'results' && simulationResult && (
          <SimulationResults
            simulationResult={simulationResult}
            selectedScenario={selectedScenario}
            scenariosToCompare={scenariosToCompare}
            onApply={handleApply}
            currentTaxComputation={currentTaxComputation}
          />
        )}

        {activeTab === 'results' && !simulationResult && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-heading-md text-gray-900 mb-2">No Simulation Results</h3>
            <p className="text-body-sm text-gray-600 mb-4">
              Run a simulation to see results here.
            </p>
            <button
              onClick={() => setActiveTab('simulate')}
              className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Create Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxOptimizer;

