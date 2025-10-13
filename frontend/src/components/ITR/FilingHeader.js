import React from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Download, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const FilingHeader = ({ 
  filingData, 
  completionPercentage, 
  lastSaved, 
  isSaving, 
  onSave 
}) => {
  const formatLastSaved = (date) => {
    if (!date) return 'Never saved';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (completionPercentage >= 90) return 'text-green-600';
    if (completionPercentage >= 70) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (completionPercentage >= 90) return CheckCircle;
    if (completionPercentage >= 70) return AlertCircle;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Filing Info */}
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ITR Filing - {filingData?.assessmentYear}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                PAN: {filingData?.pan} • Assessment Year: {filingData?.assessmentYear}
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-5 w-5 ${getStatusColor()}`} />
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {completionPercentage}% Complete
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    completionPercentage >= 90 ? 'bg-green-500' :
                    completionPercentage >= 70 ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Save Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Saved {formatLastSaved(lastSaved)}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {completionPercentage < 70 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                Complete all sections to proceed with filing. You're {100 - completionPercentage}% away from completion.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FilingHeader;
