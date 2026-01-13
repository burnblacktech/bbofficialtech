// =====================================================
// ADMIN ADD USER PAGE
// Enterprise-grade user creation with DesignSystem components
// =====================================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition } from '../../components/DesignSystem/Animations';
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Building2,
  Save,
  CheckCircle,
  Crown,
  Star,
  User,
  ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAddUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    date_of_birth: '',
    gender: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    occupation: '',
    organization: '',
    designation: '',
    role: 'user',
    status: 'pending',
    is_premium: false,
    pan_number: '',
    aadhaar_number: '',
    notes: '',
    send_welcome_email: true,
    require_password_change: true,
  });

  const [errors, setErrors] = useState({});

  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/api/admin/users', userData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['platformUsers']);
      toast.success('User added successfully!');
      navigate(`/admin/users/${data.user_id}`);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to add user';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.role) newErrors.role = 'Role is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.mobile) {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(formData.mobile)) {
        newErrors.mobile = 'Invalid mobile number';
      }
    }

    if (formData.pan_number) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.pan_number)) {
        newErrors.pan_number = 'Invalid PAN format';
      }
    }

    if (formData.aadhaar_number) {
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadhaarRegex.test(formData.aadhaar_number)) {
        newErrors.aadhaar_number = 'Invalid Aadhaar number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await addUserMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-warning-500" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-info-500" />;
      case 'ca_firm_admin':
        return <Building2 className="h-4 w-4 text-success-500" />;
      case 'ca':
      case 'senior_ca':
        return <User className="h-4 w-4 text-secondary-500" />;
      default:
        return <User className="h-4 w-4 text-neutral-500" />;
    }
  };

  const roles = [
    { value: 'user', label: 'User', description: 'Regular platform user' },
    { value: 'guest', label: 'Guest', description: 'Limited access user' },
    { value: 'ca', label: 'CA', description: 'Chartered Accountant' },
    { value: 'senior_ca', label: 'Senior CA', description: 'Senior Chartered Accountant' },
    { value: 'ca_firm_admin', label: 'CA Firm Admin', description: 'CA Firm Administrator' },
    { value: 'platform_admin', label: 'Platform Admin', description: 'Platform Administrator' },
    { value: 'super_admin', label: 'Super Admin', description: 'Super Administrator' },
  ];

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <Typography.H1 className="mb-1">Add New User</Typography.H1>
            <Typography.Small className="text-neutral-500">Create a new user account</Typography.Small>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Full Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <Typography.Small className="text-error-500 mt-1">{errors.name}</Typography.Small>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Email Address <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.email ? 'border-error-500' : 'border-neutral-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <Typography.Small className="text-error-500 mt-1">{errors.email}</Typography.Small>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className={`w-full pl-10 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.mobile ? 'border-error-500' : 'border-neutral-300'
                      }`}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  {errors.mobile && (
                    <Typography.Small className="text-error-500 mt-1">{errors.mobile}</Typography.Small>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full pl-10 border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={formData.address_line_1}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter address line 1"
                  />
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address_line_2}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter address line 2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter occupation"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter organization"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter designation"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Role <span className="text-error-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.value}
                        onClick={() => handleInputChange('role', role.value)}
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                          formData.role === role.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            formData.role === role.value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300'
                          }`}>
                            {formData.role === role.value && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role.value)}
                              <Typography.Small className="font-medium">{role.label}</Typography.Small>
                            </div>
                            <Typography.Small className="text-neutral-500">{role.description}</Typography.Small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-1">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_premium"
                      checked={formData.is_premium}
                      onChange={(e) => handleInputChange('is_premium', e.target.checked)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <label htmlFor="is_premium" className="text-body-regular font-medium text-neutral-700 flex items-center gap-1">
                      <Star className="h-4 w-4 text-secondary-500" />
                      Premium User
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-600" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.pan_number ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                  {errors.pan_number && (
                    <Typography.Small className="text-error-500 mt-1">{errors.pan_number}</Typography.Small>
                  )}
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    value={formData.aadhaar_number}
                    onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.aadhaar_number ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter Aadhaar number"
                    maxLength={12}
                  />
                  {errors.aadhaar_number && (
                    <Typography.Small className="text-error-500 mt-1">{errors.aadhaar_number}</Typography.Small>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-600" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add any additional notes about the user..."
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="send_welcome_email"
                      checked={formData.send_welcome_email}
                      onChange={(e) => handleInputChange('send_welcome_email', e.target.checked)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <label htmlFor="send_welcome_email" className="text-body-regular font-medium text-neutral-700">
                      Send Welcome Email
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="require_password_change"
                      checked={formData.require_password_change}
                      onChange={(e) => handleInputChange('require_password_change', e.target.checked)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <label htmlFor="require_password_change" className="text-body-regular font-medium text-neutral-700">
                      Require Password Change
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Adding User...' : 'Add User'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default AdminAddUser;
