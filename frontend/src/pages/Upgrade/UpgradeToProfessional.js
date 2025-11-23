/**
 * Upgrade to Professional - CA Firm Setup
 * Allows END_USER to upgrade to CA_FIRM_ADMIN role
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Building2, Users, Shield, CheckCircle, ArrowRight,
  Star, Zap, Target, TrendingUp, DollarSign, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';

const UpgradeToProfessional = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firmName: '',
    firmType: 'CA_FIRM',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    website: '',
    description: ''
  });

  const benefits = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Manage multiple clients and their tax filings from one dashboard',
      color: 'text-blue-600'
    },
    {
      icon: Building2,
      title: 'Firm Setup',
      description: 'Create and manage your professional CA firm profile',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Team Collaboration',
      description: 'Invite team members and collaborate on client work',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Advanced Reporting',
      description: 'Get detailed analytics and reports for your practice',
      color: 'text-orange-600'
    },
    {
      icon: DollarSign,
      title: 'Billing Management',
      description: 'Track invoices, payments, and client billing',
      color: 'text-red-600'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: 'Get priority customer support for professional users',
      color: 'text-yellow-600'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.upgradeToProfessional(formData);

      if (response.success) {
        toast.success('Congratulations! You are now a Professional CA! 🎉');
        
        // Update user context
        if (updateUser) {
          updateUser({ 
            ...user, 
            role: 'CA_FIRM_ADMIN',
            firmId: response.firmId 
          });
        }
        
        // Redirect to CA dashboard
        navigate('/firm/dashboard');
      } else {
        toast.error(response.message || 'Failed to upgrade account');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Crown className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade to Professional
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your BurnBlack account into a professional CA firm platform. 
            Manage clients, collaborate with your team, and grow your practice.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Benefits Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Professional Features
              </h2>
              
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                    <div className={`p-2 rounded-lg bg-white ${benefit.color}`}>
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 text-purple-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Free Upgrade</span>
                </div>
                <p className="text-sm text-purple-600 mt-1">
                  No additional charges for upgrading to professional features
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create Your CA Firm
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your firm name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Type
                </label>
                <select
                  name="firmType"
                  value={formData.firmType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="CA_FIRM">Chartered Accountant Firm</option>
                  <option value="TAX_CONSULTANT">Tax Consultant</option>
                  <option value="FINANCIAL_ADVISOR">Financial Advisor</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your firm address"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of your firm and services"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Skip for now
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Upgrading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Upgrade to Professional
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>
            By upgrading, you agree to our Terms of Service and Privacy Policy. 
            You can always downgrade back to personal use if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeToProfessional;
