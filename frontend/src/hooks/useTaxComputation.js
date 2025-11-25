// useTaxComputation Hook
// Provides tax computation functionality for ITR forms

import { useState, useEffect, useCallback } from 'react';
import { taxService } from '../services/taxService';

export const useTaxComputation = () => {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const computeTax = useCallback(async (incomeData, regime = 'new') => {
    setLoading(true);
    setError(null);

    try {
      const result = await taxService.computeTax({
        ...incomeData,
        regime,
      });

      setTaxData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetTaxData = useCallback(() => {
    setTaxData(null);
    setError(null);
  }, []);

  return {
    taxData,
    loading,
    error,
    computeTax,
    resetTaxData,
  };
};

export default useTaxComputation;
