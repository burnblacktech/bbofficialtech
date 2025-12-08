// =====================================================
// DATA PREFETCH HOOK
// Auto-fetch 26AS/AIS data and determine eligible ITR types
// =====================================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import aisForm26ASService from '../services/AISForm26ASService';
import ITRAutoDetector from '../services/ITRAutoDetector';
import apiClient from '../services/core/APIClient';
import toast from 'react-hot-toast';

/**
 * Custom hook for prefetching tax data and determining ITR eligibility
 */
export const useDataPrefetch = (userId, panNumber, assessmentYear = '2025-26') => {
  const [prefetchStatus, setPrefetchStatus] = useState({
    ais: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    form26AS: 'idle',
    previousYear: 'idle',
    overall: 'idle',
  });

  const [prefetchedData, setPrefetchedData] = useState({
    ais: null,
    form26AS: null,
    previousYear: null,
    consolidated: null,
  });

  const [itrRecommendation, setItrRecommendation] = useState(null);
  const [eligibleITRTypes, setEligibleITRTypes] = useState([]);
  const [detectedIncomeSources, setDetectedIncomeSources] = useState([]);

  // Fetch AIS data
  const fetchAIS = useCallback(async () => {
    if (!userId || !panNumber) return null;

    setPrefetchStatus((prev) => ({ ...prev, ais: 'loading' }));
    try {
      const result = await aisForm26ASService.fetchAISData(userId, null, assessmentYear);
      setPrefetchStatus((prev) => ({ ...prev, ais: 'success' }));
      return result.data;
    } catch (error) {
      console.error('AIS fetch error:', error);
      setPrefetchStatus((prev) => ({ ...prev, ais: 'error' }));
      return null;
    }
  }, [userId, panNumber, assessmentYear]);

  // Fetch Form 26AS data
  const fetchForm26AS = useCallback(async () => {
    if (!userId || !panNumber) return null;

    setPrefetchStatus((prev) => ({ ...prev, form26AS: 'loading' }));
    try {
      const result = await aisForm26ASService.fetchForm26ASData(userId, null, assessmentYear);
      setPrefetchStatus((prev) => ({ ...prev, form26AS: 'success' }));
      return result.data;
    } catch (error) {
      console.error('Form 26AS fetch error:', error);
      setPrefetchStatus((prev) => ({ ...prev, form26AS: 'error' }));
      return null;
    }
  }, [userId, panNumber, assessmentYear]);

  // Fetch previous year ITR data
  const fetchPreviousYear = useCallback(async () => {
    if (!userId) return null;

    setPrefetchStatus((prev) => ({ ...prev, previousYear: 'loading' }));
    try {
      const response = await apiClient.get('/api/itr/previous-years', {
        params: { limit: 1 },
      });
      setPrefetchStatus((prev) => ({ ...prev, previousYear: 'success' }));
      return response.data?.filings?.[0] || null;
    } catch (error) {
      console.error('Previous year fetch error:', error);
      setPrefetchStatus((prev) => ({ ...prev, previousYear: 'error' }));
      return null;
    }
  }, [userId]);

  // Analyze prefetched data and determine ITR type
  const analyzeAndRecommend = useCallback((aisData, form26ASData, previousYearData) => {
    const detectedSources = [];
    let analysisData = {
      salary: 0,
      interestIncome: 0,
      dividendIncome: 0,
      businessIncome: 0,
      professionalIncome: 0,
      capitalGains: 0,
      houseProperties: [],
      foreignIncome: 0,
      agriculturalIncome: 0,
      otherIncome: 0,
      isNRI: false,
      isDirector: false,
      isPartner: false,
      dtaaClaim: false,
    };

    // Process AIS data
    if (aisData) {
      // Salary income from AIS
      if (aisData.partA?.salaryIncome?.length > 0) {
        const totalSalary = aisData.partA.salaryIncome.reduce(
          (sum, item) => sum + (item.amount || 0),
          0,
        );
        analysisData.salary = totalSalary;
        if (totalSalary > 0) {
          detectedSources.push({
            type: 'salary',
            amount: totalSalary,
            source: 'AIS',
            details: `${aisData.partA.salaryIncome.length} employer(s)`,
          });
        }
      }

      // Interest income from AIS
      if (aisData.partA?.interestIncome?.length > 0) {
        const totalInterest = aisData.partA.interestIncome.reduce(
          (sum, item) => sum + (item.amount || 0),
          0,
        );
        analysisData.interestIncome = totalInterest;
        if (totalInterest > 0) {
          detectedSources.push({
            type: 'interest',
            amount: totalInterest,
            source: 'AIS',
            details: 'Bank interest, FD, etc.',
          });
        }
      }

      // Dividend income from AIS
      if (aisData.partA?.dividendIncome?.length > 0) {
        const totalDividend = aisData.partA.dividendIncome.reduce(
          (sum, item) => sum + (item.amount || 0),
          0,
        );
        analysisData.dividendIncome = totalDividend;
        if (totalDividend > 0) {
          detectedSources.push({
            type: 'dividend',
            amount: totalDividend,
            source: 'AIS',
            details: 'Share dividends, MF dividends',
          });
        }
      }

      // Capital gains from AIS Part B
      if (aisData.partB?.specifiedFinancialTransactions?.length > 0) {
        const capitalGainsTxns = aisData.partB.specifiedFinancialTransactions.filter(
          (txn) => txn.transactionType === 'SHARE_SALE' || txn.transactionType === 'MUTUAL_FUND_SALE',
        );
        if (capitalGainsTxns.length > 0) {
          analysisData.capitalGains = 1; // Flag as present
          detectedSources.push({
            type: 'capital_gains',
            amount: null,
            source: 'AIS',
            details: `${capitalGainsTxns.length} transaction(s)`,
          });
        }
      }

      // Property transactions
      if (aisData.partB?.immovablePropertyTransactions?.length > 0) {
        const properties = aisData.partB.immovablePropertyTransactions;
        analysisData.houseProperties = properties;
        detectedSources.push({
          type: 'property',
          amount: null,
          source: 'AIS',
          details: `${properties.length} property transaction(s)`,
        });
      }
    }

    // Process Form 26AS data
    if (form26ASData) {
      // TDS from salary (Part A)
      if (form26ASData.partA?.length > 0) {
        const salaryTDS = form26ASData.partA.filter((item) => item.sectionCode === '192');
        if (salaryTDS.length > 0 && !detectedSources.find((s) => s.type === 'salary')) {
          const totalSalary = salaryTDS.reduce((sum, item) => sum + (item.creditedAmount || 0), 0);
          analysisData.salary = Math.max(analysisData.salary, totalSalary);
          detectedSources.push({
            type: 'salary',
            amount: totalSalary,
            source: '26AS',
            details: 'TDS on salary',
          });
        }
      }

      // TDS on professional fees (Part B)
      if (form26ASData.partB?.length > 0) {
        const professionalTDS = form26ASData.partB.filter((item) => item.sectionCode === '194J');
        if (professionalTDS.length > 0) {
          const totalProfessional = professionalTDS.reduce(
            (sum, item) => sum + (item.creditedAmount || 0),
            0,
          );
          analysisData.professionalIncome = totalProfessional;
          detectedSources.push({
            type: 'professional',
            amount: totalProfessional,
            source: '26AS',
            details: 'Professional/Consultancy fees',
          });
        }
      }
    }

    // Process previous year data
    if (previousYearData?.formData) {
      const prevFormData = previousYearData.formData;

      // Check for foreign assets from previous year
      if (prevFormData.scheduleFA || prevFormData.foreignAssets) {
        analysisData.foreignIncome = 1;
        detectedSources.push({
          type: 'foreign',
          amount: null,
          source: 'Previous Year',
          details: 'Foreign assets declared previously',
        });
      }

      // Check for agricultural income from previous year
      if (prevFormData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome > 0) {
        analysisData.agriculturalIncome = prevFormData.exemptIncome.agriculturalIncome.netAgriculturalIncome;
        detectedSources.push({
          type: 'agricultural',
          amount: analysisData.agriculturalIncome,
          source: 'Previous Year',
          details: 'Agricultural income declared previously',
        });
      }
    }

    // Use ITRAutoDetector to determine eligible ITR types
    const autoDetector = new ITRAutoDetector();
    const detection = autoDetector.detectITR(analysisData);

    setDetectedIncomeSources(detectedSources);
    setItrRecommendation(detection);
    setEligibleITRTypes(detection.eligibleITRs || [detection.recommendedITR]);

    return {
      detectedSources,
      recommendation: detection,
      analysisData,
    };
  }, []);

  // Main prefetch function
  const startPrefetch = useCallback(async () => {
    if (!userId || !panNumber) {
      toast.error('User ID and PAN are required for data prefetch');
      return null;
    }

    setPrefetchStatus({
      ais: 'loading',
      form26AS: 'loading',
      previousYear: 'loading',
      overall: 'loading',
    });

    try {
      // Fetch all data in parallel
      const [aisResult, form26ASResult, previousYearResult] = await Promise.allSettled([
        fetchAIS(),
        fetchForm26AS(),
        fetchPreviousYear(),
      ]);

      const aisData = aisResult.status === 'fulfilled' ? aisResult.value : null;
      const form26ASData = form26ASResult.status === 'fulfilled' ? form26ASResult.value : null;
      const previousYearData = previousYearResult.status === 'fulfilled' ? previousYearResult.value : null;

      // Store prefetched data
      setPrefetchedData({
        ais: aisData,
        form26AS: form26ASData,
        previousYear: previousYearData,
        consolidated: {
          ais: aisData,
          form26AS: form26ASData,
          previousYear: previousYearData,
        },
      });

      // Analyze and recommend ITR type
      const analysis = analyzeAndRecommend(aisData, form26ASData, previousYearData);

      setPrefetchStatus((prev) => ({
        ...prev,
        overall: 'success',
      }));

      return {
        data: { ais: aisData, form26AS: form26ASData, previousYear: previousYearData },
        analysis,
      };
    } catch (error) {
      console.error('Prefetch error:', error);
      setPrefetchStatus((prev) => ({
        ...prev,
        overall: 'error',
      }));
      toast.error('Failed to fetch tax data. You can still proceed manually.');
      return null;
    }
  }, [userId, panNumber, fetchAIS, fetchForm26AS, fetchPreviousYear, analyzeAndRecommend]);

  // Calculate overall progress
  const progress = useMemo(() => {
    const statuses = ['ais', 'form26AS', 'previousYear'];
    const completed = statuses.filter(
      (s) => prefetchStatus[s] === 'success' || prefetchStatus[s] === 'error',
    ).length;
    return Math.round((completed / statuses.length) * 100);
  }, [prefetchStatus]);

  // Check if any fetch is in progress
  const isLoading = useMemo(() => {
    return Object.values(prefetchStatus).some((s) => s === 'loading');
  }, [prefetchStatus]);

  // Check if all fetches are complete
  const isComplete = useMemo(() => {
    return prefetchStatus.overall === 'success' || prefetchStatus.overall === 'error';
  }, [prefetchStatus]);

  // Get data availability summary
  const dataAvailability = useMemo(() => {
    return {
      ais: prefetchStatus.ais === 'success' && prefetchedData.ais !== null,
      form26AS: prefetchStatus.form26AS === 'success' && prefetchedData.form26AS !== null,
      previousYear: prefetchStatus.previousYear === 'success' && prefetchedData.previousYear !== null,
    };
  }, [prefetchStatus, prefetchedData]);

  return {
    // State
    prefetchStatus,
    prefetchedData,
    itrRecommendation,
    eligibleITRTypes,
    detectedIncomeSources,

    // Computed
    progress,
    isLoading,
    isComplete,
    dataAvailability,

    // Actions
    startPrefetch,
    analyzeAndRecommend,
  };
};

export default useDataPrefetch;

