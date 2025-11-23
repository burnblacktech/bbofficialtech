// =====================================================
// ACCEPT INVITE COMPONENT
// Handles invite acceptance for CA roles
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services';
import { toast } from 'react-hot-toast';
import {
  UserPlus,
  Building,
  Mail,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {} = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchInviteDetails();
    } else {
      toast.error('Invalid invite link');
      navigate('/login');
    }
  }, [token, fetchInviteDetails, navigate]);

  const fetchInviteDetails = async () => {
    try {
      const response = await apiClient.get(`/invites/accept/${token}`);
      if (response.data.success) {
        setInvite(response.data.invite);
        setFormData((prev) => ({
          ...prev,
          fullName: response.data.invite.metadata?.firmName || '',
        }));
      } else {
        toast.error('Invalid or expired invite');
        navigate('/login');
      }
    } catch (error) {
      toast.error('Failed to load invite details');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      // Accept invite
      const response = await apiClient.post(`/invites/accept/${token}`, {
        fullName: formData.fullName,
        password: formData.password,
        phone: formData.phone,
      });

      if (response.data.success) {
        toast.success('Account created successfully! Please login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invite
          </h1>
          <p className="text-gray-600 mb-6">
            This invite link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'CA_FIRM_ADMIN':
        return 'CA Firm Admin';
      case 'CA':
        return 'CA Staff';
      default:
        return role;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'CA_FIRM_ADMIN':
        return 'Manage your firm, staff, and clients on the BurnBlack platform';
      case 'CA':
        return 'Assist clients with their ITR filings and tax compliance';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accept Invitation
            </h1>
            <p className="text-gray-600">
              You've been invited to join as {getRoleDisplayName(invite.role)}
            </p>
          </div>

          {/* Invite Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <Mail className="w-5 h-5 text-gray-500 mr-3" />
              <span className="text-sm text-gray-600">Invited Email:</span>
            </div>
            <p className="text-lg font-medium text-gray-900 ml-8">
              {invite.email}
            </p>

            {invite.metadata?.firmName && (
              <div className="flex items-center mt-3">
                <Building className="w-5 h-5 text-gray-500 mr-3" />
                <span className="text-sm text-gray-600">Firm:</span>
                <span className="text-lg font-medium text-gray-900 ml-2">
                  {invite.metadata.firmName}
                </span>
              </div>
            )}
          </div>

          {/* Role Description */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              {getRoleDisplayName(invite.role)} Responsibilities:
            </h3>
            <p className="text-sm text-blue-800">
              {getRoleDescription(invite.role)}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Accept Invitation
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By accepting this invitation, you agree to our Terms of Service
              and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
