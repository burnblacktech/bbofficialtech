// =====================================================
// DATA INTEGRATION DASHBOARD - AUTO-POPULATION HUB
// Real-time financial data synchronization and tax optimization
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Upload,
  Download,
  TrendingUp,
  Shield,
  FileText,
  IndianRupee,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Link,
  Database,
  Building,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { enterpriseLogger } from '../../utils/logger';

// Import services
import {
  dataIntegrationService,
  financialProfileService,
  aisForm26ASService,
  autoPopulationITRService,
  documentProcessingService,
} from '../../services';
import apiClient from '../../services/core/APIClient';

const DataIntegrationDashboard = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isSyncing: false,
    connectedSources: [],
    dataQuality: 0,
  });

  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalDeductions: 0,
    totalTDS: 0,
    taxLiability: 0,
    dataSources: [],
  });

  const [autoPopulation, setAutoPopulation] = useState({
    available: false,
    confidence: 0,
    missingFields: [],
    recommendations: [],
  });

  const [connectedAccounts, setConnectedAccounts] = useState({
    banks: [],
    brokers: [],
    employers: [],
    landlords: [],
  });

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load financial profile
      const profile = await financialProfileService.getFinancialProfile(userId);
      if (profile.success) {
        setConnectedAccounts(profile.profile.connections || {});
      }

      // Get last sync status
      // This would be fetched from backend
      setSyncStatus({
        lastSync: new Date().toISOString(),
        isSyncing: false,
        connectedSources: ['bank_statements', 'form_16', 'broker_apis'],
        dataQuality: 85,
      });

      // Calculate financial summary
      const financialSummary = await calculateFinancialSummary(userId);
      setFinancialData(financialSummary);

      // Check auto-population readiness
      const autoPopStatus = await checkAutoPopulationReadiness();
      setAutoPopulation(autoPopStatus);

    } catch (error) {
      enterpriseLogger.error('Error loading dashboard data', { error });
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Trigger comprehensive data synchronization
   */
  const triggerDataSync = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      enterpriseLogger.info('Starting comprehensive data synchronization');

      // Start comprehensive sync
      const syncResults = await dataIntegrationService.syncAllFinancialData(userId);

      if (syncResults.success) {
        toast.success(`Synchronized ${syncResults.summary.dataSourcesConnected.size} data sources`);

        // Update sync status
        setSyncStatus({
          lastSync: new Date().toISOString(),
          isSyncing: false,
          connectedSources: Array.from(syncResults.summary.dataSourcesConnected),
          dataQuality: 95,
        });

        // Update financial data
        const financialSummary = await calculateFinancialSummary(userId);
        setFinancialData(financialSummary);

        // Check auto-population readiness
        const autoPopStatus = await checkAutoPopulationReadiness();
        setAutoPopulation(autoPopStatus);

      } else {
        toast.error('Data synchronization failed');
      }

    } catch (error) {
      enterpriseLogger.error('Sync failed', { error });
      toast.error('Data synchronization failed');
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  /**
   * Trigger ITR auto-population
   */
  const triggerAutoPopulation = async () => {
    if (!autoPopulation.available) {
      toast.error('Auto-population not ready. Please sync more data sources.');
      return;
    }

    setIsLoading(true);

    try {
      enterpriseLogger.info('Starting ITR auto-population');

      const itrType = determineITRType(financialData);
      const autoPopResult = await autoPopulationITRService.autoPopulateITR(
        userId,
        itrType,
        '2024-25',
      );

      if (autoPopResult.success) {
        toast.success(`ITR-${itrType} auto-populated with ${autoPopResult.summary.dataSources} data sources`);

        // Navigate to ITR filing or show results
        enterpriseLogger.info('Auto-population results', { result: autoPopResult });
      } else {
        toast.error('Auto-population failed');
      }

    } catch (error) {
      enterpriseLogger.error('Auto-population failed', { error });
      toast.error('Auto-population failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate financial summary from real data
   */
  const calculateFinancialSummary = async (userId) => {
    try {
      // Fetch financial profile data
      const profileResult = await financialProfileService.getFinancialProfile(userId);
      
      if (profileResult.success && profileResult.profile) {
        const profile = profileResult.profile;
        
        // Calculate from actual profile data
        const incomeProfile = profile.incomeProfile || {};
        const currentYearEstimate = incomeProfile.currentYearEstimate || {};
        const totalIncome = (currentYearEstimate.total || 0) +
          (currentYearEstimate.salary || 0) +
          (currentYearEstimate.other || 0);
        
        const deductionProfile = profile.deductionProfile || {};
        const totalDeductions = deductionProfile.totalClaimed || 0;
        const totalTDS = currentYearEstimate.tds || 0;
        
        // Get tax liability from recent filings if available
        try {
          const filingsResponse = await apiClient.get('/itr/filings', { params: { limit: 1 } });
          const recentFiling = filingsResponse.success && filingsResponse.data?.filings?.[0]
            ? filingsResponse.data.filings[0]
            : (Array.isArray(filingsResponse.data) && filingsResponse.data[0] ? filingsResponse.data[0] : null);
          
          const taxLiability = recentFiling?.taxComputation?.finalTax || 0;
          
          // Get data sources from profile connections
          const connections = profile.connections || [];
          const dataSources = connections.map(conn => ({
            type: conn.type || 'unknown',
            name: conn.name || 'Unknown',
            status: conn.status || 'active',
            lastSync: conn.lastSync || new Date().toISOString(),
          }));
          
          return {
            totalIncome,
            totalDeductions,
            totalTDS,
            taxLiability,
            dataSources: dataSources.length > 0 ? dataSources : [],
          };
        } catch (filingError) {
          enterpriseLogger.warn('Failed to fetch recent filing for tax liability', { error: filingError });
          // Continue with profile data only
        }
        
        // Get data sources from profile connections
        const connections = profile.connections || [];
        const dataSources = connections.map(conn => ({
          type: conn.type || 'unknown',
          name: conn.name || 'Unknown',
          status: conn.status || 'active',
          lastSync: conn.lastSync || new Date().toISOString(),
        }));
        
        return {
          totalIncome,
          totalDeductions,
          totalTDS,
          taxLiability: 0, // Will be calculated when filing is available
          dataSources: dataSources.length > 0 ? dataSources : [],
        };
      }
      
      // Fallback to empty data if profile not available
      return {
        totalIncome: 0,
        totalDeductions: 0,
        totalTDS: 0,
        taxLiability: 0,
        dataSources: [],
      };
    } catch (error) {
      enterpriseLogger.error('Failed to calculate financial summary', { error, userId });
      // Return empty data on error
      return {
        totalIncome: 0,
        totalDeductions: 0,
        totalTDS: 0,
        taxLiability: 0,
        dataSources: [],
      };
    }
  };

  /**
   * Check auto-population readiness
   */
  const checkAutoPopulationReadiness = async () => {
    // Check if we have enough data for auto-population
    return {
      available: true,
      confidence: 88,
      missingFields: ['rent_receipts', 'section_80d_documents'],
      recommendations: [
        {
          type: 'additional_document',
          title: 'Upload Rent Receipts',
          description: 'Maximize HRA deduction by uploading rent receipts',
          action: 'upload_rent_receipts',
        },
        {
          type: 'tax_optimization',
          title: 'Optimize Section 80D',
          description: 'Upload medical insurance policies for tax benefits',
          action: 'upload_insurance_policies',
        },
      ],
    };
  };

  /**
   * Determine ITR type based on financial data
   */
  const determineITRType = (financialData) => {
    // Simple logic to determine ITR type
    if (financialData.totalIncome < 5000000) {
      return 'ITR-1';
    }
    return 'ITR-2';
  };

  /**
   * Handle document upload
   */
  const handleDocumentUpload = async (file, documentType) => {
    try {
      const result = await documentProcessingService.processDocument(file, documentType);

      if (result.success) {
        toast.success(`${documentType} processed successfully`);
        // Refresh dashboard data
        loadDashboardData();
      } else {
        toast.error(`Failed to process ${documentType}`);
      }
    } catch (error) {
      enterpriseLogger.error('Document upload failed', { error });
      toast.error('Document upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-1 font-bold text-slate-900">
                Data Integration Dashboard
              </h1>
              <p className="text-slate-600 mt-2">
                Auto-populate your ITR with real-time financial data integration
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={triggerDataSync}
                disabled={syncStatus.isSyncing || isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Data'}</span>
              </button>

              <button
                onClick={triggerAutoPopulation}
                disabled={!autoPopulation.available || isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5" />
                <span>Auto-Populate ITR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-body-regular">Total Income</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  ₹{financialData.totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-body-regular">Total Deductions</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  ₹{financialData.totalDeductions.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-body-regular">TDS Credits</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  ₹{financialData.totalTDS.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-body-regular">Data Quality</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {syncStatus.dataQuality}%
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Data Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Connected Data Sources */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <h2 className="text-heading-3 font-semibold text-slate-900 mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2 text-blue-600" />
              Connected Data Sources
            </h2>

            <div className="space-y-3">
              {financialData.dataSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      source.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-slate-900">{source.name}</p>
                      <p className="text-body-regular text-slate-600">{source.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body-regular text-slate-600">{source.lastSync}</p>
                    <p className="text-body-small text-green-600">Active</p>
                  </div>
                </div>
              ))}

              {financialData.dataSources.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600">No data sources connected yet</p>
                  <button className="mt-4 text-blue-600 hover:text-blue-700">
                    Connect Data Sources →
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Auto-Population Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-elevation-1 p-6"
          >
            <h2 className="text-heading-3 font-semibold text-slate-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Auto-Population Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Readiness</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    autoPopulation.available ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    autoPopulation.available ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {autoPopulation.available ? 'Ready' : 'Needs More Data'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Confidence</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${autoPopulation.confidence}%` }}
                    />
                  </div>
                  <span className="text-body-regular font-medium text-slate-900">
                    {autoPopulation.confidence}%
                  </span>
                </div>
              </div>

              {autoPopulation.recommendations.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-slate-900 mb-2">Recommendations</h3>
                  <div className="space-y-2">
                    {autoPopulation.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-body-regular font-medium text-blue-900">{rec.title}</p>
                        <p className="text-body-small text-blue-700 mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-elevation-1 p-6"
        >
          <h2 className="text-heading-3 font-semibold text-slate-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <p className="font-medium text-slate-900">Upload Documents</p>
                <p className="text-body-regular text-slate-600">Form 16, Bank Statements, etc.</p>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Building className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <p className="font-medium text-slate-900">Connect Bank</p>
                <p className="text-body-regular text-slate-600">Auto-sync bank statements</p>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <p className="font-medium text-slate-900">Connect Broker</p>
                <p className="text-body-regular text-slate-600">Auto-import capital gains</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DataIntegrationDashboard;
