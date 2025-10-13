import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';

const FinalActions = ({ filingData, taxCalculation, onFileITR, onAIRefresh }) => {
  const [isAIRunning, setIsAIRunning] = useState(false);
  const [aiResults, setAIResults] = useState(null);

  const handleAIRefresh = async () => {
    setIsAIRunning(true);
    setAIResults(null);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock AI results
      setAIResults({
        issues: [
          {
            type: 'warning',
            section: 'deductions',
            message: 'You can save ₹6,000 more by maximizing your 80C investments',
            priority: 'high'
          },
          {
            type: 'info',
            section: 'income',
            message: 'All income sources are properly documented',
            priority: 'low'
          }
        ],
        suggestions: [
          {
            type: 'optimization',
            message: 'Consider investing in ELSS funds for better returns',
            estimatedSavings: 6000
          }
        ],
        score: 85
      });
    } catch (error) {
      console.error('AI review failed:', error);
    } finally {
      setIsAIRunning(false);
    }
  };

  const canFile = filingData && taxCalculation && !taxCalculation.taxDue;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ready to File?</h3>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">Secure & Encrypted</span>
        </div>
      </div>

      {/* AI Review Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-md font-medium text-gray-900">AI Final Review</span>
          </div>
          <button
            onClick={handleAIRefresh}
            disabled={isAIRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAIRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                <span>Run AI Review</span>
              </>
            )}
          </button>
        </div>

        {/* AI Results */}
        {aiResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">AI Review Complete</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700">Score:</span>
                <span className="text-lg font-bold text-blue-600">{aiResults.score}%</span>
              </div>
            </div>

            {/* Issues */}
            {aiResults.issues.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Issues Found:</h4>
                <div className="space-y-2">
                  {aiResults.issues.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      {issue.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-sm text-blue-800">{issue.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {aiResults.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Suggestions:</h4>
                <div className="space-y-2">
                  {aiResults.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800">{suggestion.message}</p>
                        {suggestion.estimatedSavings && (
                          <p className="text-xs text-blue-600">
                            Estimated savings: ₹{suggestion.estimatedSavings.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Filing Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {canFile ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            )}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {canFile ? 'Ready to File' : 'Review Required'}
              </h4>
              <p className="text-sm text-gray-600">
                {canFile 
                  ? 'All sections are complete and validated'
                  : 'Please complete all required sections before filing'
                }
              </p>
            </div>
          </div>
          
          {taxCalculation && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Final Amount</p>
              <p className={`text-lg font-bold ${
                taxCalculation.refund > 0 ? 'text-green-600' : 
                taxCalculation.taxDue > 0 ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {taxCalculation.refund > 0 ? `₹${taxCalculation.refund.toLocaleString()} Refund` :
                 taxCalculation.taxDue > 0 ? `₹${taxCalculation.taxDue.toLocaleString()} Due` :
                 '₹0 Due'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Estimated processing time: 2-3 business days</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Save & Continue Later
          </button>
          
          <button
            onClick={onFileITR}
            disabled={!canFile}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Proceed to E-Verify & File</span>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important:</p>
            <p>
              Please review all information carefully before filing. Once submitted, 
              changes can only be made through a revised return. Ensure all documents 
              are accurate and complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalActions;
