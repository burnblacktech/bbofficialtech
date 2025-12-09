// =====================================================
// FOREIGN BANK ACCOUNT FORM COMPONENT
// Form for declaring foreign bank accounts
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAddForeignAsset, useUpdateForeignAsset } from '../hooks/use-foreign-assets';
import { bankAccountAssetSchema } from '../schema/foreign-assets.schema';
import Button from '../../../components/common/Button';

const ForeignBankAccountForm = ({ filingId, asset, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assetType: 'bank_account',
    country: '',
    assetDetails: {
      bankName: '',
      accountNumber: '',
      accountType: 'savings',
      balance: '',
      currency: 'USD',
      openingDate: '',
      closingDate: '',
    },
    declarationDate: new Date().toISOString().split('T')[0],
    valuationDate: new Date().toISOString().split('T')[0],
    valuationAmountInr: '',
    valuationAmountForeign: '',
    currency: 'USD',
    exchangeRate: '',
    dtaaApplicable: false,
    dtaaCountry: '',
  });

  const [errors, setErrors] = useState({});
  const [calculatedInr, setCalculatedInr] = useState(0);

  const addAsset = useAddForeignAsset();
  const updateAsset = useUpdateForeignAsset();

  useEffect(() => {
    if (asset) {
      setFormData({
        assetType: asset.assetType,
        country: asset.country,
        assetDetails: asset.assetDetails,
        declarationDate: asset.declarationDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        valuationDate: asset.valuationDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        valuationAmountInr: asset.valuationAmountInr || '',
        valuationAmountForeign: asset.valuationAmountForeign || '',
        currency: asset.currency || 'USD',
        exchangeRate: asset.exchangeRate || '',
        dtaaApplicable: asset.dtaaApplicable || false,
        dtaaCountry: asset.dtaaCountry || '',
      });
    }
  }, [asset]);

  useEffect(() => {
    // Calculate INR value when foreign amount or exchange rate changes
    if (formData.valuationAmountForeign && formData.exchangeRate) {
      const calculated = parseFloat(formData.valuationAmountForeign) * parseFloat(formData.exchangeRate);
      setCalculatedInr(calculated);
      if (!formData.valuationAmountInr) {
        setFormData(prev => ({ ...prev, valuationAmountInr: calculated }));
      }
    }
  }, [formData.valuationAmountForeign, formData.exchangeRate]);

  const handleChange = (field, value) => {
    if (field.startsWith('assetDetails.')) {
      const detailField = field.replace('assetDetails.', '');
      setFormData(prev => ({
        ...prev,
        assetDetails: {
          ...prev.assetDetails,
          [detailField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validatedData = bankAccountAssetSchema.parse(formData);

      // Prepare submission data
      const submissionData = {
        ...validatedData,
        valuationAmountInr: validatedData.valuationAmountInr || calculatedInr,
      };

      if (asset) {
        // Update existing asset
        const result = await updateAsset.mutateAsync({
          filingId,
          assetId: asset.id,
          assetData: submissionData,
        });

        if (result.success && onSuccess) {
          onSuccess();
        }
      } else {
        // Add new asset
        const result = await addAsset.mutateAsync({
          filingId,
          assetData: submissionData,
        });

        if (result.success && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (error.errors) {
        const zodErrors = {};
        error.errors.forEach((err) => {
          zodErrors[err.path.join('.')] = err.message;
        });
        setErrors(zodErrors);
      } else {
        setErrors({ submit: error.message || 'Failed to save asset' });
      }
    }
  };

  const commonCountries = [
    'United States',
    'United Kingdom',
    'United Arab Emirates',
    'Singapore',
    'Australia',
    'Canada',
    'Germany',
    'France',
    'Japan',
    'Switzerland',
    'Other',
  ];

  const currencies = ['USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-md text-gray-900">
          {asset ? 'Edit Foreign Bank Account' : 'Add Foreign Bank Account'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Bank Account Details */}
      <div className="space-y-4">
        <h4 className="text-heading-sm text-gray-900 font-medium">Bank Account Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-error-600">*</span>
            </label>
            <input
              type="text"
              value={formData.assetDetails.bankName}
              onChange={(e) => handleChange('assetDetails.bankName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                errors['assetDetails.bankName'] ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="Enter bank name"
            />
            {errors['assetDetails.bankName'] && (
              <p className="mt-1 text-body-xs text-error-600">{errors['assetDetails.bankName']}</p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-error-600">*</span>
            </label>
            <input
              type="text"
              value={formData.assetDetails.accountNumber}
              onChange={(e) => handleChange('assetDetails.accountNumber', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                errors['assetDetails.accountNumber'] ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="Enter account number"
            />
            {errors['assetDetails.accountNumber'] && (
              <p className="mt-1 text-body-xs text-error-600">{errors['assetDetails.accountNumber']}</p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Account Type <span className="text-error-600">*</span>
            </label>
            <select
              value={formData.assetDetails.accountType}
              onChange={(e) => handleChange('assetDetails.accountType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="fixed_deposit">Fixed Deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Country <span className="text-error-600">*</span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                errors.country ? 'border-error-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Country</option>
              {commonCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-body-xs text-error-600">{errors.country}</p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => {
                handleChange('currency', e.target.value);
                handleChange('assetDetails.currency', e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Balance (Foreign Currency)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.assetDetails.balance}
              onChange={(e) => {
                handleChange('assetDetails.balance', e.target.value);
                handleChange('valuationAmountForeign', e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Valuation Details */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-heading-sm text-gray-900 font-medium">Valuation Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Valuation Amount (Foreign Currency)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valuationAmountForeign}
              onChange={(e) => handleChange('valuationAmountForeign', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Exchange Rate
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.exchangeRate}
              onChange={(e) => handleChange('exchangeRate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="e.g., 83.25"
            />
            <p className="mt-1 text-body-xs text-gray-500">RBI reference rate for valuation date</p>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Valuation Amount (INR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valuationAmountInr || calculatedInr}
              onChange={(e) => handleChange('valuationAmountInr', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="Auto-calculated"
            />
            {calculatedInr > 0 && !formData.valuationAmountInr && (
              <p className="mt-1 text-body-xs text-success-600">
                Calculated: ₹{calculatedInr.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Valuation Date
            </label>
            <input
              type="date"
              value={formData.valuationDate}
              onChange={(e) => handleChange('valuationDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>
      </div>

      {/* DTAA */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-heading-sm text-gray-900 font-medium">DTAA Benefits</h4>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="dtaaApplicable"
            checked={formData.dtaaApplicable}
            onChange={(e) => handleChange('dtaaApplicable', e.target.checked)}
            className="mt-1 w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
          />
          <label htmlFor="dtaaApplicable" className="ml-2 text-body-sm text-gray-700">
            DTAA (Double Taxation Avoidance Agreement) Applicable
          </label>
        </div>

        {formData.dtaaApplicable && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              DTAA Country <span className="text-error-600">*</span>
            </label>
            <select
              value={formData.dtaaCountry}
              onChange={(e) => handleChange('dtaaCountry', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                errors.dtaaCountry ? 'border-error-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select DTAA Country</option>
              {commonCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.dtaaCountry && (
              <p className="mt-1 text-body-xs text-error-600">{errors.dtaaCountry}</p>
            )}
            <div className="mt-2 bg-info-50 border border-info-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-info-600 mr-2 mt-0.5" />
                <p className="text-body-xs text-info-800">
                  Ensure you have supporting documents for DTAA claims. Upload documents after saving this asset.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-body-sm text-error-900">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={addAsset.isPending || updateAsset.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {asset ? 'Update Asset' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
};

export default ForeignBankAccountForm;

