// =====================================================
// FORM 16 UPLOAD COMPONENT
// Game-changing auto-extraction feature
// Direct competitive advantage over ClearTax/ComputeTax
// =====================================================

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { form16ExtractionService } from '../../../services';
import { Card, Button, Alert, Progress } from '../../DesignSystem';

const Form16Upload = ({ onExtractionComplete, onAutoPopulate, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const instructions = form16ExtractionService.getUploadInstructions();

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((files) => {
    if (files && files[0]) {
      const file = files[0];
      const validation = form16ExtractionService.validateForm16File(file);

      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      handleFileUpload(file);
    }
  }, []);

  /**
   * Handle file upload and extraction
   */
  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    setExtractedData(null);

    try {
      // Simulate upload progress
      simulateProgress(setUploadProgress, 2000);

      // Extract data from Form 16
      setIsExtracting(true);
      setExtractionProgress(20);

      const result = await form16ExtractionService.extractForm16Data(file);
      setExtractionProgress(80);

      if (result.success) {
        setExtractedData(result.data);
        setExtractionProgress(100);

        // Auto-populate form if callback provided
        if (onAutoPopulate) {
          setTimeout(() => {
            onAutoPopulate(result.data);
          }, 1000);
        }

        // Notify parent component
        if (onExtractionComplete) {
          onExtractionComplete(result);
        }
      }

    } catch (err) {
      console.error('Form16 extraction error:', err);
      setError(err.message || 'Failed to extract Form 16 data');
    } finally {
      setIsUploading(false);
      setIsExtracting(false);
      setTimeout(() => {
        setUploadProgress(0);
        setExtractionProgress(0);
      }, 2000);
    }
  };

  /**
   * Simulate progress for better UX
   */
  const simulateProgress = (setProgress, duration) => {
    const steps = 20;
    const stepDuration = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += 100 / steps;
      setProgress(Math.min(current, 95));

      if (current >= 95) {
        clearInterval(interval);
      }
    }, stepDuration);
  };

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  /**
   * Trigger file selection
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Upload Section */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Form 16 for Auto-Fill
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Automatically extract all your income and tax details from Form 16.
            No more manual data entry!
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!isUploading ? triggerFileSelect : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={instructions.acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium text-blue-600">
                {isExtracting ? 'Extracting data...' : 'Uploading file...'}
              </p>

              {/* Upload Progress */}
              {uploadProgress > 0 && !isExtracting && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              )}

              {/* Extraction Progress */}
              {extractionProgress > 0 && isExtracting && (
                <div className="space-y-2">
                  <Progress value={extractionProgress} className="h-2" />
                  <p className="text-xs text-gray-500">{extractionProgress}%</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  {instructions.acceptedFormats.join(', ')} up to {instructions.maxFileSize}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={triggerFileSelect}>
                Select Form 16
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4">
            <Alert
              type="error"
              message={error}
              dismissible={true}
              onDismiss={() => setError(null)}
            />
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">📋 How It Works</h4>
        <div className="space-y-3">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-sm text-blue-800">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h5 className="font-medium text-blue-900 mb-2">💡 Pro Tips:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            {instructions.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Extracted Data Preview */}
      {extractedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-green-900">
                  ✅ Form 16 Data Extracted Successfully!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Confidence: {extractedData.validation?.isValid ? 'High' : 'Medium'} ({extractedData.confidence}%)
                </p>
              </div>
            </div>

            {/* Employer Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <h5 className="font-medium text-green-900">Employer Information</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Name:</span>
                    <span className="font-medium text-green-900">{extractedData.employer.name || 'Not found'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">PAN:</span>
                    <span className="font-medium text-green-900">{extractedData.employer.pan || 'Not found'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">TAN:</span>
                    <span className="font-medium text-green-900">{extractedData.employer.tan || 'Not found'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-green-900">Employee Information</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Name:</span>
                    <span className="font-medium text-green-900">{extractedData.employee.name || 'Not found'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">PAN:</span>
                    <span className="font-medium text-green-900">{extractedData.employee.pan || 'Not found'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Designation:</span>
                    <span className="font-medium text-green-900">{extractedData.employee.designation || 'Not found'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-4">
              <h5 className="font-medium text-green-900">Financial Summary</h5>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Gross Salary:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.salary.gross || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Basic Salary:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.salary.basic || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">HRA:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.salary.hra || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Tax Payable:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.tax.totalTax || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">TDS:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.tax.tds || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Section 80C:</span>
                    <span className="font-medium text-green-900">
                      ₹{(extractedData.tax.deduction80C || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAutoPopulate && onAutoPopulate(extractedData)}
                className="flex-1"
              >
                Auto-Populate Form
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtractedData(null)}
                className="flex-1"
              >
                Upload Another Form 16
              </Button>
            </div>

            {/* Warnings */}
            {extractedData.validation?.warnings && extractedData.validation.warnings.length > 0 && (
              <div className="mt-4">
                <Alert
                  type="warning"
                  message="Please review the extracted data"
                  submessage={extractedData.validation.warnings.join(', ')}
                  dismissible={true}
                />
              </div>
            )}

            {/* Validation Errors */}
            {extractedData.validation?.errors && extractedData.validation.errors.length > 0 && (
              <div className="mt-4">
                <Alert
                  type="error"
                  message="Some data could not be extracted"
                  submessage={extractedData.validation.errors.join(', ')}
                  dismissible={true}
                />
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Form16Upload;