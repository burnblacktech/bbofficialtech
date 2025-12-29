// =====================================================
// SUBMISSION HOOKS
// React Query hooks for ITR submission
// =====================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { submissionService } from '../services/submission.service';
import errorHandler from '../../../services/core/ErrorHandler';

/**
 * Hook for submitting ITR filing
 */
export function useSubmitITR(filingId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ verificationToken }) =>
      submissionService.submitITR(filingId, verificationToken),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['itr', 'filings', filingId]);
      queryClient.invalidateQueries(['itr', 'filings']);
      toast.success('ITR submitted successfully!');
    },
    onError: (error) => {
      errorHandler.handle(error, { customMessage: 'ITR submission failed' });
    },
  });
}

