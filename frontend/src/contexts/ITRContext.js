// =====================================================
// ITR CONTEXT - STRATEGIC CONTEXT 2
// Current ITR filing state management
// =====================================================

import React, { createContext, useState, useContext, useCallback } from 'react';
import { itrService } from '../services';

const ITRContext = createContext(null);

export const useITR = () => {
  const context = useContext(ITRContext);
  if (!context) {
    throw new Error('useITR must be used within an ITRProvider');
  }
  return context;
};

export const ITRProvider = ({ children }) => {
  const [currentFiling, setCurrentFiling] = useState(null);
  const [filingHistory, setFilingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'

  // Load user's ITR filings
  const loadFilings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await itrService.getUserITRs();
      if (response.success) {
        setFilingHistory(response.filings || []);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error loading filings:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new ITR filing
  const createFiling = useCallback(async (filingData) => {
    setIsLoading(true);
    try {
      const response = await itrService.createITR(filingData);
      if (response.success) {
        const newFiling = response.filing;
        setCurrentFiling(newFiling);
        setFilingHistory(prev => [newFiling, ...prev]);
        return { success: true, filing: newFiling };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error creating filing:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load specific filing
  const loadFiling = useCallback(async (filingId) => {
    setIsLoading(true);
    try {
      const response = await itrService.getITR(filingId);
      if (response.success) {
        setCurrentFiling(response.filing);
        return { success: true, filing: response.filing };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error loading filing:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update current filing
  const updateFiling = useCallback(async (updates) => {
    if (!currentFiling) return { success: false, message: 'No active filing' };

    setIsLoading(true);
    setAutoSaveStatus('saving');

    try {
      const response = await itrService.updateITR(currentFiling.id, updates);
      if (response.success) {
        const updatedFiling = response.filing;
        setCurrentFiling(updatedFiling);
        setFilingHistory(prev =>
          prev.map(f => f.id === updatedFiling.id ? updatedFiling : f)
        );
        setAutoSaveStatus('saved');
        return { success: true, filing: updatedFiling };
      }
      setAutoSaveStatus('error');
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error updating filing:', error);
      setAutoSaveStatus('error');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [currentFiling]);

  // Update filing section (partial update)
  const updateFilingSection = useCallback(async (section, data) => {
    const updates = { [section]: data };
    return updateFiling(updates);
  }, [updateFiling]);

  // Validate current filing
  const validateFiling = useCallback(async (section = null) => {
    if (!currentFiling) return { isValid: true, errors: [] };

    try {
      const response = await itrService.validateITR(currentFiling.id, section);
      if (response.success) {
        setValidationErrors(response.errors || {});
        return {
          isValid: Object.keys(response.errors || {}).length === 0,
          errors: response.errors || []
        };
      }
      return { isValid: false, errors: [], message: response.message };
    } catch (error) {
      console.error('Error validating filing:', error);
      return { isValid: false, errors: [], message: error.message };
    }
  }, [currentFiling]);

  // Submit ITR filing
  const submitFiling = useCallback(async () => {
    if (!currentFiling) return { success: false, message: 'No active filing' };

    setIsLoading(true);
    try {
      const response = await itrService.submitITR(currentFiling.id);
      if (response.success) {
        const submittedFiling = { ...currentFiling, status: 'submitted', ...response.data };
        setCurrentFiling(submittedFiling);
        setFilingHistory(prev =>
          prev.map(f => f.id === submittedFiling.id ? submittedFiling : f)
        );
        return { success: true, filing: submittedFiling };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error submitting filing:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [currentFiling]);

  // Compute tax for current filing
  const computeTax = useCallback(async (assessmentYear) => {
    if (!currentFiling) return { success: false, message: 'No active filing' };

    try {
      const response = await itrService.computeTax(currentFiling.id, assessmentYear);
      if (response.success) {
        const updatedFiling = { ...currentFiling, taxComputation: response.computation };
        setCurrentFiling(updatedFiling);
        return { success: true, computation: response.computation };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error computing tax:', error);
      return { success: false, message: error.message };
    }
  }, [currentFiling]);

  // Delete filing
  const deleteFiling = useCallback(async (filingId) => {
    setIsLoading(true);
    try {
      const response = await itrService.deleteITR(filingId);
      if (response.success) {
        setFilingHistory(prev => prev.filter(f => f.id !== filingId));
        if (currentFiling?.id === filingId) {
          setCurrentFiling(null);
        }
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error deleting filing:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [currentFiling]);

  // Clear current filing
  const clearCurrentFiling = useCallback(() => {
    setCurrentFiling(null);
    setValidationErrors({});
    setAutoSaveStatus('saved');
  }, []);

  // Get filing progress
  const getProgress = useCallback(() => {
    if (!currentFiling) return 0;

    let completedSections = 0;
    const totalSections = 5;

    if (currentFiling.personalInfo && Object.keys(currentFiling.personalInfo).length > 0) completedSections++;
    if (currentFiling.incomeDetails && currentFiling.incomeDetails.length > 0) completedSections++;
    if (currentFiling.deductions && currentFiling.deductions.length > 0) completedSections++;
    if (currentFiling.taxesPaid && currentFiling.taxesPaid.length > 0) completedSections++;
    if (currentFiling.status === 'completed' || currentFiling.status === 'submitted') completedSections++;

    return Math.round((completedSections / totalSections) * 100);
  }, [currentFiling]);

  const value = {
    // State
    currentFiling,
    filingHistory,
    isLoading,
    validationErrors,
    autoSaveStatus,

    // Actions
    loadFilings,
    createFiling,
    loadFiling,
    updateFiling,
    updateFilingSection,
    validateFiling,
    submitFiling,
    computeTax,
    deleteFiling,
    clearCurrentFiling,

    // Computed
    progress: getProgress()
  };

  return (
    <ITRContext.Provider value={value}>
      {children}
    </ITRContext.Provider>
  );
};

export default ITRContext;