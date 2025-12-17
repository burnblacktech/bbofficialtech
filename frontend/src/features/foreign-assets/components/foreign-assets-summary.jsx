// =====================================================
// FOREIGN ASSETS SUMMARY COMPONENT
// Display summary of all foreign assets with breakdown
// =====================================================

import React, { useState } from 'react';
import { Building2, TrendingUp, Home, Globe, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useDeleteForeignAsset } from '../hooks/use-foreign-assets';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const ForeignAssetsSummary = ({ filingId, assets, totalValue, onEdit }) => {
  const deleteAsset = useDeleteForeignAsset();
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, assetId: null });

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAssetIcon = (assetType) => {
    // Support both snake_case (from API) and camelCase
    const iconMap = {
      bankAccount: Building2,
      equityHolding: TrendingUp,
      immovableProperty: Home,
      other: Globe,
    };
    // Map snake_case to camelCase for backward compatibility
    const normalizedType = assetType === 'bank_account' ? 'bankAccount' :
                          assetType === 'equity_holding' ? 'equityHolding' :
                          assetType === 'immovable_property' ? 'immovableProperty' :
                          assetType;
    return iconMap[normalizedType] || Globe;
  };

  const getAssetTypeLabel = (assetType) => {
    // Support both snake_case (from API) and camelCase
    const labelMap = {
      bankAccount: 'Bank Account',
      equityHolding: 'Equity Holding',
      immovableProperty: 'Immovable Property',
      other: 'Other Asset',
    };
    // Map snake_case to camelCase for backward compatibility
    const normalizedType = assetType === 'bank_account' ? 'bankAccount' :
                          assetType === 'equity_holding' ? 'equityHolding' :
                          assetType === 'immovable_property' ? 'immovableProperty' :
                          assetType;
    return labelMap[normalizedType] || 'Asset';
  };

  const handleDelete = async (assetId) => {
    setDeleteConfirm({ isOpen: true, assetId });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.assetId) {
      try {
        const result = await deleteAsset.mutateAsync({
          filingId,
          assetId: deleteConfirm.assetId,
        });

        if (result.success) {
          toast.success('Asset deleted successfully');
        }
      } catch (error) {
        toast.error('Failed to delete asset');
      }
    }
    setDeleteConfirm({ isOpen: false, assetId: null });
  };

  // Calculate breakdown by type
  const breakdownByType = assets.reduce((acc, asset) => {
    const type = asset.assetType;
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 };
    }
    acc[type].count += 1;
    acc[type].value += parseFloat(asset.valuationAmountInr || 0);
    return acc;
  }, {});

  // Calculate breakdown by country
  const breakdownByCountry = assets.reduce((acc, asset) => {
    const country = asset.country;
    if (!acc[country]) {
      acc[country] = { count: 0, value: 0 };
    }
    acc[country].count += 1;
    acc[country].value += parseFloat(asset.valuationAmountInr || 0);
    return acc;
  }, {});

  // Calculate DTAA assets
  const dtaaAssets = assets.filter(asset => asset.dtaaApplicable);
  const dtaaValue = dtaaAssets.reduce((sum, asset) => sum + parseFloat(asset.valuationAmountInr || 0), 0);

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
        <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-heading-md text-slate-900 mb-2">No Foreign Assets Declared</h3>
        <p className="text-body-sm text-slate-600">
          Add your foreign assets to get started with Schedule FA declaration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl p-6 border border-gold-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-sm text-slate-600 mb-1">Total Foreign Assets Value</p>
            <p className="text-heading-xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
          </div>
          <div className="p-4 bg-white rounded-xl">
            <DollarSign className="h-8 w-8 text-gold-600" />
          </div>
        </div>
      </div>

      {/* Breakdown by Type */}
      <div>
        <h4 className="text-heading-sm text-slate-900 font-medium mb-4">Breakdown by Asset Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(breakdownByType).map(([type, data]) => {
            const Icon = getAssetIcon(type);
            return (
              <div key={type} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gold-600 mr-2" />
                    <span className="text-body-sm font-medium text-slate-700">
                      {getAssetTypeLabel(type)}
                    </span>
                  </div>
                  <span className="text-body-xs text-slate-500">{data.count}</span>
                </div>
                <p className="text-heading-md font-semibold text-slate-900">
                  {formatCurrency(data.value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Country */}
      <div>
        <h4 className="text-heading-sm text-slate-900 font-medium mb-4">Breakdown by Country</h4>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200">
            {Object.entries(breakdownByCountry)
              .sort((a, b) => b[1].value - a[1].value)
              .map(([country, data]) => (
                <div key={country} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-body-sm font-medium text-slate-900">{country}</p>
                    <p className="text-body-xs text-slate-500">{data.count} asset(s)</p>
                  </div>
                  <p className="text-body-md font-semibold text-slate-900">
                    {formatCurrency(data.value)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* DTAA Summary */}
      {dtaaAssets.length > 0 && (
        <div className="bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-info-900 mb-1">
                DTAA Benefits Claimed
              </p>
              <p className="text-body-xs text-info-700">
                {dtaaAssets.length} asset(s) eligible for DTAA benefits
              </p>
            </div>
            <p className="text-heading-md font-semibold text-info-900">
              {formatCurrency(dtaaValue)}
            </p>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div>
        <h4 className="text-heading-sm text-slate-900 font-medium mb-4">All Assets</h4>
        <div className="space-y-3">
          {assets.map((asset) => {
            const Icon = getAssetIcon(asset.assetType);
            return (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-elevation-2 transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-gold-600" />
                      <h5 className="text-heading-sm font-medium text-slate-900">
                        {asset.assetDetails?.bankName ||
                          asset.assetDetails?.companyName ||
                          asset.assetDetails?.address ||
                          getAssetTypeLabel(asset.assetType)}
                      </h5>
                      <span className="px-2 py-1 text-body-small font-medium bg-blue-100 text-blue-800 rounded">
                        {asset.country}
                      </span>
                      {asset.dtaaApplicable && (
                        <span className="px-2 py-1 text-body-small font-medium bg-green-100 text-green-800 rounded">
                          DTAA
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-body-sm text-slate-600">
                      <div>
                        <span className="font-medium">Type:</span> {getAssetTypeLabel(asset.assetType)}
                      </div>
                      <div>
                        <span className="font-medium">Value:</span> {formatCurrency(asset.valuationAmountInr)}
                      </div>
                      {asset.currency && (
                        <div>
                          <span className="font-medium">Currency:</span> {asset.currency}
                        </div>
                      )}
                      {asset.dtaaCountry && (
                        <div>
                          <span className="font-medium">DTAA Country:</span> {asset.dtaaCountry}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onEdit(asset)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                      title="Edit Asset"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 text-error-600 hover:text-error-700 hover:bg-error-50 rounded"
                      title="Delete Asset"
                      disabled={deleteAsset.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, assetId: null })}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default ForeignAssetsSummary;

