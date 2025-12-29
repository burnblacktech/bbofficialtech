// =====================================================
// PERSONAL INFO FORM COMPONENT - MODULE 4 IMPLEMENTATION
// Comprehensive personal information form with react-hook-form
// =====================================================

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../DesignSystem/components/Button';
import Card from '../common/Card';
import {
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Validation schema
const personalInfoSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  maritalStatus: yup.string().required('Marital status is required'),
  pan: yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .required('PAN is required'),
  aadhaar: yup.string()
    .matches(/^[0-9]{12}$/, 'Aadhaar must be 12 digits')
    .optional(),
  address: yup.object({
    line1: yup.string().required('Address line 1 is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    pincode: yup.string()
      .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits')
      .required('Pincode is required'),
    country: yup.string().default('India'),
  }),
  contact: yup.object({
    phone: yup.string()
      .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
      .required('Phone number is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    alternatePhone: yup.string()
      .matches(/^[0-9]{10}$/, 'Alternate phone must be 10 digits')
      .optional(),
  }),
  bankAccounts: yup.array().of(
    yup.object({
      accountNumber: yup.string().required('Account number is required'),
      ifscCode: yup.string()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code')
        .required('IFSC code is required'),
      bankName: yup.string().required('Bank name is required'),
      accountType: yup.string().required('Account type is required'),
      isPrimary: yup.boolean().default(false),
    }),
  ).min(1, 'At least one bank account is required'),
});

const PersonalInfoForm = ({
  data = {},
  onChange,
  onNext,
  onPrevious,
  isFirstStep = true,
  isLastStep = false,
}) => {
  const [bankAccounts, setBankAccounts] = useState(data.bankAccounts || []);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(personalInfoSchema),
    defaultValues: {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || '',
      maritalStatus: data.maritalStatus || '',
      pan: data.pan || '',
      aadhaar: data.aadhaar || '',
      address: {
        line1: data.address?.line1 || '',
        line2: data.address?.line2 || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        pincode: data.address?.pincode || '',
        country: data.address?.country || 'India',
      },
      contact: {
        phone: data.contact?.phone || '',
        email: data.contact?.email || '',
        alternatePhone: data.contact?.alternatePhone || '',
      },
      bankAccounts: bankAccounts,
    },
  });

  // Watch form values and update parent
  const watchedValues = watch();

  // Sync with parent only when debounced values change
  useEffect(() => {
    onChange({ ...watchedValues, bankAccounts });
  }, [watchedValues, bankAccounts, onChange]);

  // Handle form submission
  const onSubmit = (formData) => {
    const completeData = { ...formData, bankAccounts };
    onChange(completeData);
    if (onNext) {
      onNext(completeData);
    }
  };

  // Bank account management
  const addBankAccount = (accountData) => {
    const newAccount = {
      ...accountData,
      id: Date.now().toString(),
      isPrimary: bankAccounts.length === 0, // First account is primary
    };

    setBankAccounts([...bankAccounts, newAccount]);
    setShowBankForm(false);
    setEditingAccount(null);
    toast.success('Bank account added successfully');
  };

  const updateBankAccount = (accountData) => {
    setBankAccounts(bankAccounts.map(account =>
      account.id === editingAccount.id
        ? { ...account, ...accountData }
        : account,
    ));
    setShowBankForm(false);
    setEditingAccount(null);
    toast.success('Bank account updated successfully');
  };

  const deleteBankAccount = (accountId) => {
    setBankAccounts(bankAccounts.filter(account => account.id !== accountId));
    toast.success('Bank account deleted');
  };

  const setPrimaryAccount = (accountId) => {
    setBankAccounts(bankAccounts.map(account => ({
      ...account,
      isPrimary: account.id === accountId,
    })));
  };

  const openBankForm = (account = null) => {
    setEditingAccount(account);
    setShowBankForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-heading-4 font-semibold text-slate-900">
              Personal Information
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  {...register('firstName')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Last Name *
                </label>
                <input
                  {...register('lastName')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Gender *
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Marital Status *
                </label>
                <select
                  {...register('maritalStatus')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
                {errors.maritalStatus && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.maritalStatus.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  PAN Number *
                </label>
                <input
                  {...register('pan')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="ABCDE1234F"
                  maxLength="10"
                />
                {errors.pan && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.pan.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  {...register('aadhaar')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="123456789012"
                  maxLength="12"
                />
                {errors.aadhaar && (
                  <p className="mt-1 text-body-regular text-error-600">{errors.aadhaar.message}</p>
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-md font-semibold text-slate-900">Address Details</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    {...register('address.line1')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter address line 1"
                  />
                  {errors.address?.line1 && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.address.line1.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    {...register('address.line2')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter address line 2"
                  />
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    {...register('address.city')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter city"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    State *
                  </label>
                  <input
                    {...register('address.state')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter state"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.address.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    {...register('address.pincode')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="123456"
                    maxLength="6"
                  />
                  {errors.address?.pincode && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.address.pincode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <input
                    {...register('address.country')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    value="India"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="text-md font-semibold text-slate-900">Contact Details</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    {...register('contact.phone')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="9876543210"
                    maxLength="10"
                  />
                  {errors.contact?.phone && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.contact.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    {...register('contact.email')}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="example@email.com"
                  />
                  {errors.contact?.email && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.contact.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    Alternate Phone
                  </label>
                  <input
                    {...register('contact.alternatePhone')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="9876543210"
                    maxLength="10"
                  />
                  {errors.contact?.alternatePhone && (
                    <p className="mt-1 text-body-regular text-error-600">{errors.contact.alternatePhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Accounts Section */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-xl">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h4 className="text-md font-semibold text-slate-900">Bank Accounts</h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openBankForm()}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </Button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No bank accounts added yet</p>
                  <p className="text-body-regular">Add at least one account for refund processing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">
                              {account.bankName}
                            </span>
                            {account.isPrimary && (
                              <span className="px-2 py-1 text-body-small bg-blue-100 text-blue-800 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-body-regular text-slate-600">
                            {account.accountNumber} • {account.ifscCode}
                          </div>
                          <div className="text-body-regular text-slate-500">
                            {account.accountType}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!account.isPrimary && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPrimaryAccount(account.id)}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openBankForm(account)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBankAccount(account.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {errors.bankAccounts && (
                <p className="mt-2 text-body-regular text-error-600">{errors.bankAccounts.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid}
              >
                Save & Continue
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Bank Account Form Modal */}
      {showBankForm && (
        <BankAccountForm
          account={editingAccount}
          onSave={editingAccount ? updateBankAccount : addBankAccount}
          onCancel={() => {
            setShowBankForm(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
};

// Bank Account Form Component
const BankAccountForm = ({ account, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    accountNumber: account?.accountNumber || '',
    ifscCode: account?.ifscCode || '',
    bankName: account?.bankName || '',
    accountType: account?.accountType || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">
          {account ? 'Edit Bank Account' : 'Add Bank Account'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter bank name"
              required
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              value={formData.ifscCode}
              onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="SBIN0001234"
              maxLength="11"
              required
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Account Type *
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => handleChange('accountType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            >
              <option value="">Select account type</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="salary">Salary</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {account ? 'Update' : 'Add'} Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
