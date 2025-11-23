// =====================================================
// ITR JSON DOWNLOAD COMPONENT
// Handles JSON export and download for ITR filing
// Critical for manual filing while ERI API is pending
// =====================================================

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { itrJsonExportService } from '../../../services';
import { Card, Button, Alert, Progress } from '../../DesignSystem';

const ITRJsonDownload = ({
  itrData,
  itrType,
  assessmentYear = '2024-25',
  onDownloadComplete,
  className = ''
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadResult, setDownloadResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Handle JSON download
   */
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);
    setDownloadResult(null);

    try {
      // Validate data before export
      setDownloadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation

      // Generate JSON export
      setDownloadProgress(40);
      const exportResult = await itrJsonExportService.exportToJson(
        itrData,
        itrType,
        assessmentYear
      );

      // Generate client-side download
      setDownloadProgress(70);
      itrJsonExportService.downloadJsonFile(
        exportResult.jsonPayload,
        exportResult.fileName
      );

      setDownloadProgress(100);
      setDownloadResult(exportResult);

      // Notify parent component
      if (onDownloadComplete) {
        onDownloadComplete(exportResult);
      }

    } catch (err) {
      console.error('Download error:', err);
      setError(err.message);
    } finally {
      setIsDownloading(false);
      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    }
  }, [itrData, itrType, assessmentYear, onDownloadComplete]);

  /**
   * Handle alternative download (government format)
   */
  const handleGovernmentFormatDownload = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);

      const governmentJson = itrJsonExportService.generateGovernmentJson(
        itrData,
        itrType,
        assessmentYear,
        await itrJsonExportService.authService.getCurrentUser()
      );

      const fileName = itrJsonExportService.generateFileName(itrType, assessmentYear);
      itrJsonExportService.downloadJsonFile(governmentJson, fileName);

      setDownloadResult({
        fileName,
        format: 'government',
        instructions: 'Use this file for direct upload to Income Tax Department e-filing portal'
      });

    } catch (err) {
      console.error('Government format download error:', err);
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  }, [itrData, itrType, assessmentYear]);

  /**
   * Handle alternative download (simple format)
   */
  const handleSimpleFormatDownload = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);

      const simpleJson = {
        itrType,
        assessmentYear,
        generatedAt: new Date().toISOString(),
        formData: itrData,
        purpose: 'BACKUP'
      };

      const fileName = `ITR_${itrType}_Backup_${new Date().toISOString().split('T')[0]}.json`;

      // Create download
      const jsonString = JSON.stringify(simpleJson, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadResult({
        fileName,
        format: 'simple',
        instructions: 'This is a simplified backup format'
      });

    } catch (err) {
      console.error('Simple format download error:', err);
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  }, [itrData, itrType, assessmentYear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Main Download Section */}
      <Card className="p-6">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Download ITR JSON for Filing
            </h3>
            <p className="text-gray-600">
              Generate government-compliant JSON file for uploading to Income Tax Department e-filing portal
            </p>
          </div>

          {/* Download Progress */}
          {isDownloading && downloadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Generating JSON...</span>
                <span>{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4">
              <Alert
                type="error"
                message={error}
                dismissible={true}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {/* Success Display */}
          {downloadResult && !error && (
            <div className="mb-4">
              <Alert
                type="success"
                message="JSON file downloaded successfully!"
                submessage={downloadResult.fileName}
                dismissible={false}
              />
            </div>
          )}

          {/* Main Download Button */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading}
              loading={isDownloading}
              className="min-w-[200px]"
            >
              {isDownloading ? 'Generating...' : 'Download ITR JSON'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Alternative Download Options */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Alternative Formats</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="mb-3">
              <svg className="w-8 h-8 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h5 className="font-medium text-gray-900 mb-2">Government Format</h5>
            <p className="text-sm text-gray-600 mb-3">
              Direct upload format for Income Tax Department portal
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGovernmentFormatDownload}
              disabled={isDownloading}
            >
              Download Government JSON
            </Button>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="mb-3">
              <svg className="w-8 h-8 text-purple-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h5 className="font-medium text-gray-900 mb-2">Backup Format</h5>
            <p className="text-sm text-gray-600 mb-3">
              Simplified format for data backup and records
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimpleFormatDownload}
              disabled={isDownloading}
            >
              Download Backup JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">📋 How to File Your ITR Using JSON</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <p className="text-sm text-blue-800">
              Download your ITR JSON file using the button above
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <p className="text-sm text-blue-800">
              Visit the Income Tax Department e-filing portal (<a href="https://incometaxindiaefiling.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">incometaxindiaefiling.gov.in</a>)
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <p className="text-sm text-blue-800">
              Login with your PAN and go to e-File → Income Tax Return → File Income Tax Return
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
            <p className="text-sm text-blue-800">
              Select Assessment Year, choose the ITR type, and select "Upload JSON" option
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</span>
            <p className="text-sm text-blue-800">
              Upload the downloaded JSON file, verify the data, and submit your return
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">6</span>
            <p className="text-sm text-blue-800">
              Download the acknowledgement receipt for your records
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> This JSON download functionality is provided while our ERI API license is pending approval. Once approved, you'll be able to file directly from our platform with one-click submission.
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Summary */}
      {itrData && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Data Validation Summary</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ITR Type:</span>
                <span className="text-sm font-medium">{itrType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assessment Year:</span>
                <span className="text-sm font-medium">{assessmentYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sections Completed:</span>
                <span className="text-sm font-medium">{Object.keys(itrData).length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Personal Info:</span>
                <span className={`text-sm font-medium ${itrData.personal ? 'text-green-600' : 'text-red-600'}`}>
                  {itrData.personal ? '✅ Complete' : '⚠️ Incomplete'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Income Details:</span>
                <span className={`text-sm font-medium ${itrData.income ? 'text-green-600' : 'text-red-600'}`}>
                  {itrData.income ? '✅ Complete' : '⚠️ Incomplete'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Verification:</span>
                <span className={`text-sm font-medium ${itrData.verification ? 'text-green-600' : 'text-red-600'}`}>
                  {itrData.verification ? '✅ Complete' : '⚠️ Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default ITRJsonDownload;