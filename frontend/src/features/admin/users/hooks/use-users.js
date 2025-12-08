// =====================================================
// ADMIN USERS HOOKS
// React Query hooks for admin user management
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersService } from '../services/users.service';
import toast from 'react-hot-toast';

/**
 * Get all users with filters
 */
export const useAdminUsers = (params = {}) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminUsersService.getUsers(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

/**
 * Get user details
 */
export const useAdminUserDetails = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['adminUserDetails', userId],
    queryFn: () => adminUsersService.getUserDetails(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get user activity log
 */
export const useAdminUserActivity = (userId, params = {}) => {
  return useQuery({
    queryKey: ['adminUserActivity', userId, params],
    queryFn: () => adminUsersService.getUserActivity(userId, params),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get user's filings
 */
export const useAdminUserFilings = (userId, params = {}) => {
  return useQuery({
    queryKey: ['adminUserFilings', userId, params],
    queryFn: () => adminUsersService.getUserFilings(userId, params),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get user's transactions
 */
export const useAdminUserTransactions = (userId, params = {}) => {
  return useQuery({
    queryKey: ['adminUserTransactions', userId, params],
    queryFn: () => adminUsersService.getUserTransactions(userId, params),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Update user profile mutation
 */
export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) => adminUsersService.updateUser(userId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user profile');
    },
  });
};

/**
 * Update user status mutation
 */
export const useUpdateAdminUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status, reason }) => adminUsersService.updateUserStatus(userId, status, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });
};

/**
 * Activate user mutation
 */
export const useActivateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.activateUser(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User activated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to activate user');
    },
  });
};

/**
 * Deactivate user mutation
 */
export const useDeactivateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.deactivateUser(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });
};

/**
 * Suspend user mutation
 */
export const useSuspendAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.suspendUser(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User suspended successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    },
  });
};

/**
 * Delete user mutation
 */
export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason, force }) => adminUsersService.deleteUser(userId, reason, force),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete user');
    },
  });
};

/**
 * Reset password mutation
 */
export const useResetAdminUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.resetPassword(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('Password reset token generated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });
};

/**
 * Invalidate sessions mutation
 */
export const useInvalidateAdminUserSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.invalidateSessions(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('All user sessions invalidated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to invalidate sessions');
    },
  });
};

/**
 * Bulk operations mutation
 */
export const useBulkAdminUserOperations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, operation, data }) => adminUsersService.bulkOperations(userIds, operation, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success(`Bulk ${data.operation} operation completed: ${data.successCount} successful, ${data.errorCount} errors`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to perform bulk operation');
    },
  });
};

/**
 * Export users mutation
 */
export const useExportAdminUsers = () => {
  return useMutation({
    mutationFn: ({ format, params }) => adminUsersService.exportUsers(format, params),
    onSuccess: (data, variables) => {
      if (variables.format === 'csv') {
        // Create download link for CSV
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Users exported successfully');
      } else {
        toast.success('Users exported successfully');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export users');
    },
  });
};

/**
 * Impersonate user mutation
 */
export const useImpersonateAdminUser = () => {
  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.impersonateUser(userId, reason),
    onSuccess: (data) => {
      // Store impersonation token
      if (data.data?.token) {
        localStorage.setItem('impersonationToken', data.data.token);
        localStorage.setItem('originalToken', localStorage.getItem('token'));
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('isImpersonating', 'true');
        toast.success(`Impersonating ${data.data.user?.email}. Refresh to continue.`);
        // Reload page to apply new token
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to impersonate user');
    },
  });
};

/**
 * Stop impersonation mutation
 */
export const useStopImpersonation = () => {
  return useMutation({
    mutationFn: () => adminUsersService.stopImpersonation(),
    onSuccess: () => {
      // Restore original token
      const originalToken = localStorage.getItem('originalToken');
      if (originalToken) {
        localStorage.setItem('token', originalToken);
      }
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('isImpersonating');
      localStorage.removeItem('originalToken');
      toast.success('Impersonation stopped. Refresh to continue.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to stop impersonation');
    },
  });
};

/**
 * Get user notes query
 */
export const useAdminUserNotes = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['adminUserNotes', userId],
    queryFn: () => adminUsersService.getUserNotes(userId),
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Create user note mutation
 */
export const useCreateAdminUserNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, noteData }) => adminUsersService.createUserNote(userId, noteData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserNotes', variables.userId]);
      toast.success('Note created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create note');
    },
  });
};

/**
 * Update user note mutation
 */
export const useUpdateAdminUserNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, noteId, noteData }) => adminUsersService.updateUserNote(userId, noteId, noteData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserNotes', variables.userId]);
      toast.success('Note updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update note');
    },
  });
};

/**
 * Delete user note mutation
 */
export const useDeleteAdminUserNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, noteId }) => adminUsersService.deleteUserNote(userId, noteId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserNotes', variables.userId]);
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete note');
    },
  });
};

/**
 * Get user tags query
 */
export const useAdminUserTags = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['adminUserTags', userId],
    queryFn: () => adminUsersService.getUserTags(userId),
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Add user tag mutation
 */
export const useAddAdminUserTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, tag }) => adminUsersService.addUserTag(userId, tag),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserTags', variables.userId]);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('Tag added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to add tag');
    },
  });
};

/**
 * Remove user tag mutation
 */
export const useRemoveAdminUserTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, tag }) => adminUsersService.removeUserTag(userId, tag),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUserTags', variables.userId]);
      queryClient.invalidateQueries(['adminUserDetails', variables.userId]);
      toast.success('Tag removed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to remove tag');
    },
  });
};

