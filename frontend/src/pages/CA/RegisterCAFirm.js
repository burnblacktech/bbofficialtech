// =====================================================
// INDEPENDENT CA REGISTRATION PORTAL
// Self-onboarding for independent CA practices
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Loader,
  ArrowRight,
  ArrowLeft,
  Shield,
  Star,
  Clock,
  Users,
  DollarSign,
} from 'lucide-react';
import { Button, Card, Alert } from '../../components/UI';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RegisterCAFirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    firmName: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Firm Details
    firmType: 'PROPRIETORSHIP', // PROPRIETORSHIP, PARTNERSHIP, LLP, COMPANY
    registrationNumber: '',
    yearsOfExperience: '',
    panNumber: '',
    gstNumber: '',

    // Address
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },

    // Professional Details
    caMembershipNumber: '',
    numberOfCAs: 1,
    numberOfStaff: 0,
    expectedClients: '',

    // Subscription
    selectedPlan: 'STARTER', // STARTER, PROFESSIONAL, ENTERPRISE
    billingCycle: 'MONTHLY', // MONTHLY, YEARLY

    // Documents
    documents: {
      caCertificate: null,
      panCard: null,
      addressProof: null,
      gstCertificate: null,
    },

    // Agreement
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available subscription plans
  const subscriptionPlans = [
    {
      id: 'STARTER',
      name: 'Starter',
      price: 999,
      features: ['Up to 50 clients', 'Basic ITR forms', 'Email support', '5GB storage'],
      popular: false,
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 2499,
      features: ['Up to 200 clients', 'All ITR forms', 'Priority support', '50GB storage', 'Staff management', 'Advanced analytics'],
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 5999,
      features: ['Unlimited clients', 'All features', '24/7 phone support', 'Unlimited storage', 'Custom branding', 'API access'],
      popular: false,
    },
  ];

  // Validation rules
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.firmName.trim()) newErrors.firmName = 'Firm name is required';
        if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;

      case 2: // Firm Details
        if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
        if (!formData.yearsOfExperience || formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Valid experience is required';
        if (!formData.panNumber.trim()) newErrors.panNumber = 'PAN number is required';
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) newErrors.panNumber = 'Invalid PAN format';
        if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
          newErrors.gstNumber = 'Invalid GST format';
        }
        break;

      case 3: // Address
        if (!formData.address.line1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state.trim()) newErrors.state = 'State is required';
        if (!formData.address.pincode.trim()) newErrors.pincode = 'Pincode is required';
        else if (!/^[1-9][0-9]{5}$/.test(formData.address.pincode)) newErrors.pincode = 'Invalid pincode';
        break;

      case 4: // Professional Details
        if (!formData.caMembershipNumber.trim()) newErrors.caMembershipNumber = 'CA membership number is required';
        if (!formData.numberOfCAs || formData.numberOfCAs < 1) newErrors.numberOfCAs = 'At least 1 CA is required';
        if (!formData.expectedClients) newErrors.expectedClients = 'Expected client range is required';
        break;

      case 5: // Documents
        if (!formData.documents.caCertificate) newErrors.caCertificate = 'CA certificate is required';
        if (!formData.documents.panCard) newErrors.panCard = 'PAN card is required';
        break;

      case 6: // Agreement
        if (!formData.termsAccepted) newErrors.terms = 'Terms and conditions must be accepted';
        if (!formData.privacyAccepted) newErrors.privacy = 'Privacy policy must be accepted';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = async (documentType, file) => {
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG and PDF files are allowed');
        return;
      }

      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

      // Simulate file upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const progress = prev[documentType] || 0;
          if (progress >= 100) {
            clearInterval(interval);
            return { ...prev, [documentType]: 100 };
          }
          return { ...prev, [documentType]: progress + 10 };
        });
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
        setFormData(prev => ({
          ...prev,
          documents: { ...prev.documents, [documentType]: file },
        }));
        toast.success(`${documentType.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully`);
      }, 1000);
    }
  };

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(data).forEach(key => {
        if (key === 'address') {
          Object.keys(data[key]).forEach(addressKey => {
            formDataToSend.append(`address[${addressKey}]`, data[key][addressKey]);
          });
        } else if (key === 'documents') {
          Object.keys(data[key]).forEach(docKey => {
            if (data[key][docKey]) {
              formDataToSend.append(`documents[${docKey}]`, data[key][docKey]);
            }
          });
        } else if (key !== 'confirmPassword') {
          formDataToSend.append(key, data[key]);
        }
      });

      const response = await api.post('/api/ca/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Registration submitted successfully! We will review your application within 24-48 hours.');
      navigate('/ca/registration-success', {
        state: {
          applicationId: data.applicationId,
          estimatedReviewTime: '24-48 hours',
        },
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    },
  });

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  // Handle final submission
  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      registrationMutation.mutate(formData);
    }
  };

  // Calculate pricing
  const calculatePrice = () => {
    const plan = subscriptionPlans.find(p => p.id === formData.selectedPlan);
    const basePrice = plan?.price || 0;
    const yearlyDiscount = 0.1; // 10% discount for yearly billing
    const multiplier = formData.billingCycle === 'YEARLY' ? 12 * (1 - yearlyDiscount) : 1;
    return basePrice * multiplier;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name *</label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your firm name"
                />
                {errors.firmName && <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact person name"
                />
                {errors.contactPerson && <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="firm@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Firm Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firm Type *</label>
                <select
                  value={formData.firmType}
                  onChange={(e) => setFormData(prev => ({ ...prev, firmType: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PROPRIETORSHIP">Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="COMPANY">Private Limited Company</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
                {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                    min="0"
                    max="100"
                  />
                  {errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    value={formData.panNumber.toUpperCase()}
                    onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber.toUpperCase()}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="22AAAAA0000A1ZV"
                  maxLength={15}
                />
                {errors.gstNumber && <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>}
              </div>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Office Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.address.line1}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Building name, street"
                />
                {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.address.line2}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Area, locality"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value },
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mumbai"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value },
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maharashtra"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, pincode: e.target.value },
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="400001"
                    maxLength={6}
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value },
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="India"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 4:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Professional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CA Membership Number *</label>
                <input
                  type="text"
                  value={formData.caMembershipNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, caMembershipNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter ICAI membership number"
                />
                {errors.caMembershipNumber && <p className="text-red-500 text-sm mt-1">{errors.caMembershipNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of CAs *</label>
                  <input
                    type="number"
                    value={formData.numberOfCAs}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfCAs: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                  />
                  {errors.numberOfCAs && <p className="text-red-500 text-sm mt-1">{errors.numberOfCAs}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Staff</label>
                  <input
                    type="number"
                    value={formData.numberOfStaff}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfStaff: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Client Range *</label>
                <select
                  value={formData.expectedClients}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedClients: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select client range</option>
                  <option value="0-50">0-50 clients</option>
                  <option value="51-100">51-100 clients</option>
                  <option value="101-250">101-250 clients</option>
                  <option value="251-500">251-500 clients</option>
                  <option value="500+">500+ clients</option>
                </select>
                {errors.expectedClients && <p className="text-red-500 text-sm mt-1">{errors.expectedClients}</p>}
              </div>
            </div>
          </Card>
        );

      case 5:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Document Upload</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Document Requirements</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Upload clear, legible copies of the following documents. Files must be JPG, PNG or PDF format and should not exceed 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {Object.entries(formData.documents).map(([docType, file]) => (
                <div key={docType}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {docType.replace(/([A-Z])/g, ' $1').trim()} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    {file ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-green-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            documents: { ...prev.documents, [docType]: null },
                          }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Upload Document
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF (max 5MB)</p>
                      </div>
                    )}
                    {uploadProgress[docType] !== undefined && uploadProgress[docType] < 100 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[docType]}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{uploadProgress[docType]}% uploaded</p>
                      </div>
                    )}
                  </div>
                  {errors[docType] && <p className="text-red-500 text-sm mt-1">{errors[docType]}</p>}
                </div>
              ))}
            </div>
          </Card>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Subscription Plan</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">MOST POPULAR</span>
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">₹{plan.price}</span>
                        <span className="text-gray-500">/{formData.billingCycle === 'YEARLY' ? 'mo' : 'mo'}</span>
                      </div>
                      {formData.billingCycle === 'YEARLY' && (
                        <p className="text-sm text-green-600 mt-1">Save 10% with yearly billing</p>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'MONTHLY' }))}
                  className={`px-6 py-2 rounded-lg ${
                    formData.billingCycle === 'MONTHLY'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'YEARLY' }))}
                  className={`px-6 py-2 rounded-lg ${
                    formData.billingCycle === 'YEARLY'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Yearly (Save 10%)
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Terms & Conditions</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                    I have read and agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and <a href="#" className="text-blue-600 hover:underline">Service Agreement</a>
                  </label>
                </div>
                {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms}</p>}

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-700 cursor-pointer">
                    I have read and agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and consent to the processing of my personal data
                  </label>
                </div>
                {errors.privacy && <p className="text-red-500 text-sm mt-1">{errors.privacy}</p>}
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Monthly Cost:</span>
                  <span className="text-xl font-bold text-blue-600">₹{calculatePrice()}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {formData.billingCycle === 'YEARLY'
                    ? `Yearly billing: ₹${calculatePrice() * 12} (save ₹${Math.round(calculatePrice() * 12 * 0.1)})`
                    : 'Monthly billing'
                  }
                </p>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Register Your CA Practice</h1>
                <p className="text-sm text-gray-500">Join our platform and grow your practice</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <div
                  className={`h-1 w-16 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Firm Details</span>
            <span>Address</span>
            <span>Professional Info</span>
            <span>Documents</span>
            <span>Complete</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderStep()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          )}
        </div>
      </main>

      {/* Trust Indicators */}
      <div className="bg-blue-50 border-t">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold">Secure Platform</h3>
              <p className="text-sm text-gray-600">Bank-level security for your data</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold">1000+ CA Firms</h3>
              <p className="text-sm text-gray-600">Trust our platform for their practice</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Star className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold">4.9/5 Rating</h3>
              <p className="text-sm text-gray-600">Highest rated in the industry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCAFirm;
