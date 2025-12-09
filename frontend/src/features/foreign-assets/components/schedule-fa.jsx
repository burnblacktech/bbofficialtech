// =====================================================
// SCHEDULE FA COMPONENT
// Main component for Schedule FA (Foreign Assets) declaration
// =====================================================

import React, { useState } from 'react';
import { Globe, Building2, TrendingUp, Home, FileText, Plus } from 'lucide-react';
import { useForeignAssets } from '../hooks/use-foreign-assets';
import ForeignBankAccountForm from './foreign-bank-account-form';
import ForeignEquityForm from './foreign-equity-form';
import ForeignPropertyForm from './foreign-property-form';
import ForeignAssetsSummary from './foreign-assets-summary';

const ScheduleFA = ({ filingId, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const { data, isLoading, error } = useForeignAssets(filingId);

  const assets = data?.assets || [];
  const totalValue = data?.totalValue || 0;

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'bank_accounts', label: 'Bank Accounts', icon: Building2 },
    { id: 'equity_holdings', label: 'Equity Holdings', icon: TrendingUp },
    { id: 'immovable_property', label: 'Property', icon: Home },
    { id: 'other', label: 'Other Assets', icon: Globe },
  ];

  const handleAddAsset = (assetType) => {
    setEditingAsset(null);
    setShowAddForm(true);
    setActiveTab(assetType);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setShowAddForm(true);
    setActiveTab(asset.assetType);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingAsset(null);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingAsset(null);
    if (onUpdate) {
      onUpdate();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6">
        <p className="text-body-sm text-error-900">
          {error.message || 'Failed to load foreign assets'}
        </p>
      </div>
    );
  }

  const filteredAssets = activeTab === 'summary'
    ? assets
    : assets.filter(asset => asset.assetType === activeTab);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-lg text-gray-900">Schedule FA - Foreign Assets</h2>
            <p className="text-body-sm text-gray-600 mt-1">
              Declare all foreign assets held during the financial year
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => handleAddAsset('bank_accounts')}
              className="flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!showAddForm && (
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = tab.id === 'summary'
                ? assets.length
                : assets.filter(a => a.assetType === tab.id).length;

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
                  {count > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {showAddForm ? (
          // Show form for adding/editing asset
          <div>
            {activeTab === 'bank_accounts' && (
              <ForeignBankAccountForm
                filingId={filingId}
                asset={editingAsset}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            )}
            {activeTab === 'equity_holdings' && (
              <ForeignEquityForm
                filingId={filingId}
                asset={editingAsset}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            )}
            {activeTab === 'immovable_property' && (
              <ForeignPropertyForm
                filingId={filingId}
                asset={editingAsset}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            )}
          </div>
        ) : activeTab === 'summary' ? (
          // Show summary
          <ForeignAssetsSummary filingId={filingId} assets={assets} totalValue={totalValue} onEdit={handleEditAsset} />
        ) : (
          // Show asset list for selected type
          <div className="space-y-4">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-heading-md text-gray-900 mb-2">No {tabs.find(t => t.id === activeTab)?.label} Found</h3>
                <p className="text-body-sm text-gray-600 mb-4">
                  Add your first {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} to get started.
                </p>
                <button
                  onClick={() => handleAddAsset(activeTab)}
                  className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                </button>
              </div>
            ) : (
              <>
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-heading-md text-gray-900">
                            {asset.assetDetails?.bankName ||
                              asset.assetDetails?.companyName ||
                              asset.assetDetails?.address ||
                              'Foreign Asset'}
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {asset.country}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-body-sm text-gray-600">
                          <div>
                            <span className="font-medium">Value:</span>{' '}
                            ₹{parseFloat(asset.valuationAmountInr || 0).toLocaleString('en-IN')}
                          </div>
                          {asset.currency && (
                            <div>
                              <span className="font-medium">Currency:</span> {asset.currency}
                            </div>
                          )}
                          {asset.dtaaApplicable && (
                            <div>
                              <span className="font-medium">DTAA:</span> {asset.dtaaCountry}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditAsset(asset)}
                        className="ml-4 px-3 py-1 text-sm text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleAddAsset(activeTab)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleFA;

