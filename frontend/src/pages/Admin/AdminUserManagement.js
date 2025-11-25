// =====================================================
// ADMIN USER MANAGEMENT - MOBILE-FIRST USER ADMINISTRATION
// Enterprise-grade user management with role-based access control
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Crown,
  Star,
  Eye,
  Ban,
  Check,
  X,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react';

const AdminUserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const users = usersData?.users || [];

  // Update user status mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const response = await api.patch(`/admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
    },
  });

  const handleStatusChange = (userId, newStatus) => {
    updateUserMutation.mutate({ userId, status: newStatus });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'ca_admin':
        return <Star className="h-4 w-4 text-purple-600" />;
      case 'chartered_accountant':
        return <User className="h-4 w-4 text-green-600" />;
      case 'user':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'platform_admin':
        return 'bg-blue-100 text-blue-800';
      case 'ca_admin':
        return 'bg-purple-100 text-purple-800';
      case 'chartered_accountant':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'inactive':
        return 'bg-error-100 text-error-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'suspended':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'inactive':
        return <AlertCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'suspended':
        return <Ban className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleOptions = ['all', 'super_admin', 'platform_admin', 'ca_admin', 'chartered_accountant', 'user'];
  const statusOptions = ['all', 'active', 'inactive', 'pending', 'suspended'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-sm text-neutral-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burnblack-white">
      {/* Mobile Header */}
      <header className="header-burnblack sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-burnblack-black">User Management</h1>
                <p className="text-xs text-neutral-500">{filteredUsers.length} users</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <Filter className="h-5 w-5 text-burnblack-black" />
              </button>
              <button className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform">
                <Download className="h-5 w-5 text-burnblack-black" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burnblack-gold focus:border-transparent"
          />
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="dashboard-card-burnblack p-4 space-y-3">
            {/* Role Filter */}
            <div>
              <label className="text-xs font-medium text-neutral-700 mb-2 block">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnblack-gold"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-neutral-700 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnblack-gold"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="dashboard-card-burnblack p-8 text-center">
              <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-burnblack-black mb-2">No users found</h3>
              <p className="text-sm text-neutral-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'No users match your filters'
                  : 'No users available'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="dashboard-card-burnblack hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-lg bg-neutral-50">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-burnblack-black">{user.name}</h3>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center space-x-1 ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="p-1 rounded hover:bg-neutral-100 active:scale-95 transition-transform"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {user.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-neutral-400" />
                    <span className="text-neutral-600">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {user.last_login && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">
                        Last login {new Date(user.last_login).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {user.total_filings > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">{user.total_filings} filings</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* User Actions Modal */}
      {selectedUser && showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="dashboard-card-burnblack w-full max-w-md">
            <div className="sticky top-0 bg-burnblack-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-burnblack-black">User Actions</h2>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserModal(false);
                }}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* View Profile */}
              <button
                onClick={() => {
                  // Navigate to user profile
                  setShowUserModal(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-50 text-neutral-700 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <Eye className="h-4 w-4" />
                <span>View Profile</span>
              </button>

              {/* Status Actions */}
              <div>
                <h3 className="text-sm font-medium text-burnblack-black mb-2">Change Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['active', 'inactive', 'pending', 'suspended'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedUser.id, status);
                        setShowUserModal(false);
                      }}
                      disabled={selectedUser.status === status}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedUser.status === status
                          ? 'bg-burnblack-gold bg-opacity-20 text-burnblack-gold cursor-not-allowed'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Actions */}
              <div className="pt-3 border-t border-neutral-200">
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    setShowUserModal(false);
                  }}
                  className="w-full bg-error-600 text-white py-2 px-4 rounded-lg hover:bg-error-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete User</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
