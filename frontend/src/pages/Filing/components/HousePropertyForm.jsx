import React, { useState } from 'react';
import { Plus, Trash2, Home, Building2 } from 'lucide-react';
import {
    ITR_VALIDATION_RULES,
    validateAmount,
    calculateStandardDeduction,
    validateHousePropertyLoss,
} from '../../../utils/validationRules';

/**
 * House Property Form Component
 * For ITR-1 and ITR-2 filers with rental or self-occupied property
 */
const HousePropertyForm = ({ data, onChange, onSave }) => {
    const [properties, setProperties] = useState(data?.properties || [
        {
            id: Date.now(),
            type: 'selfOccupied', // selfOccupied, letOut, deemedLetOut
            address: '',
            coOwnershipShare: 100,
            annualRent: 0,
            municipalTaxes: 0,
            interestOnLoan: 0,
        },
    ]);

    const handlePropertyChange = (index, field, value) => {
        const updated = [...properties];
        updated[index][field] = value;
        setProperties(updated);

        // Calculate totals and notify parent
        const totals = calculateTotals(updated);
        onChange({ properties: updated, ...totals });
    };

    const addProperty = () => {
        setProperties([
            ...properties,
            {
                id: Date.now(),
                type: 'letOut',
                address: '',
                coOwnershipShare: 100,
                annualRent: 0,
                municipalTaxes: 0,
                interestOnLoan: 0,
            },
        ]);
    };

    const removeProperty = (index) => {
        const updated = properties.filter((_, i) => i !== index);
        setProperties(updated);

        const totals = calculateTotals(updated);
        onChange({ properties: updated, ...totals });
    };

    const calculatePropertyIncome = (property) => {
        if (property.type === 'selfOccupied') {
            // Self-occupied: Only interest deduction allowed (max ₹2L)
            const interestDeduction = Math.min(
                parseFloat(property.interestOnLoan) || 0,
                ITR_VALIDATION_RULES.SELF_OCCUPIED_INTEREST_LIMIT,
            );
            return -interestDeduction; // Negative income (loss)
        }

        // Let-out property
        const grossAnnualValue = parseFloat(property.annualRent) || 0;
        const municipalTaxes = parseFloat(property.municipalTaxes) || 0;
        const netAnnualValue = grossAnnualValue - municipalTaxes;

        // Standard deduction: 30% of NAV
        const standardDeduction = calculateStandardDeduction(netAnnualValue);

        // Interest on loan (no limit for let-out)
        const interestDeduction = parseFloat(property.interestOnLoan) || 0;

        // Net income
        const netIncome = netAnnualValue - standardDeduction - interestDeduction;

        // Apply co-ownership share
        const ownershipShare = (parseFloat(property.coOwnershipShare) || 100) / 100;

        return netIncome * ownershipShare;
    };

    const calculateTotals = (propertiesList) => {
        let totalIncome = 0;
        let totalLoss = 0;

        propertiesList.forEach(property => {
            const income = calculatePropertyIncome(property);
            if (income >= 0) {
                totalIncome += income;
            } else {
                totalLoss += income; // Negative value
            }
        });

        // Loss from house property limited to ₹2L
        const adjustedLoss = Math.max(totalLoss, -ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT);

        const netIncome = totalIncome + adjustedLoss;

        return {
            total: netIncome,
            totalIncome,
            totalLoss: adjustedLoss,
            properties: propertiesList.map(p => ({
                ...p,
                netIncome: calculatePropertyIncome(p),
            })),
        };
    };

    const totals = calculateTotals(properties);
    const selfOccupiedCount = properties.filter(p => p.type === 'selfOccupied').length;
    const canAddSelfOccupied = selfOccupiedCount < ITR_VALIDATION_RULES.MAX_SELF_OCCUPIED_PROPERTIES;

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Maximum {ITR_VALIDATION_RULES.MAX_SELF_OCCUPIED_PROPERTIES} self-occupied properties allowed.
                    Loss from house property limited to ₹{ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT.toLocaleString('en-IN')}.
                </p>
            </div>

            {/* Properties List */}
            {properties.map((property, index) => (
                <div key={property.id} className="bg-white rounded-lg border-2 border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {property.type === 'selfOccupied' ? (
                                <Home className="w-4 h-4 text-blue-600" />
                            ) : (
                                <Building2 className="w-4 h-4 text-emerald-600" />
                            )}
                            <h4 className="text-sm font-semibold text-slate-900">
                                Property {index + 1}
                            </h4>
                        </div>
                        {properties.length > 1 && (
                            <button
                                onClick={() => removeProperty(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Property Type */}
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Property Type
                            </label>
                            <select
                                value={property.type}
                                onChange={(e) => handlePropertyChange(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="selfOccupied">Self-Occupied</option>
                                <option value="letOut">Let-Out (Rented)</option>
                                <option value="deemedLetOut">Deemed Let-Out</option>
                            </select>
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Property Address
                            </label>
                            <input
                                type="text"
                                value={property.address}
                                onChange={(e) => handlePropertyChange(index, 'address', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter property address"
                            />
                        </div>

                        {/* Co-ownership Share */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Your Ownership Share (%)
                            </label>
                            <input
                                type="number"
                                value={property.coOwnershipShare}
                                onChange={(e) => handlePropertyChange(index, 'coOwnershipShare', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                min="0"
                                max="100"
                                placeholder="100"
                            />
                        </div>

                        {/* Annual Rent (only for let-out) */}
                        {property.type !== 'selfOccupied' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Annual Rent Received
                                </label>
                                <input
                                    type="number"
                                    value={property.annualRent}
                                    onChange={(e) => handlePropertyChange(index, 'annualRent', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0"
                                />
                            </div>
                        )}

                        {/* Municipal Taxes (only for let-out) */}
                        {property.type !== 'selfOccupied' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Municipal Taxes Paid
                                </label>
                                <input
                                    type="number"
                                    value={property.municipalTaxes}
                                    onChange={(e) => handlePropertyChange(index, 'municipalTaxes', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0"
                                />
                            </div>
                        )}

                        {/* Interest on Home Loan */}
                        <div className={property.type === 'selfOccupied' ? 'col-span-2' : ''}>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Interest on Home Loan
                                {property.type === 'selfOccupied' && (
                                    <span className="text-xs text-slate-500 ml-1">
                                        (Max ₹{ITR_VALIDATION_RULES.SELF_OCCUPIED_INTEREST_LIMIT.toLocaleString('en-IN')})
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                value={property.interestOnLoan}
                                onChange={(e) => handlePropertyChange(index, 'interestOnLoan', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>

                        {/* Property Income Summary */}
                        <div className="col-span-2 mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">Net Income from this property:</span>
                                <span className={`font-bold ${calculatePropertyIncome(property) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ₹{calculatePropertyIncome(property).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Property Button */}
            <button
                onClick={addProperty}
                disabled={!canAddSelfOccupied && properties.every(p => p.type === 'selfOccupied')}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 border-2 border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" />
                Add Another Property
            </button>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Summary</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Income from Let-out Properties</span>
                        <span className="font-bold text-slate-900">₹{totals.totalIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Loss (Self-occupied + Excess)</span>
                        <span className="font-bold text-red-600">₹{totals.totalLoss.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-300">
                        <span className="text-slate-700 font-medium">Net Income from House Property</span>
                        <span className={`text-lg font-bold ${totals.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{totals.total.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {totals.totalLoss < -ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-xs text-amber-800">
                            ⚠️ Loss adjusted to ₹{ITR_VALIDATION_RULES.HOUSE_PROPERTY_LOSS_LIMIT.toLocaleString('en-IN')} limit
                        </p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ properties, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default HousePropertyForm;
