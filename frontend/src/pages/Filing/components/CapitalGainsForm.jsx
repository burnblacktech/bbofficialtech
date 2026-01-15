import React, { useState } from 'react';
import { Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import {
    ITR_VALIDATION_RULES,
    calculateHoldingPeriod,
    determineCapitalGainType,
    validateDate,
    validateAmount,
} from '../../../utils/validationRules';

/**
 * Capital Gains Form Component
 * For ITR-2 filers with capital gains from equity, mutual funds, property, etc.
 */
const CapitalGainsForm = ({ data, onChange, onSave }) => {
    const [transactions, setTransactions] = useState(data?.transactions || []);

    const assetTypes = [
        { id: 'equity', label: 'Equity Shares (Listed)', holdingPeriod: 12 },
        { id: 'mutualFundEquity', label: 'Equity Mutual Funds', holdingPeriod: 12 },
        { id: 'mutualFundDebt', label: 'Debt Mutual Funds', holdingPeriod: 36 },
        { id: 'property', label: 'Property (Land/Building)', holdingPeriod: 24 },
        { id: 'gold', label: 'Gold/Jewelry', holdingPeriod: 36 },
        { id: 'bonds', label: 'Bonds/Debentures', holdingPeriod: 36 },
        { id: 'other', label: 'Other Capital Assets', holdingPeriod: 36 },
    ];

    const addTransaction = () => {
        setTransactions([
            ...transactions,
            {
                id: Date.now(),
                assetType: 'equity',
                assetName: '',
                purchaseDate: '',
                saleDate: '',
                purchaseAmount: 0,
                saleAmount: 0,
                expenses: 0,
                indexedCost: 0,
                exemptionClaimed: 0,
                exemptionSection: '',
            },
        ]);
    };

    const removeTransaction = (index) => {
        const updated = transactions.filter((_, i) => i !== index);
        setTransactions(updated);

        const totals = calculateTotals(updated);
        onChange({ transactions: updated, ...totals });
    };

    const handleTransactionChange = (index, field, value) => {
        const updated = [...transactions];
        updated[index][field] = value;

        // Auto-calculate holding period and gain type
        if (field === 'purchaseDate' || field === 'saleDate' || field === 'assetType') {
            const transaction = updated[index];
            if (transaction.purchaseDate && transaction.saleDate) {
                const holdingPeriod = calculateHoldingPeriod(
                    transaction.purchaseDate,
                    transaction.saleDate,
                );
                const gainType = determineCapitalGainType(transaction.assetType, holdingPeriod);

                updated[index].holdingPeriod = holdingPeriod;
                updated[index].gainType = gainType;
            }
        }

        setTransactions(updated);

        const totals = calculateTotals(updated);
        onChange({ transactions: updated, ...totals });
    };

    const calculateTransactionGain = (transaction) => {
        const saleAmount = parseFloat(transaction.saleAmount) || 0;
        const purchaseAmount = parseFloat(transaction.purchaseAmount) || 0;
        const expenses = parseFloat(transaction.expenses) || 0;
        const exemptionClaimed = parseFloat(transaction.exemptionClaimed) || 0;

        // For LTCG on property/debt MF, use indexed cost
        let costBase = purchaseAmount;
        if (transaction.gainType === 'LTCG' &&
            (transaction.assetType === 'property' || transaction.assetType === 'mutualFundDebt')) {
            costBase = parseFloat(transaction.indexedCost) || purchaseAmount;
        }

        const grossGain = saleAmount - costBase - expenses;
        const netGain = Math.max(0, grossGain - exemptionClaimed);

        return {
            grossGain,
            netGain,
            taxableGain: netGain,
        };
    };

    const calculateTotals = (transactionsList) => {
        let stcgTotal = 0;
        let ltcgEquityTotal = 0;
        let ltcgOtherTotal = 0;

        transactionsList.forEach(transaction => {
            const { netGain } = calculateTransactionGain(transaction);

            if (transaction.gainType === 'STCG') {
                stcgTotal += netGain;
            } else if (transaction.gainType === 'LTCG') {
                if (transaction.assetType === 'equity' || transaction.assetType === 'mutualFundEquity') {
                    ltcgEquityTotal += netGain;
                } else {
                    ltcgOtherTotal += netGain;
                }
            }
        });

        // LTCG on equity: Exempt up to ₹1L, then 10%
        const ltcgEquityExempt = Math.min(ltcgEquityTotal, ITR_VALIDATION_RULES.LTCG_EQUITY_EXEMPTION);
        const ltcgEquityTaxable = Math.max(0, ltcgEquityTotal - ITR_VALIDATION_RULES.LTCG_EQUITY_EXEMPTION);

        const totalGain = stcgTotal + ltcgEquityTaxable + ltcgOtherTotal;

        return {
            total: totalGain,
            stcg: stcgTotal,
            ltcgEquity: ltcgEquityTotal,
            ltcgEquityExempt,
            ltcgEquityTaxable,
            ltcgOther: ltcgOtherTotal,
        };
    };

    const totals = calculateTotals(transactions);

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Capital Gains Tax Rates:</strong> STCG on equity @ 15%, LTCG on equity @ 10% (above ₹1L),
                    LTCG on property/debt @ 20% with indexation
                </p>
            </div>

            {/* Transactions List */}
            {transactions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No capital gains transactions added yet</p>
                    <button
                        onClick={addTransaction}
                        className="mt-3 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                    >
                        Add Transaction
                    </button>
                </div>
            ) : (
                <>
                    {transactions.map((transaction, index) => {
                        const gain = calculateTransactionGain(transaction);
                        const assetTypeInfo = assetTypes.find(a => a.id === transaction.assetType);

                        return (
                            <div key={transaction.id} className="bg-white rounded-lg border-2 border-slate-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-purple-600" />
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Transaction {index + 1}
                                            {transaction.gainType && (
                                                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded ${transaction.gainType === 'STCG'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {transaction.gainType}
                                                </span>
                                            )}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => removeTransaction(index)}
                                        className="text-red-600 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Asset Type */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Asset Type
                                        </label>
                                        <select
                                            value={transaction.assetType}
                                            onChange={(e) => handleTransactionChange(index, 'assetType', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            {assetTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Asset Name */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Asset Name/Description
                                        </label>
                                        <input
                                            type="text"
                                            value={transaction.assetName}
                                            onChange={(e) => handleTransactionChange(index, 'assetName', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., Reliance Industries, Flat in Mumbai"
                                        />
                                    </div>

                                    {/* Purchase Date */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Purchase Date
                                        </label>
                                        <input
                                            type="date"
                                            value={transaction.purchaseDate}
                                            onChange={(e) => handleTransactionChange(index, 'purchaseDate', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Sale Date */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Sale Date
                                        </label>
                                        <input
                                            type="date"
                                            value={transaction.saleDate}
                                            onChange={(e) => handleTransactionChange(index, 'saleDate', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Holding Period Display */}
                                    {transaction.holdingPeriod !== undefined && (
                                        <div className="col-span-2 p-2 bg-slate-50 rounded border border-slate-200">
                                            <p className="text-xs text-slate-600">
                                                Holding Period: <span className="font-semibold">{transaction.holdingPeriod} months</span>
                                                {assetTypeInfo && (
                                                    <span className="ml-2 text-slate-500">
                                                        (Threshold: {assetTypeInfo.holdingPeriod} months for LTCG)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* Purchase Amount */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Purchase Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={transaction.purchaseAmount}
                                            onChange={(e) => handleTransactionChange(index, 'purchaseAmount', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Sale Amount */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Sale Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={transaction.saleAmount}
                                            onChange={(e) => handleTransactionChange(index, 'saleAmount', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Expenses */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Expenses (Brokerage, etc.)
                                        </label>
                                        <input
                                            type="number"
                                            value={transaction.expenses}
                                            onChange={(e) => handleTransactionChange(index, 'expenses', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Indexed Cost (for LTCG on property/debt) */}
                                    {transaction.gainType === 'LTCG' &&
                                        (transaction.assetType === 'property' || transaction.assetType === 'mutualFundDebt') && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    Indexed Cost of Acquisition
                                                </label>
                                                <input
                                                    type="number"
                                                    value={transaction.indexedCost}
                                                    onChange={(e) => handleTransactionChange(index, 'indexedCost', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}

                                    {/* Exemption Claimed */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Exemption Claimed (54, 54EC, 54F, etc.)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                value={transaction.exemptionClaimed}
                                                onChange={(e) => handleTransactionChange(index, 'exemptionClaimed', e.target.value)}
                                                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="Amount"
                                            />
                                            <input
                                                type="text"
                                                value={transaction.exemptionSection}
                                                onChange={(e) => handleTransactionChange(index, 'exemptionSection', e.target.value)}
                                                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="Section (e.g., 54)"
                                            />
                                        </div>
                                    </div>

                                    {/* Transaction Summary */}
                                    <div className="col-span-2 mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Gross Gain:</span>
                                                <span className="font-semibold">₹{gain.grossGain.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Taxable Gain:</span>
                                                <span className="font-bold text-emerald-600">₹{gain.taxableGain.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Transaction Button */}
                    <button
                        onClick={addTransaction}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 border-2 border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another Transaction
                    </button>
                </>
            )}

            {/* Summary */}
            {transactions.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 text-white">
                    <h4 className="text-sm font-semibold mb-3">Capital Gains Summary</h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span>Short-Term Capital Gains (STCG)</span>
                            <span className="font-bold">₹{totals.stcg.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Long-Term Capital Gains - Equity (Total)</span>
                            <span className="font-bold">₹{totals.ltcgEquity.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pl-4">
                            <span className="text-emerald-300">└ Exempt (up to ₹1L)</span>
                            <span>₹{totals.ltcgEquityExempt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pl-4">
                            <span>└ Taxable @ 10%</span>
                            <span className="font-bold">₹{totals.ltcgEquityTaxable.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Long-Term Capital Gains - Other @ 20%</span>
                            <span className="font-bold">₹{totals.ltcgOther.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-600">
                            <span className="font-semibold">Total Taxable Capital Gains</span>
                            <span className="text-lg font-bold text-emerald-400">₹{totals.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={() => onSave({ transactions, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default CapitalGainsForm;
