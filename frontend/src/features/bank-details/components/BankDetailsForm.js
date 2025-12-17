// =====================================================
// BANK DETAILS FORM COMPONENT
// For all ITR forms - Bank account details for refund
// Enhanced with verification and multiple accounts
// =====================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { usePreValidateBankAccount, useVerifyBankAccount } from '../hooks/use-bank-details';
import Button from '../../../components/DesignSystem/components/Button';

const BankDetailsForm = ({ filingId, data, onUpdate }) => {
  const [errors, setErrors] = useState({});
  const [accounts, setAccounts] = useState(data?.accounts || [data || {}].filter(Boolean));
  const [verifyingAccount, setVerifyingAccount] = useState(null);

  const { mutate: preValidateIFSC } = usePreValidateBankAccount();
  const { mutate: verifyAccount } = useVerifyBankAccount(filingId);

  useEffect(() => {
    if (data && !Array.isArray(data)) {
      setAccounts([data]);
    } else if (data) {
      setAccounts(data);
    }
  }, [data]);

  const validateIFSC = (ifsc) => {
    if (!ifsc) {
      return null; // Optional field
    }
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscPattern.test(ifsc)) {
      return 'Invalid IFSC code. Format: ABCD0123456';
    }
    return null;
  };

  const validateAccountNumber = (accountNumber) => {
    if (!accountNumber) {
      return null; // Optional but recommended for refund
    }
    if (accountNumber.length < 9) {
      return 'Account number must be at least 9 digits';
    }
    if (!/^\d+$/.test(accountNumber)) {
      return 'Account number must contain only digits';
    }
    return null;
  };

  const handleAddAccount = () => {
    const newAccount = {
      id: Date.now(),
      bankName: '',
      ifsc: '',
      accountNumber: '',
      accountType: 'savings',
      isRefundAccount: accounts.length === 0,
      verified: false,
    };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    if (onUpdate) {
      onUpdate({ accounts: updated });
    }
  };

  const handleRemoveAccount = (id) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    if (onUpdate) {
      onUpdate({ accounts: updated });
    }
  };

  const handleAccountChange = (id, field, value) => {
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        const newAcc = { ...acc, [field]: value };

        // Auto-validate IFSC when changed
        if (field === 'ifsc') {
          const validatedIFSC = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
          newAcc.ifsc = validatedIFSC;

          if (validatedIFSC.length === 11) {
            preValidateIFSC(validatedIFSC, {
              onSuccess: (result) => {
                if (result.bankName) {
                  const updatedWithBank = accounts.map((a) =>
                    a.id === id ? { ...a, bankName: result.bankName, ifsc: validatedIFSC } : a,
                  );
                  setAccounts(updatedWithBank);
                  if (onUpdate) {
                    onUpdate({ accounts: updatedWithBank });
                  }
                }
              },
            });
          }
        }

        // Validate account number
        if (field === 'accountNumber') {
          newAcc.accountNumber = value.replace(/\D/g, '');
        }

        return newAcc;
      }
      return acc;
    });
    setAccounts(updated);
    if (onUpdate) {
      onUpdate({ accounts: updated });
    }
  };

  const handleVerifyAccount = (account) => {
    setVerifyingAccount(account.id);
    verifyAccount(
      {
        accountId: account.id,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
      },
      {
        onSuccess: () => {
          const updated = accounts.map((a) =>
            a.id === account.id ? { ...a, verified: true } : a,
          );
          setAccounts(updated);
          if (onUpdate) {
            onUpdate({ accounts: updated });
          }
        },
        onSettled: () => {
          setVerifyingAccount(null);
        },
      },
    );
  };

  const handleSetRefundAccount = (id) => {
    const updated = accounts.map((acc) => ({
      ...acc,
      isRefundAccount: acc.id === id,
    }));
    setAccounts(updated);
    if (onUpdate) {
      onUpdate({ accounts: updated, refundAccount: id });
    }
  };

  const handleChange = (field, value) => {
    // Legacy support for single account
    const newErrors = { ...errors };
    let validatedValue = value;

    if (field === 'ifsc') {
      validatedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      const error = validateIFSC(validatedValue);
      if (error) {
        newErrors.ifsc = error;
      } else {
        delete newErrors.ifsc;
      }
    }

    if (field === 'accountNumber') {
      validatedValue = value.replace(/\D/g, '');
      const error = validateAccountNumber(validatedValue);
      if (error) {
        newErrors.accountNumber = error;
      } else {
        delete newErrors.accountNumber;
      }
    }

    setErrors(newErrors);
    onUpdate({ [field]: validatedValue || value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800">Bank Account Details</h3>
          <p className="text-body-sm text-slate-600 mt-1">
            Add bank accounts for refund processing
          </p>
        </div>
        <Button size="sm" onClick={handleAddAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-body-regular text-blue-800">
          <strong>Note:</strong> Bank details are required for tax refunds. Ensure IFSC and account number are correct.
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-body-md text-slate-600 mb-4">No bank accounts added</p>
          <Button onClick={handleAddAccount}>Add Bank Account</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-medium text-slate-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={account.bankName || ''}
                      onChange={(e) => handleAccountChange(account.id, 'bankName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-slate-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={account.ifsc || ''}
                      onChange={(e) => handleAccountChange(account.id, 'ifsc', e.target.value)}
                      maxLength={11}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 uppercase"
                      placeholder="ABCD0123456"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-slate-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={account.accountNumber || ''}
                      onChange={(e) => handleAccountChange(account.id, 'accountNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-slate-700 mb-2">
                      Account Type
                    </label>
                    <select
                      value={account.accountType || 'savings'}
                      onChange={(e) => handleAccountChange(account.id, 'accountType', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAccount(account.id)}
                  className="ml-4 p-2 text-slate-400 hover:text-error-600 rounded-xl hover:bg-error-50"
                  aria-label="Remove account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={account.isRefundAccount || false}
                      onChange={() => handleSetRefundAccount(account.id)}
                      className="mr-2"
                    />
                    <span className="text-body-sm text-slate-700">Use for refund</span>
                  </label>
                  {account.verified ? (
                    <div className="flex items-center text-success-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-body-sm">Verified</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyAccount(account)}
                      disabled={verifyingAccount === account.id || !account.ifsc || !account.accountNumber}
                      loading={verifyingAccount === account.id}
                    >
                      Verify Account
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankDetailsForm;

