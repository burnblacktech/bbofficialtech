// =====================================================
// ADD SOURCE PATTERN - DYNAMIC INCOME/DEDUCTION FORMS
// "Add Source" pattern for manageable form experience
// =====================================================

import React, { useState } from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const AddSourcePattern = ({
  title,
  subtitle,
  sources = [],
  onAddSource,
  onEditSource,
  onDeleteSource,
  sourceTypes = [],
  emptyStateMessage = 'No sources added yet',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});

  const handleAddClick = () => {
    setShowAddForm(true);
    setSelectedType('');
    setFormData({});
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({ type, amount: '', description: '' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onAddSource) {
      onAddSource(formData);
    }
    setShowAddForm(false);
    setSelectedType('');
    setFormData({});
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setSelectedType('');
    setFormData({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {!showAddForm && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {title.split(' ')[0]}
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          {!selectedType ? (
            // Type Selection
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Select {title.split(' ')[0]} Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sourceTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeSelect(type.value)}
                    className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      {type.icon && <type.icon className="w-5 h-5 text-blue-600 mr-3" />}
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        {type.description && (
                          <div className="text-sm text-gray-600">{type.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Form Fields
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedType} Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add {selectedType}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-3">
        {sources.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-2">
              <Plus className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600">{emptyStateMessage}</p>
            <p className="text-sm text-gray-500 mt-1">
              Click "Add {title.split(' ')[0]}" to get started
            </p>
          </div>
        ) : (
          sources.map((source, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {source.type || 'Unknown Type'}
                    </h4>
                    {source.description && (
                      <span className="ml-2 text-sm text-gray-600">
                        - {source.description}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{parseInt(source.amount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditSource && onEditSource(index, source)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4名 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSource && onDeleteSource(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {sources.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-900">Total {title}</span>
            <span className="text-xl font-bold text-blue-900">
              ₹{sources.reduce((sum, source) => sum + (parseInt(source.amount) || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSourcePattern;
