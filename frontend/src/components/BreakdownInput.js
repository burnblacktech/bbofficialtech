import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Upload, CheckCircle,
  AlertTriangle, Calculator, Briefcase,
} from 'lucide-react';
import enterpriseDebugger from '../services/EnterpriseDebugger';

// BreakdownInput Component - Reusable for granular income/deduction capture
// Purpose: Capture multiple instruments → store breakdown → compute eligibility → show both breakdown and final value

const BreakdownInput = ({
  title,
  description,
  items = [],
  onItemsChange,
  rules = {},
  icon: Icon = Calculator,
  placeholder = 'Enter amount',
  inputType = 'number',
  showProofUpload = false,
  showBreakdown = true,
  maxItems = 10,
  className = '',
}) => {
  const [localItems, setLocalItems] = useState(items);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Calculate totals and eligibility
  const calculateTotals = useCallback(() => {
    const eligibleItems = localItems.filter(item =>
      item.amount > 0 && (!rules.minAmount || item.amount >= rules.minAmount),
    );

    const totalEligible = eligibleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const finalValue = rules.cap ? Math.min(totalEligible, rules.cap) : totalEligible;
    const isCapReached = rules.cap && totalEligible >= rules.cap;

    return {
      totalEligible,
      finalValue,
      isCapReached,
      eligibleItems: eligibleItems.length,
      totalItems: localItems.length,
    };
  }, [localItems, rules]);

  const totals = calculateTotals();

  // Add new item
  const handleAddItem = () => {
    if (localItems.length >= maxItems) {
      enterpriseDebugger.log('WARN', 'BreakdownInput', 'Maximum items reached', { maxItems });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      source: '',
      proofUploaded: false,
      proofFileId: null,
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);
    setIsAddingItem(true);

    enterpriseDebugger.log('INFO', 'BreakdownInput', 'Item added', {
      title,
      totalItems: updatedItems.length,
    });
  };

  // Update item
  const handleUpdateItem = (itemId, field, value) => {
    const updatedItems = localItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item,
    );
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);

    enterpriseDebugger.log('INFO', 'BreakdownInput', 'Item updated', {
      title,
      itemId,
      field,
      value,
    });
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    const updatedItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);

    enterpriseDebugger.log('INFO', 'BreakdownInput', 'Item removed', {
      title,
      itemId,
      remainingItems: updatedItems.length,
    });
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle proof upload
  const handleProofUpload = (itemId, file) => {
    // TODO: Implement file upload logic
    enterpriseDebugger.log('INFO', 'BreakdownInput', 'Proof upload initiated', {
      title,
      itemId,
      fileName: file.name,
    });

    // Simulate upload success
    handleUpdateItem(itemId, 'proofUploaded', true);
    handleUpdateItem(itemId, 'proofFileId', `proof_${itemId}_${Date.now()}`);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gold-50 rounded-xl">
            <Icon className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <h3 className="text-heading-4 font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-body-regular text-slate-600">{description}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleAddItem}
          disabled={localItems.length >= maxItems}
          className="bg-gold-500 text-white px-4 py-2 rounded-xl hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Rules & Cap Information */}
      {rules.cap && (
        <div className={`p-3 rounded-xl mb-4 ${
          totals.isCapReached
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center space-x-2">
            {totals.isCapReached ? (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${
              totals.isCapReached ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {totals.isCapReached
                ? `Cap reached (₹${rules.cap.toLocaleString()})`
                : `₹${totals.totalEligible.toLocaleString()} / ₹${rules.cap.toLocaleString()}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {localItems.map((item, index) => (
          <div key={item.id} className="border border-slate-200 rounded-xl p-4">
            {/* Item Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-body-regular font-medium text-slate-500">#{index + 1}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description (e.g., SBI FD Interest)"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleItemExpansion(item.id)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-red-400 hover:text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Amount Input */}
              <div>
                <label className="block text-body-small font-medium text-slate-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type={inputType}
                  placeholder={placeholder}
                  value={item.amount || ''}
                  onChange={(e) => handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
                />
              </div>

              {/* Source Input */}
              <div>
                <label className="block text-body-small font-medium text-slate-700 mb-1">
                  Source
                </label>
                <input
                  type="text"
                  placeholder="e.g., SBI Bank"
                  value={item.source}
                  onChange={(e) => handleUpdateItem(item.id, 'source', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
                />
              </div>

              {/* Proof Upload */}
              {showProofUpload && (
                <div>
                  <label className="block text-body-small font-medium text-slate-700 mb-1">
                    Proof
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => e.target.files[0] && handleProofUpload(item.id, e.target.files[0])}
                      className="hidden"
                      id={`proof-${item.id}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor={`proof-${item.id}`}
                      className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer text-body-regular"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{item.proofUploaded ? 'Reupload' : 'Upload'}</span>
                    </label>
                    {item.proofUploaded && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {expandedItems.has(item.id) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-small font-medium text-slate-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      placeholder="Any additional details..."
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-body-small font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={item.date || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {localItems.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No items added yet</p>
            <p className="text-body-regular">Click "Add Item" to get started</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {showBreakdown && localItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-body-regular">
                <span className="text-slate-600">Total Items:</span>
                <span className="ml-1 font-medium">{totals.totalItems}</span>
              </div>
              <div className="text-body-regular">
                <span className="text-slate-600">Eligible:</span>
                <span className="ml-1 font-medium">{totals.eligibleItems}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-body-large font-semibold text-slate-900">
                ₹{totals.finalValue.toLocaleString()}
              </div>
              {rules.cap && totals.totalEligible > rules.cap && (
                <div className="text-body-small text-yellow-600">
                  Capped at ₹{rules.cap.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakdownInput;
