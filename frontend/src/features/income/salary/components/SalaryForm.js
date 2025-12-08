// =====================================================
// SALARY FORM COMPONENT
// For all ITR forms - Salary income input
// Enhanced with detailed breakdown, Form16 upload, and AIS integration
// =====================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Building2, Calculator, Info, AlertCircle, Upload, Sparkles, Plus, Trash2 } from 'lucide-react';
import Form16Upload from '../../../../components/ITR/core/Form16Upload';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';

// Standard deduction limit for FY 2024-25
const STANDARD_DEDUCTION_LIMIT = 50000;

const SalaryForm = ({ data, onUpdate, selectedITR, onForm16Extracted, autoFilledFields = {}, sources = {} }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [employers, setEmployers] = useState(data?.employers || []);
  const [showAddEmployer, setShowAddEmployer] = useState(false);

  // Initialize breakdown from data or defaults
  const [breakdown, setBreakdown] = useState({
    basic: data?.salaryBreakdown?.basic || 0,
    hra: data?.salaryBreakdown?.hra || 0,
    specialAllowance: data?.salaryBreakdown?.specialAllowance || 0,
    lta: data?.salaryBreakdown?.lta || 0,
    bonus: data?.salaryBreakdown?.bonus || 0,
    commission: data?.salaryBreakdown?.commission || 0,
    perquisites: data?.salaryBreakdown?.perquisites || 0,
    profitsInLieu: data?.salaryBreakdown?.profitsInLieu || 0,
    otherAllowances: data?.salaryBreakdown?.otherAllowances || 0,
  });

  // Calculate gross salary from breakdown
  const grossSalary = useMemo(() => {
    return Object.values(breakdown).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [breakdown]);

  // Calculate standard deduction
  const standardDeduction = useMemo(() => {
    const gross = data?.salary || grossSalary;
    return Math.min(gross, STANDARD_DEDUCTION_LIMIT);
  }, [data?.salary, grossSalary]);

  // Calculate net taxable salary
  const netTaxableSalary = useMemo(() => {
    const gross = data?.salary || grossSalary;
    return Math.max(0, gross - standardDeduction);
  }, [data?.salary, grossSalary, standardDeduction]);

  // Handle single salary field change
  const handleSalaryChange = useCallback((value) => {
    const numValue = parseFloat(value) || 0;
    onUpdate({ salary: numValue });
  }, [onUpdate]);

  // Handle breakdown field change
  const handleBreakdownChange = useCallback((field, value) => {
    const numValue = parseFloat(value) || 0;
    const newBreakdown = { ...breakdown, [field]: numValue };
    setBreakdown(newBreakdown);

    // Calculate total and update
    const total = Object.values(newBreakdown).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    onUpdate({
      salary: total,
      salaryBreakdown: newBreakdown,
    });
  }, [breakdown, onUpdate]);

  // Handle Form16 auto-populate
  const handleForm16AutoPopulate = useCallback((form16Data) => {
    if (form16Data.salary) {
      handleSalaryChange(form16Data.salary);
    }

    // If detailed breakdown is available
    if (form16Data.salaryBreakdown) {
      setBreakdown(form16Data.salaryBreakdown);
      onUpdate({
        salary: form16Data.salary,
        salaryBreakdown: form16Data.salaryBreakdown,
      });
    }

    // If employer details available
    if (form16Data.employer) {
      const newEmployer = {
        id: Date.now(),
        name: form16Data.employer.name || '',
        tan: form16Data.employer.tan || '',
        salary: form16Data.salary || 0,
        tds: form16Data.tds || 0,
        source: 'form16',
      };
      setEmployers(prev => [...prev, newEmployer]);
      onUpdate({ employers: [...employers, newEmployer] });
    }

    if (onForm16Extracted) {
      onForm16Extracted(form16Data);
    }
  }, [handleSalaryChange, onUpdate, employers, onForm16Extracted]);

  // Add new employer
  const handleAddEmployer = useCallback(() => {
    const newEmployer = {
      id: Date.now(),
      name: '',
      tan: '',
      salary: 0,
      tds: 0,
      source: 'manual',
    };
    const updatedEmployers = [...employers, newEmployer];
    setEmployers(updatedEmployers);
    onUpdate({ employers: updatedEmployers });
    setShowAddEmployer(false);
  }, [employers, onUpdate]);

  // Update employer
  const handleEmployerChange = useCallback((id, field, value) => {
    const updatedEmployers = employers.map(emp =>
      emp.id === id ? { ...emp, [field]: field === 'salary' || field === 'tds' ? parseFloat(value) || 0 : value } : emp,
    );
    setEmployers(updatedEmployers);

    // Calculate total salary from all employers
    const totalSalary = updatedEmployers.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    onUpdate({
      employers: updatedEmployers,
      salary: totalSalary,
    });
  }, [employers, onUpdate]);

  // Remove employer
  const handleRemoveEmployer = useCallback((id) => {
    const updatedEmployers = employers.filter(emp => emp.id !== id);
    setEmployers(updatedEmployers);

    const totalSalary = updatedEmployers.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    onUpdate({
      employers: updatedEmployers,
      salary: totalSalary,
    });
  }, [employers, onUpdate]);

  // Check if field is auto-filled
  const isAutoFilled = useCallback((field) => {
    return autoFilledFields?.income?.includes(field) || autoFilledFields?.income?.includes('salary');
  }, [autoFilledFields]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Salary breakdown fields
  const breakdownFields = [
    { key: 'basic', label: 'Basic Salary', helpText: 'Basic pay component' },
    { key: 'hra', label: 'House Rent Allowance (HRA)', helpText: 'Allowance for rent' },
    { key: 'specialAllowance', label: 'Special Allowance', helpText: 'Special/flexible allowance' },
    { key: 'lta', label: 'Leave Travel Allowance (LTA)', helpText: 'Travel allowance' },
    { key: 'bonus', label: 'Bonus', helpText: 'Annual/performance bonus' },
    { key: 'commission', label: 'Commission', helpText: 'Sales commission' },
    { key: 'perquisites', label: 'Perquisites', helpText: 'Value of perks (car, housing, etc.)' },
    { key: 'profitsInLieu', label: 'Profits in Lieu of Salary', helpText: 'Any other profits' },
    { key: 'otherAllowances', label: 'Other Allowances', helpText: 'Any other allowances' },
  ];

  return (
    <div className="space-y-6">
      {/* Form 16 Upload Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-start space-x-3">
          <Upload className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">Upload Form 16</h4>
            <p className="text-xs text-gray-600 mt-1">
              Upload your Form 16 to auto-fill salary details. We'll extract employer info, salary breakdown, and TDS.
            </p>
            <div className="mt-3">
              <Form16Upload
                onExtractionComplete={(result) => {
                  // Silent extraction
                }}
                onAutoPopulate={handleForm16AutoPopulate}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Entry or Detailed Breakdown Toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-orange-500" />
          Salary Income
        </h4>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          {showBreakdown ? 'Simple Entry' : 'Detailed Breakdown'}
          {showBreakdown ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
      </div>

      {/* Simple Entry Mode */}
      {!showBreakdown && (
        <div className="space-y-4">
          <div className="relative">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              Gross Salary Income
              {isAutoFilled('salary') && <SourceChip source="form16" size="sm" className="ml-2" />}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={data?.salary || 0}
                onChange={(e) => handleSalaryChange(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold ${
                  isAutoFilled('salary') ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total salary received from all employers during the financial year
            </p>
          </div>
        </div>
      )}

      {/* Detailed Breakdown Mode */}
      {showBreakdown && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {breakdownFields.map(({ key, label, helpText }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={breakdown[key] || 0}
                      onChange={(e) => handleBreakdownChange(key, e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{helpText}</p>
                </div>
              ))}
            </div>

            {/* Breakdown Total */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Gross Salary Total</span>
                <span className="text-lg font-bold text-orange-600">{formatCurrency(grossSalary)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Employers Section */}
      {employers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-orange-500" />
              Employer Details
            </h4>
            <button
              type="button"
              onClick={handleAddEmployer}
              className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Employer
            </button>
          </div>

          <div className="space-y-3">
            {employers.map((employer, index) => (
              <div key={employer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Employer {index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {employer.source && <SourceChip source={employer.source} size="sm" />}
                    {employers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployer(employer.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Employer Name</label>
                    <input
                      type="text"
                      value={employer.name}
                      onChange={(e) => handleEmployerChange(employer.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TAN</label>
                    <input
                      type="text"
                      value={employer.tan}
                      onChange={(e) => handleEmployerChange(employer.id, 'tan', e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                      placeholder="ABCD12345E"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Salary (₹)</label>
                    <input
                      type="number"
                      value={employer.salary}
                      onChange={(e) => handleEmployerChange(employer.id, 'salary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TDS Deducted (₹)</label>
                    <input
                      type="number"
                      value={employer.tds}
                      onChange={(e) => handleEmployerChange(employer.id, 'tds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Employer Button (when no employers) */}
      {employers.length === 0 && (
        <button
          type="button"
          onClick={handleAddEmployer}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employer Details
        </button>
      )}

      {/* Computation Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center mb-3">
          <Calculator className="w-5 h-5 text-green-600 mr-2" />
          <h4 className="text-sm font-semibold text-gray-900">Salary Income Computation</h4>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Gross Salary</span>
            <span className="font-medium text-gray-900">{formatCurrency(data?.salary || grossSalary)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 flex items-center">
              Less: Standard Deduction (u/s 16)
              <Info className="w-3.5 h-3.5 ml-1 text-gray-400" />
            </span>
            <span className="font-medium text-red-600">- {formatCurrency(standardDeduction)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Net Taxable Salary</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(netTaxableSalary)}</span>
            </div>
          </div>
        </div>

        {/* Info about standard deduction */}
        <div className="mt-3 p-2 bg-green-100 rounded-lg">
          <p className="text-xs text-green-800">
            <Info className="w-3 h-3 inline mr-1" />
            Standard deduction of ₹{STANDARD_DEDUCTION_LIMIT.toLocaleString('en-IN')} is automatically applied under Section 16(ia).
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryForm;

