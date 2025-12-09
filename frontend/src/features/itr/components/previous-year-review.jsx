// =====================================================
// PREVIOUS YEAR REVIEW COMPONENT
// Section selection and editable preview before applying copy
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, DollarSign, Receipt, CreditCard, Building2, CheckCircle, ArrowLeft, Loader, AlertCircle, Save } from 'lucide-react';
import { useCopyFromPreviousYear } from '../hooks/use-previous-year-copy';
import toast from 'react-hot-toast';
import itrService from '../../../services/api/itrService';

const PreviousYearReview = ({ targetFilingId, sourceFilingId, previousYearData, onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const filingId = targetFilingId || location.state?.targetFilingId;
  const sourceId = sourceFilingId || location.state?.sourceFilingId;
  const previousData = previousYearData || location.state?.previousYearData;
  const selectedPerson = location.state?.selectedPerson;

  const copyMutation = useCopyFromPreviousYear();

  const [selectedSections, setSelectedSections] = useState({
    personalInfo: true,
    income: true,
    deductions: true,
    taxesPaid: true,
    bankDetails: true,
  });

  const [reviewData, setReviewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const [compatibilityWarnings, setCompatibilityWarnings] = useState([]);

  const renderCompatibilityWarnings = () => {
    if (!compatibilityWarnings || compatibilityWarnings.length === 0) {
      return null;
    }

    return (
      <div className="mb-6 space-y-2">
        {compatibilityWarnings.map((warning, index) => (
          <div
            key={index}
            className="bg-warning-50 border border-warning-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5 mr-3" />
              <p className="text-sm text-warning-700">{warning}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (previousData?.data) {
      // Check for compatibility warnings from backend
      if (previousData._compatibilityWarnings) {
        setCompatibilityWarnings(previousData._compatibilityWarnings);
        // Show warnings as info toasts
        previousData._compatibilityWarnings.forEach(warning => {
          toast(warning, { icon: '⚠️', duration: 5000 });
        });
      }
      // Normalize snake_case keys to camelCase
      const normalizedData = { ...previousData.data };
      if (normalizedData['personal_info']) {
        normalizedData.personalInfo = normalizedData['personal_info'];
        delete normalizedData['personal_info'];
      }
      if (normalizedData['taxes_paid']) {
        normalizedData.taxesPaid = normalizedData['taxes_paid'];
        delete normalizedData['taxes_paid'];
      }
      if (normalizedData['bank_details']) {
        normalizedData.bankDetails = normalizedData['bank_details'];
        delete normalizedData['bank_details'];
      }
      setReviewData(normalizedData);
    }
  }, [previousData]);

  const sections = previousData?.sections || {};
  // Map backend snake_case keys to frontend camelCase keys
  const sectionKeyMap = {
    'personal_info': 'personalInfo',
    'taxes_paid': 'taxesPaid',
    'bank_details': 'bankDetails',
  };
  const availableSections = Object.keys(sections)
    .filter(key => sections[key])
    .map(key => sectionKeyMap[key] || key);

  const handleSectionToggle = (section) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFieldChange = (section, field, value) => {
    setReviewData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setIsEditing(true);
  };

  const handleApplyCopy = async () => {
    if (!sourceId) {
      toast.error('Missing source filing information');
      return;
    }

    const sectionsToCopy = availableSections.filter(section => selectedSections[section]);

    if (sectionsToCopy.length === 0) {
      toast.error('Please select at least one section to copy');
      return;
    }

    try {
      let targetFilingId = filingId;

      // Create a new filing if one doesn't exist
      if (!targetFilingId && selectedPerson) {
        const createResponse = await itrService.createITR({
          itrType: previousData?.itrType || 'ITR-1',
          assessmentYear: location.state?.currentAssessmentYear || '2024-25',
          formData: {
            personalInfo: {
              pan: selectedPerson.panNumber,
              name: selectedPerson.name,
            },
          },
        });

        if (createResponse?.filing?.id) {
          targetFilingId = createResponse.filing.id;
        } else {
          toast.error('Failed to create filing');
          return;
        }
      }

      if (!targetFilingId) {
        toast.error('Missing filing information. Please try again.');
        return;
      }

      // Convert camelCase section keys back to snake_case for backend
      const backendSectionMap = {
        personalInfo: 'personal_info',
        taxesPaid: 'taxes_paid',
        bankDetails: 'bank_details',
      };
      const backendSections = sectionsToCopy.map(section => backendSectionMap[section] || section);

      // Convert reviewData keys back to snake_case for backend if editing
      let backendReviewData = null;
      if (isEditing && reviewData) {
        backendReviewData = { ...reviewData };
        if (backendReviewData.personalInfo) {
          backendReviewData['personal_info'] = backendReviewData.personalInfo;
          delete backendReviewData.personalInfo;
        }
        if (backendReviewData.taxesPaid) {
          backendReviewData['taxes_paid'] = backendReviewData.taxesPaid;
          delete backendReviewData.taxesPaid;
        }
        if (backendReviewData.bankDetails) {
          backendReviewData['bank_details'] = backendReviewData.bankDetails;
          delete backendReviewData.bankDetails;
        }
      }

      await copyMutation.mutateAsync({
        targetFilingId: targetFilingId,
        sourceFilingId: sourceId,
        sections: backendSections,
        reviewData: backendReviewData,
      });

      if (onComplete) {
        onComplete();
      } else {
        // Navigate to ITR computation page
        navigate('/itr/computation', {
          state: {
            filingId: targetFilingId,
            selectedPerson: selectedPerson,
            copiedFromPreviousYear: true,
            dataSource: 'previous-year',
          },
        });
      }
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Failed to apply copy:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderEditableSection = (title, Icon, sectionKey, fields) => {
    if (!selectedSections[sectionKey] || !sections[sectionKey]) return null;

    const sectionData = reviewData[sectionKey] || {};

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-heading-md text-gray-900">{title}</h3>
          </div>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="space-y-3">
          {fields.map((field) => {
            const value = sectionData[field.key] || '';
            return (
              <div key={field.key}>
                <label className="block text-body-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type || 'text'}
                  value={value}
                  onChange={(e) => handleFieldChange(sectionKey, field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!previousData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-heading-sm text-error-900 mb-1">No Data Available</h3>
                <p className="text-body-sm text-error-700 mb-4">
                  Previous year data is not available. Please go back and select a different filing.
                </p>
                <button
                  onClick={() => navigate(-1)}
                  className="text-sm font-medium text-error-600 hover:text-error-800"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compatibility Warnings */}
        {renderCompatibilityWarnings()}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-heading-2xl text-gray-900 mb-2">Review & Edit Data</h1>
          <p className="text-body-md text-gray-600">
            Select sections to copy and edit values before applying to your current filing
          </p>
        </div>

        {/* Section Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-heading-md text-gray-900 mb-4">Select Sections to Copy</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableSections.map((section) => (
              <label
                key={section}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSections[section]}
                  onChange={() => handleSectionToggle(section)}
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-body-sm font-medium text-gray-900">
                  {section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Editable Sections */}
        <div className="space-y-4 mb-8">
          {/* Personal Information */}
          {(sections.personal_info || sections.personalInfo) && renderEditableSection(
            'Personal Information',
            User,
            'personalInfo',
            [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'pan', label: 'PAN', type: 'text' },
              { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
              { key: 'address', label: 'Address', type: 'text' },
              { key: 'city', label: 'City', type: 'text' },
              { key: 'state', label: 'State', type: 'text' },
              { key: 'pincode', label: 'Pincode', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'email', label: 'Email', type: 'email' },
            ],
          )}

          {/* Income - Simplified for editing */}
          {sections.income && selectedSections.income && reviewData.income && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-heading-md text-gray-900">Income</h3>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <p className="text-body-sm text-info-700">
                  Income details will be copied as-is. You can edit them after applying the copy.
                </p>
              </div>
            </div>
          )}

          {/* Deductions - Simplified */}
          {sections.deductions && selectedSections.deductions && reviewData.deductions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Receipt className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-heading-md text-gray-900">Deductions</h3>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <p className="text-body-sm text-info-700">
                  Deduction details will be copied as-is. You can edit them after applying the copy.
                </p>
              </div>
            </div>
          )}

          {/* Taxes Paid - Simplified */}
          {(sections.taxes_paid || sections.taxesPaid) && selectedSections.taxesPaid && (reviewData.taxes_paid || reviewData.taxesPaid) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gold-100 rounded-lg mr-3">
                    <CreditCard className="h-5 w-5 text-gold-600" />
                  </div>
                  <h3 className="text-heading-md text-gray-900">Taxes Paid</h3>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <p className="text-body-sm text-info-700">
                  Tax payment details will be copied as-is. You can edit them after applying the copy.
                </p>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {(sections.bank_details || sections.bankDetails) && renderEditableSection(
            'Bank Details',
            Building2,
            'bankDetails',
            [
              { key: 'accountNumber', label: 'Account Number', type: 'text' },
              { key: 'ifsc', label: 'IFSC Code', type: 'text' },
              { key: 'bankName', label: 'Bank Name', type: 'text' },
              { key: 'accountType', label: 'Account Type', type: 'text' },
            ],
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={copyMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCopy}
            disabled={copyMutation.isPending || availableSections.filter(s => selectedSections[s]).length === 0}
            className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center"
          >
            {copyMutation.isPending ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Applying...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Apply Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousYearReview;

