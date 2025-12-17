// =====================================================
// SIMULATION RESULTS COMPONENT
// Display simulation results with before/after comparison
// =====================================================

import React from 'react';
import { TrendingDown, TrendingUp, CheckCircle, ArrowRight, Download, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const SimulationResults = ({ simulationResult, selectedScenario, scenariosToCompare, onApply, currentTaxComputation }) => {
  const { baseTax, simulatedTax, savings, breakdown } = simulationResult;
  const isComparison = scenariosToCompare && scenariosToCompare.length > 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  if (isComparison && simulationResult.scenarios) {
    // Comparison view
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl p-6 border border-gold-200">
          <h3 className="text-heading-md text-slate-900 mb-2">Scenario Comparison</h3>
          <p className="text-body-sm text-slate-600">
            Compare {simulationResult.scenarios.length} scenarios to find the best option
          </p>
        </div>

        {/* Best Scenario Highlight */}
        {simulationResult.bestScenario && (
          <div className="bg-success-50 border-2 border-success-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                  <h4 className="text-heading-sm font-semibold text-success-900">
                    Best Scenario: {simulationResult.bestScenario.scenario.name}
                  </h4>
                </div>
                <p className="text-body-sm text-success-700">
                  Potential Savings: {formatCurrency(simulationResult.bestScenario.savings.totalSavings)}
                  ({formatPercentage(simulationResult.bestScenario.savings.savingsPercentage)})
                </p>
              </div>
              <button
                onClick={() => onApply(
                  simulationResult.bestScenario.scenario.id,
                  simulationResult.bestScenario.scenario.changes,
                )}
                className="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700"
              >
                Apply This Scenario
              </button>
            </div>
          </div>
        )}

        {/* Comparison Chart */}
        {simulationResult.scenarios && simulationResult.scenarios.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Visual Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                {
                  name: 'Current',
                  tax: parseFloat(simulationResult.baseTax?.totalTaxLiability || simulationResult.baseTax?.finalTax || 0),
                  savings: 0,
                },
                ...simulationResult.scenarios.map((sr, idx) => ({
                  name: sr.scenario.name || `Scenario ${idx + 1}`,
                  tax: parseFloat(sr.taxComputation?.totalTaxLiability || sr.taxComputation?.finalTax || 0),
                  savings: sr.savings.totalSavings,
                })),
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="tax" fill="#8884d8" name="Tax Liability" />
                <Bar dataKey="savings" fill="#82ca9d" name="Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-body-sm font-medium text-slate-700">Scenario</th>
                <th className="px-4 py-3 text-right text-body-sm font-medium text-slate-700">Tax Liability</th>
                <th className="px-4 py-3 text-right text-body-sm font-medium text-slate-700">Savings</th>
                <th className="px-4 py-3 text-right text-body-sm font-medium text-slate-700">Savings %</th>
                <th className="px-4 py-3 text-center text-body-sm font-medium text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-slate-50">
                <td className="px-4 py-3 text-body-sm font-medium text-slate-900">Current (Base)</td>
                <td className="px-4 py-3 text-right text-body-sm text-slate-900">
                  {formatCurrency(simulationResult.baseTax?.totalTaxLiability || simulationResult.baseTax?.finalTax || 0)}
                </td>
                <td className="px-4 py-3 text-right text-body-sm text-slate-500">-</td>
                <td className="px-4 py-3 text-right text-body-sm text-slate-500">-</td>
                <td className="px-4 py-3 text-center">-</td>
              </tr>
              {simulationResult.scenarios.map((scenarioResult, index) => (
                <tr key={scenarioResult.scenario.id} className={index === 0 ? 'bg-success-50' : ''}>
                  <td className="px-4 py-3 text-body-sm font-medium text-slate-900">
                    {scenarioResult.scenario.name}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-slate-900">
                    {formatCurrency(scenarioResult.taxComputation?.totalTaxLiability || scenarioResult.taxComputation?.finalTax || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-semibold text-success-600">
                    {formatCurrency(scenarioResult.savings.totalSavings)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-success-600">
                    {formatPercentage(scenarioResult.savings.savingsPercentage)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onApply(
                        scenarioResult.scenario.id,
                        scenarioResult.scenario.changes,
                      )}
                      className="px-3 py-1 bg-gold-500 text-white rounded-xl hover:bg-gold-600 text-body-regular"
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Single scenario view
  return (
    <div className="space-y-6">
      {/* Savings Highlight */}
      <div className={`bg-gradient-to-r rounded-xl p-6 border-2 ${
        savings.totalSavings > 0
          ? 'from-success-50 to-success-100 border-success-200'
          : 'from-gray-50 to-gray-100 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              {savings.totalSavings > 0 ? (
                <TrendingDown className="h-6 w-6 text-success-600 mr-2" />
              ) : (
                <TrendingUp className="h-6 w-6 text-slate-400 mr-2" />
              )}
              <h3 className="text-heading-lg font-semibold text-slate-900">
                {savings.totalSavings > 0 ? 'Potential Savings' : 'No Savings'}
              </h3>
            </div>
            {savings.totalSavings > 0 ? (
              <p className="text-heading-xl font-bold text-success-700">
                {formatCurrency(savings.totalSavings)}
              </p>
            ) : (
              <p className="text-body-md text-slate-600">
                This scenario does not result in tax savings
              </p>
            )}
            {savings.savingsPercentage > 0 && (
              <p className="text-body-sm text-success-600 mt-1">
                {formatPercentage(savings.savingsPercentage)} reduction in tax liability
              </p>
            )}
          </div>
          {savings.totalSavings > 0 && selectedScenario && (
            <button
              onClick={() => onApply(selectedScenario.id || selectedScenario.type, selectedScenario.changes)}
              className="px-6 py-3 bg-success-600 text-white rounded-xl hover:bg-success-700 flex items-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Apply to ITR
            </button>
          )}
        </div>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Tax */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Current Tax</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">Gross Total Income</span>
              <span className="text-body-sm font-medium text-slate-900">
                {formatCurrency(baseTax?.grossTotalIncome || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">Total Deductions</span>
              <span className="text-body-sm font-medium text-slate-900">
                {formatCurrency(baseTax?.totalDeductions || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-slate-600">Taxable Income</span>
              <span className="text-body-sm font-medium text-slate-900">
                {formatCurrency(baseTax?.taxableIncome || 0)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-body-md font-semibold text-slate-900">Total Tax Liability</span>
                <span className="text-heading-md font-bold text-slate-900">
                  {formatCurrency(baseTax?.totalTaxLiability || baseTax?.finalTax || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulated Tax */}
        <div className="bg-success-50 border-2 border-success-200 rounded-xl p-6">
          <h4 className="text-heading-sm font-medium text-success-900 mb-4">Simulated Tax</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-sm text-success-700">Gross Total Income</span>
              <span className="text-body-sm font-medium text-success-900">
                {formatCurrency(simulatedTax?.grossTotalIncome || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-success-700">Total Deductions</span>
              <span className="text-body-sm font-medium text-success-900">
                {formatCurrency(simulatedTax?.totalDeductions || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-success-700">Taxable Income</span>
              <span className="text-body-sm font-medium text-success-900">
                {formatCurrency(simulatedTax?.taxableIncome || 0)}
              </span>
            </div>
            <div className="border-t border-success-300 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-body-md font-semibold text-success-900">Total Tax Liability</span>
                <span className="text-heading-md font-bold text-success-900">
                  {formatCurrency(simulatedTax?.totalTaxLiability || simulatedTax?.finalTax || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Breakdown */}
      {savings.totalSavings > 0 && savings.breakdown && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Savings Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-body-xs text-slate-600 mb-1">Income Tax</p>
              <p className="text-heading-md font-semibold text-slate-900">
                {formatCurrency(savings.breakdown.incomeTax || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-body-xs text-slate-600 mb-1">Cess</p>
              <p className="text-heading-md font-semibold text-slate-900">
                {formatCurrency(savings.breakdown.cess || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-body-xs text-slate-600 mb-1">Surcharge</p>
              <p className="text-heading-md font-semibold text-slate-900">
                {formatCurrency(savings.breakdown.surcharge || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Details */}
      {selectedScenario && breakdown && (
        <div className="bg-info-50 border border-info-200 rounded-xl p-6">
          <h4 className="text-heading-sm font-medium text-info-900 mb-3">Scenario Details</h4>
          <div className="space-y-2 text-body-sm text-info-800">
            <p><span className="font-medium">Type:</span> {breakdown.scenarioType}</p>
            {breakdown.changes && Object.keys(breakdown.changes).map((key) => (
              <p key={key}>
                <span className="font-medium">{key}:</span> {breakdown.changes[key]}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      {simulationResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Export Results</h4>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const data = {
                  baseTax: simulationResult.baseTax,
                  simulatedTax: simulationResult.simulatedTax || simulationResult.scenarios,
                  savings: simulationResult.savings || simulationResult.bestScenario?.savings,
                  timestamp: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tax-simulation-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </button>
            <button
              onClick={() => {
                const rows = [
                  ['Metric', 'Current', 'Simulated'],
                  ['Tax Liability', formatCurrency(simulationResult.baseTax?.totalTaxLiability || 0), formatCurrency(simulationResult.simulatedTax?.totalTaxLiability || 0)],
                  ['Savings', '-', formatCurrency(simulationResult.savings?.totalSavings || 0)],
                ];
                const csv = rows.map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tax-simulation-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationResults;

