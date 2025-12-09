// =====================================================
// FEATURE REQUEST PAGE
// Request new features
// =====================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FeatureRequest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    useCase: '',
    category: 'filing',
    priority: 'medium',
  });

  const categories = [
    { id: 'filing', name: 'ITR Filing' },
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'documents', name: 'Documents' },
    { id: 'tax-optimization', name: 'Tax Optimization' },
    { id: 'mobile-app', name: 'Mobile App' },
    { id: 'other', name: 'Other' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to submit feature request
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Feature request submitted! Thank you for your feedback.');
      navigate('/help');
    } catch (error) {
      toast.error('Failed to submit feature request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="h-8 w-8 text-yellow-600" />
            <h1 className="text-heading-2xl text-gray-900">Request a Feature</h1>
          </div>
          <p className="text-body-md text-gray-600">
            Have an idea for a new feature? We'd love to hear it!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-label-md text-gray-700 mb-1">
              Feature Title <span className="text-error-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief name for the feature"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-label-md text-gray-700 mb-1">
              Description <span className="text-error-600">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              required
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the feature in detail. What would it do? How would it work?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Use Case */}
          <div>
            <label htmlFor="useCase" className="block text-label-md text-gray-700 mb-1">
              Use Case
            </label>
            <textarea
              id="useCase"
              rows={4}
              value={formData.useCase}
              onChange={(e) => handleInputChange('useCase', e.target.value)}
              placeholder="How would you use this feature? What problem would it solve?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-label-md text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-label-md text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              >
                <option value="low">Low - Nice to have</option>
                <option value="medium">Medium - Would be helpful</option>
                <option value="high">High - Really need this</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-heading-sm text-info-900 mb-1">Thank you for your feedback!</h3>
                <p className="text-body-sm text-info-700">
                  We review all feature requests and consider them for future updates. While we can't guarantee implementation, your input helps us prioritize what to build next.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <Link
              to="/help"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Feature Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeatureRequest;

