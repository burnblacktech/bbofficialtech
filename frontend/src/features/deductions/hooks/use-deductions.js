// =====================================================
// DEDUCTION HOOKS
// React Query hooks for Chapter VI-A deductions
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deductionService } from '../services/deduction.service';
import toast from 'react-hot-toast';

/**
 * Query keys factory for deductions
 */
export const deductionKeys = {
  all: ['deductions'],

  lists: () => [...deductionKeys.all, 'list'],

  list: (filingId) => [...deductionKeys.lists(), filingId],

  details: () => [...deductionKeys.all, 'detail'],

  detail: (filingId, section) => [...deductionKeys.details(), filingId, section],

  limits: (filingId) => [...deductionKeys.all, 'limits', filingId],
};

/**
 * Hook to fetch deductions for a filing
 */
export function useDeductions(filingId, section) {
  return useQuery({
    queryKey: deductionKeys.detail(filingId, section),
    queryFn: () => deductionService.getDeductions(filingId, section),
    enabled: !!filingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new deduction
 */
export function useCreateDeduction(filingId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ section, data }) => deductionService.createDeduction(filingId, section, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(deductionKeys.detail(filingId, variables.section));
      queryClient.invalidateQueries(deductionKeys.limits(filingId));
      toast.success('Deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });
}

/**
 * Hook to update an existing deduction
 */
export function useUpdateDeduction(filingId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deductionId, section, data }) =>
      deductionService.updateDeductionBySection(filingId, section, deductionId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(deductionKeys.detail(filingId, variables.section));
      queryClient.invalidateQueries(deductionKeys.limits(filingId));
      toast.success('Deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });
}

/**
 * Hook to delete a deduction
 */
export function useDeleteDeduction(filingId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deductionId, section }) =>
      deductionService.deleteDeductionBySection(filingId, section, deductionId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(deductionKeys.detail(filingId, variables.section));
      queryClient.invalidateQueries(deductionKeys.limits(filingId));
      toast.success('Deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });
}

/**
 * Hook to upload proof document
 */
export function useUploadProof(filingId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deductionId, section, file }) =>
      deductionService.uploadProof(filingId, deductionId, section, file),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(deductionKeys.detail(filingId, variables.section));
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    },
  });
}

/**
 * Hook to fetch deduction limits and utilization
 */
export function useDeductionLimits(filingId) {
  return useQuery({
    queryKey: deductionKeys.limits(filingId),
    queryFn: () => deductionService.getDeductionLimits(filingId),
    enabled: !!filingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

