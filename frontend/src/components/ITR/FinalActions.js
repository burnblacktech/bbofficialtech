// =====================================================
// ITR FINAL ACTIONS COMPONENT
// Final actions for ITR filing - submit, save, print, etc.
// =====================================================

import React, { useState } from 'react';
import {
  CheckCircle,
  Save,
  Download,
  FileText,
  Printer,
  Share,
  Clock,
  AlertTriangle,
  Eye,
  Upload,
  Calculator,
  CreditCard,
} from 'lucide-react';

const FinalActions = ({
  filingData,
  taxCalculation,
  onSubmit,
  onSaveDraft,
  onPreview,
  onGeneratePDF,
  onPrint,
  onShare,
  validationErrors = [],
  isSubmitting = false,
  isDraftSaving = false,
  filingStatus = 'ready',
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = () => {
    if (validationErrors.length > 0) {
      setShowConfirmation(true);
      return;
    }
    if (onSubmit) {
      onSubmit();
    }
  };

  const canSubmit = filingStatus === 'ready' && validationErrors.length === 0;
  const hasTaxLiability = taxCalculation?.taxPayable > 0;
  const hasRefund = taxCalculation?.refundDue > 0;

  const ActionButton = ({ icon: Icon, label, onClick, disabled, variant = 'primary', loading = false }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        ${
          variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : variant === 'secondary'
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : variant === 'success'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : variant === 'warning'
            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Final Actions</h3>
        <p className="text-gray-600">
          Review your ITR details and submit or save your filing
        </p>
      </div>

      {/* Validation Status */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 mb-2">
                {validationErrors.length} Issue{validationErrors.length > 1 ? 's' : ''} Found
              </h4>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tax Summary */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tax Payable</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{taxCalculation?.taxPayable?.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">TDS Credits</p>
            <p className="text-xl font-bold text-green-600">
              ₹{taxCalculation?.tdsCredits?.toLocaleString('en-IN') || '0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Final Amount</p>
            <p className={`text-xl font-bold ${
              hasTaxLiability ? 'text-orange-600' : hasRefund ? 'text-green-600' : 'text-gray-900'
            }`}>
              {hasTaxLiability && `₹${taxCalculation?.taxPayable?.toLocaleString('en-IN')}`}
              {hasRefund && `+₹${Math.abs(taxCalculation?.refundDue)?.toLocaleString('en-IN')} Refund`}
              {!hasTaxLiability && !hasRefund && '₹0'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <ActionButton
            icon={CheckCircle}
            label={isSubmitting ? 'Submitting...' : 'Submit ITR'}
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
            variant={validationErrors.length > 0 ? 'warning' : 'primary'}
          />

          <ActionButton
            icon={Save}
            label={isDraftSaving ? 'Saving...' : 'Save Draft'}
            onClick={onSaveDraft}
            disabled={isDraftSaving}
            loading={isDraftSaving}
            variant="secondary"
          />
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-wrap gap-3">
          <ActionButton
            icon={Eye}
            label="Preview"
            onClick={onPreview}
            variant="secondary"
          />

          <ActionButton
            icon={Download}
            label="Generate PDF"
            onClick={onGeneratePDF}
            variant="secondary"
          />

          <ActionButton
            icon={Printer}
            label="Print"
            onClick={onPrint}
            variant="secondary"
          />

          <ActionButton
            icon={Share}
            label="Share"
            onClick={onShare}
            variant="secondary"
          />
        </div>

        {/* Additional Options */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionButton
              icon={Calculator}
              label="Tax Calculator"
              variant="secondary"
            />
            <ActionButton
              icon={Upload}
              label="Upload Documents"
              variant="secondary"
            />
            <ActionButton
              icon={CreditCard}
              label="Pay Taxes Online"
              variant={hasTaxLiability ? 'warning' : 'secondary'}
              disabled={!hasTaxLiability}
            />
            <ActionButton
              icon={FileText}
              label="Download Acknowledgment"
              variant="secondary"
              disabled={filingStatus !== 'submitted'}
            />
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Filing Timeline</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              filingStatus === 'draft' ? 'bg-blue-600' : 'bg-green-600'
            }`} />
            <span className="text-sm text-gray-700">Draft Created</span>
            <span className="text-xs text-gray-500">Just now</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              filingStatus === 'reviewed' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <span className="text-sm text-gray-700">Review Completed</span>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              filingStatus === 'submitted' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <span className="text-sm text-gray-700">ITR Submitted</span>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              filingStatus === 'verified' ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            <span className="text-sm text-gray-700">Verified by IT Department</span>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900 mb-1">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Ensure all information is accurate before submission</li>
              <li>• You can edit your ITR within the due date if needed</li>
              <li>• Save your acknowledgment after successful submission</li>
              <li>• Keep all supporting documents for 6 years</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit with Validation Issues?
            </h3>
            <p className="text-gray-600 mb-6">
              There are {validationErrors.length} validation issues in your ITR.
              Submitting now may result in processing delays or rejection.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Review Issues
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  if (onSubmit) onSubmit();
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalActions;
