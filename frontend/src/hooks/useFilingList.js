import { useState, useEffect, useCallback, useMemo } from 'react';

const useFilingList = () => {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    itrType: '',
    context: '',
    year: '',
    page: 1,
    limit: 10,
  });
  const [selectedFiling, setSelectedFiling] = useState(null);

  // ✅ Stable fetch function with proper dependencies
  const fetchFilings = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockFilings = [
        {
          id: 1,
          taxpayerName: 'John Doe',
          pan: 'ABCDE1234F',
          ticketNumber: 'TKT001',
          type: 'ITR-1',
          status: 'completed',
          itrType: 'ITR-1',
          filingContext: 'individual',
          assessmentYear: '2023-24',
          year: '2023-24',
          submittedAt: new Date(),
          taxComputed: 15000,
          taxSaved: 2500,
        },
        {
          id: 2,
          taxpayerName: 'Jane Smith',
          pan: 'FGHIJ5678K',
          ticketNumber: 'TKT002',
          type: 'ITR-2',
          status: 'pending',
          itrType: 'ITR-2',
          filingContext: 'individual',
          assessmentYear: '2023-24',
          year: '2023-24',
          submittedAt: new Date(),
          taxComputed: 25000,
          taxSaved: 0,
        },
        {
          id: 3,
          taxpayerName: 'Business Corp',
          pan: 'LMNOP9012Q',
          ticketNumber: 'TKT003',
          type: 'ITR-3',
          status: 'draft',
          itrType: 'ITR-3',
          filingContext: 'business',
          assessmentYear: '2023-24',
          year: '2023-24',
          submittedAt: new Date(),
          taxComputed: 0,
          taxSaved: 0,
        },
      ];

      // Apply filters
      let filteredFilings = mockFilings;

      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filteredFilings = filteredFilings.filter(filing =>
          filing.taxpayerName.toLowerCase().includes(searchLower) ||
          filing.pan.toLowerCase().includes(searchLower) ||
          filing.ticketNumber.toLowerCase().includes(searchLower),
        );
      }

      if (currentFilters.status) {
        filteredFilings = filteredFilings.filter(filing =>
          filing.status === currentFilters.status,
        );
      }

      if (currentFilters.itrType) {
        filteredFilings = filteredFilings.filter(filing =>
          filing.itrType === currentFilters.itrType,
        );
      }

      if (currentFilters.context) {
        filteredFilings = filteredFilings.filter(filing =>
          filing.filingContext === currentFilters.context,
        );
      }

      if (currentFilters.year) {
        filteredFilings = filteredFilings.filter(filing =>
          filing.assessmentYear === currentFilters.year,
        );
      }

      setFilings(filteredFilings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ Stable setFilters function
  const stableSetFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // ✅ Stable setSelectedFiling function
  const stableSetSelectedFiling = useCallback((filing) => {
    setSelectedFiling(filing);
  }, []);

  // ✅ Fetch filings when filters change
  useEffect(() => {
    fetchFilings(filters);
  }, [filters, fetchFilings]);

  // ✅ Memoized computed values
  const totalCount = useMemo(() => filings.length, [filings.length]);
  const currentPage = useMemo(() => filters.page, [filters.page]);
  const totalPages = useMemo(() => Math.ceil(totalCount / filters.limit), [totalCount, filters.limit]);

  return {
    filings,
    totalCount,
    currentPage,
    totalPages,
    filters,
    isLoading: loading,
    error,
    selectedFiling,
    setFilters: stableSetFilters,
    setSelectedFiling: stableSetSelectedFiling,
    refetch: fetchFilings,
  };
};

export default useFilingList;
