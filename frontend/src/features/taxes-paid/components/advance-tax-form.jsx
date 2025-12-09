// =====================================================
// ADVANCE TAX FORM COMPONENT
// Form for advance tax payment details with challan
// =====================================================

import React, { useState } from 'react';
import { Plus, Trash2, Download, Calendar } from 'lucide-react';
import Button from '../../../components/common/Button';

const AdvanceTaxForm = ({ data = [], onUpdate, onGenerateChallan }) => {
  const [advanceTaxPayments, setAdvanceTaxPayments] = useState(data || []);

  const handleAdd = () => {
    const newPayment = {
      id: Date.now(),
      challanNumber: '',
      bsrCode: '',
      dateOfPayment: '',
      amount: 0,
      assessmentYear: '',
    };
    const updated = [...advanceTaxPayments, newPayment];
    setAdvanceTaxPayments(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleRemove = (id) => {
    const updated = advanceTaxPayments.filter((item) => item.id !== id);
    setAdvanceTaxPayments(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleChange = (id, field, value) => {
    const updated = advanceTaxPayments.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setAdvanceTaxPayments(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalAdvanceTax = advanceTaxPayments.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800">Advance Tax Payments</h3>
          <p className="text-body-sm text-gray-600 mt-1">
            Enter advance tax payments made during the financial year
          </p>
        </div>
        <div className="flex gap-2">
          {onGenerateChallan && (
            <Button variant="outline" size="sm" onClick={onGenerateChallan}>
              <Download className="h-4 w-4 mr-2" />
              Generate Challan
            </Button>
          )}
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {advanceTaxPayments.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No advance tax payments added</p>
          <Button onClick={handleAdd}>Add First Payment</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {advanceTaxPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Challan Number
                    </label>
                    <input
                      type="text"
                      value={payment.challanNumber}
                      onChange={(e) => handleChange(payment.id, 'challanNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      placeholder="Enter challan number"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      BSR Code
                    </label>
                    <input
                      type="text"
                      value={payment.bsrCode}
                      onChange={(e) => handleChange(payment.id, 'bsrCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      placeholder="Enter BSR code"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Date of Payment
                    </label>
                    <input
                      type="date"
                      value={payment.dateOfPayment}
                      onChange={(e) => handleChange(payment.id, 'dateOfPayment', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => handleChange(payment.id, 'amount', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(payment.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="bg-gold-50 rounded-xl border border-gold-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-body-md font-semibold text-gray-800">
                Total Advance Tax Paid
              </span>
              <span className="text-heading-md font-semibold text-gold-600">
                {formatCurrency(totalAdvanceTax)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceTaxForm;

