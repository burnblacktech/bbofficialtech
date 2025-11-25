import { useState, useEffect, useCallback } from 'react';

const useFilingStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalFilings: 0,
    completedFilings: 0,
    pendingFilings: 0,
    rejectedFilings: 0,
    totalTaxComputed: 0,
    totalTaxSaved: 0,
    averageProcessingTime: 0,
    monthlyTrends: [],
    yearlyComparison: {},
    loading: false,
    error: null,
  });

  const fetchStatistics = useCallback(async (period = 'current_year') => {
    setStatistics(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = {
        totalFilings: 25,
        completedFilings: 20,
        pendingFilings: 3,
        rejectedFilings: 2,
        totalTaxComputed: 150000,
        totalTaxSaved: 25000,
        averageProcessingTime: 7.5, // days
        monthlyTrends: [
          { month: 'Jan', filings: 5, completed: 4 },
          { month: 'Feb', filings: 8, completed: 7 },
          { month: 'Mar', filings: 12, completed: 9 },
        ],
        yearlyComparison: {
          currentYear: 25,
          previousYear: 18,
          growth: 38.9,
        },
      };

      setStatistics(prev => ({
        ...prev,
        ...mockData,
        loading: false,
      }));
    } catch (error) {
      setStatistics(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: {
      status_distribution: [
        { status: 'draft', count: statistics.pendingFilings },
        { status: 'in_progress', count: statistics.pendingFilings },
        { status: 'submitted', count: statistics.completedFilings },
        { status: 'acknowledged', count: statistics.completedFilings },
        { status: 'rejected', count: statistics.rejectedFilings },
      ],
      monthlyTrends: statistics.monthlyTrends,
      yearlyComparison: statistics.yearlyComparison,
    },
    loading: statistics.loading,
    error: statistics.error,
    refetch: fetchStatistics,
  };
};

export default useFilingStatistics;
