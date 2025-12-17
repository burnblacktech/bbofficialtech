// =====================================================
// REPORT BUG PAGE
// Report bugs and issues
// =====================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, ArrowLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportBug = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    severity: 'medium',
    browser: '',
    device: '',
    attachments: [],
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to submit bug report
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Bug report submitted successfully! We\'ll investigate and get back to you.');
      navigate('/help');
    } catch (error) {
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Bug className="h-8 w-8 text-error-600" />
            <h1 className="text-heading-2xl text-slate-900">Report a Bug</h1>
          </div>
          <p className="text-body-md text-slate-600">
            Help us improve by reporting bugs and issues you encounter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-label-md text-slate-700 mb-1">
              Bug Title <span className="text-error-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of the bug"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-label-md text-slate-700 mb-1">
              Description <span className="text-error-600">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              required
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the bug in detail"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label htmlFor="steps" className="block text-label-md text-slate-700 mb-1">
              Steps to Reproduce
            </label>
            <textarea
              id="steps"
              rows={4}
              value={formData.steps}
              onChange={(e) => handleInputChange('steps', e.target.value)}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expected" className="block text-label-md text-slate-700 mb-1">
                Expected Behavior
              </label>
              <textarea
                id="expected"
                rows={3}
                value={formData.expected}
                onChange={(e) => handleInputChange('expected', e.target.value)}
                placeholder="What should happen"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
            <div>
              <label htmlFor="actual" className="block text-label-md text-slate-700 mb-1">
                Actual Behavior
              </label>
              <textarea
                id="actual"
                rows={3}
                value={formData.actual}
                onChange={(e) => handleInputChange('actual', e.target.value)}
                placeholder="What actually happens"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label htmlFor="severity" className="block text-label-md text-slate-700 mb-1">
              Severity
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) => handleInputChange('severity', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="low">Low - Minor issue, doesn't affect functionality</option>
              <option value="medium">Medium - Affects some functionality</option>
              <option value="high">High - Major issue, affects core functionality</option>
              <option value="critical">Critical - System crash or data loss</option>
            </select>
          </div>

          {/* Browser & Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="browser" className="block text-label-md text-slate-700 mb-1">
                Browser
              </label>
              <input
                id="browser"
                type="text"
                value={formData.browser}
                onChange={(e) => handleInputChange('browser', e.target.value)}
                placeholder="e.g., Chrome 120, Safari 17"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
            <div>
              <label htmlFor="device" className="block text-label-md text-slate-700 mb-1">
                Device
              </label>
              <input
                id="device"
                type="text"
                value={formData.device}
                onChange={(e) => handleInputChange('device', e.target.value)}
                placeholder="e.g., Windows 11, iPhone 14"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-label-md text-slate-700 mb-1">
              Screenshots or Files
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-gold-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-body-sm text-slate-600">
                  <label className="relative cursor-pointer rounded-xl font-medium text-gold-600 hover:text-gold-500">
                    <span>Upload files</span>
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-body-small text-slate-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-body-sm text-slate-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-error-600 hover:text-error-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <Link
              to="/help"
              className="flex-1 py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Bug Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportBug;

