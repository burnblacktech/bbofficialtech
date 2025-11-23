// =====================================================
// =====================================================
// BANK STATEMENT UPLOAD COMPONENT
// Auto-categorization and tax-relevant transaction detection
// Another game-changing feature for competitive advantage
// =====================================================

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { bankStatementService } from '../../../services';
import { Card, Button, Alert, Progress, Select } from '../../DesignSystem';

const BankStatementUpload = ({ onAnalysisComplete, onAutoPopulate, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const supportedBanks = [
    { value: '', label: 'Select Bank' },
    { value: 'SBI', label: 'State Bank of India' },
    { value: 'HDFC', label: 'HDFC Bank' },
    { value: 'ICICI', label: 'ICICI Bank' },
    { value: 'Axis', label: 'Axis Bank' },
    { value: 'Kotak', label: 'Kotak Mahindra Bank' },
    { value: 'PNB', label: 'Punjab National Bank' },
    { value: 'Canara', label: 'Canara Bank' },
    { value: 'Bank of Baroda', label: 'Bank of Baroda' },
    { value: 'Union Bank', label: 'Union Bank of India' },
    { value: 'Indian Bank', label: 'Indian Bank' },
    { value: 'Other', label: 'Other' }
  ];

  const instructions = bankStatementService.getUploadInstructions();

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((files) => {
    if (files && files[0]) {
      const file = files[0];
      const validation = bankStatementService.validateBankStatementFile(file);

      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      if (!selectedBank) {
        setError('Please select your bank for better analysis');
        return;
      }

      handleFileUpload(file);
    }
  }, [selectedBank]);

  /**
   * Handle file upload and analysis
   */
  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    setAnalysisData(null);

    try {
      // Simulate upload progress
      simulateProgress(setUploadProgress, 2000);

      // Parse bank statement
      setIsAnalyzing(true);
      setAnalysisProgress(20);

      const result = await bankStatementService.parseBankStatement(file, selectedBank);
      setAnalysisProgress(80);

      if (result.success) {
        setAnalysisData(result.data);
        setAnalysisProgress(100);

        // Auto-populate form if callback provided
        if (onAutoPopulate) {
          setTimeout(() => {
            onAutoPopulate(result.data);
          }, 1000);
        }

        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      }

    } catch (err) {
      console.error('Bank statement analysis error:', err);
      setError(err.message || 'Failed to analyze bank statement');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setTimeout(() => {
        setUploadProgress(0);
        setAnalysisProgress(0);
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

  /**
   * Format currency amount
   */
  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (category) => {
    const icons = {
      salary: '💼',
      interest: '🏦',
      tds: '📄',
      investment: '📈',
      rent: '🏠',
      professional: '💻',
      other: '💰'
    };
    return icons[category] || '💰';
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Bank Statement for Auto-Analysis
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Automatically categorize transactions and identify tax-relevant entries like interest income, TDS, investments, etc.
          </p>
        </div>

        {/* Bank Selection */}
        <div className="max-w-md mx-auto mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Bank
          </label>
          <Select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            options={supportedBanks}
            disabled={isUploading}
            className="w-full"
          />
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-green-500 bg-green-50'
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
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium text-green-600">
                {isAnalyzing ? 'Analyzing transactions...' : 'Uploading file...'}
              </p>

              {/* Upload Progress */}
              {uploadProgress > 0 && !isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              )}

              {/* Analysis Progress */}
              {analysisProgress > 0 && isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={analysisProgress} className="h-2" />
                  <p className="text-xs text-gray-500">{analysisProgress}%</p>
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
                Select Bank Statement
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

      {/* Supported Banks */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h4 className="text-lg font-semibold text-green-900 mb-4">🏦 Supported Banks</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {instructions.supportedBanks.slice(0, 10).map((bank) => (
            <div key={bank} className="text-sm text-green-800 font-medium">
              ✓ {bank}
            </div>
          ))}
        </div>
        <p className="text-sm text-green-700 mt-3">
          Plus many more! If your bank isn't listed, select "Other" and we'll still analyze your statement.
        </p>
      </Card>

      {/* Analysis Results */}
      {analysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Summary Card */}
          <Card className="p-6 bg-green-50 border-green-200 mb-6">
            <h4 className="text-lg font-semibold text-green-900 mb-4">
              ✅ Bank Statement Analysis Complete!
            </h4>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {analysisData.summary.totalTransactions}
                </div>
                <div className="text-sm text-green-700">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(analysisData.summary.totalCredits)}
                </div>
                <div className="text-sm text-green-700">Total Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(analysisData.summary.taxRelevantAmount)}
                </div>
                <div className="text-sm text-green-700">Tax-Relevant Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {analysisData.insights?.length || 0}
                </div>
                <div className="text-sm text-green-700">Tax Insights Found</div>
              </div>
            </div>
          </Card>

          {/* Tax Insights */}
          {analysisData.insights && analysisData.insights.length > 0 && (
            <Card className="p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Tax Insights Found</h4>
              <div className="space-y-3">
                {analysisData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : insight.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {insight.type === 'salary' && '💼'}
                        {insight.type === 'interest' && '🏦'}
                        {insight.type === 'tds' && '📄'}
                        {insight.type === 'investment' && '📈'}
                        {insight.type === 'rent' && '🏠'}
                        {insight.type === 'professional' && '💻'}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{insight.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <p className="text-sm font-medium text-gray-700 mt-2">
                          Action: {insight.action}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : insight.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.priority.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Transaction Categories</h4>
            <div className="space-y-3">
              {Object.entries(analysisData.summary.categories || {})
                .filter(([_, category]) => category.count > 0)
                .map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCategoryIcon(category)}</div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{category}</div>
                        <div className="text-sm text-gray-600">{data.count} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(data.totalAmount)}</div>
                      <div className="text-sm text-gray-600">{data.percentage?.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Tax Implications */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">💰 Tax Implications</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Taxable Income Sources</h5>
                {Object.entries(analysisData.taxImplications.taxableIncome).map(([source, amount]) => (
                  amount > 0 && (
                    <div key={source} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{source}:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                  )
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span className="text-gray-900">Total Taxable Income:</span>
                  <span className="text-green-600">{formatCurrency(analysisData.taxImplications.taxableIncome.total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Tax Credits & Deductions</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TDS:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(analysisData.taxImplications.taxCredits.tds)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Investments:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(analysisData.taxImplications.deductions.investment)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span className="text-gray-900">Total Tax Credit:</span>
                  <span className="text-green-600">{formatCurrency(analysisData.taxImplications.taxCredits.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAutoPopulate && onAutoPopulate(analysisData)}
              className="flex-1"
            >
              Add to ITR Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnalysisData(null)}
              className="flex-1"
            >
              Analyze Another Statement
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BankStatementUpload;