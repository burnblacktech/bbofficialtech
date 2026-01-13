// =====================================================
// PLATFORM USER MANAGEMENT PAGE
// Enterprise-grade platform user oversight and management
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Mail,
  Phone,
  Calendar,
  Building2,
  TrendingUp,
  BarChart3,
  Download,
  Upload,
  UserCheck,
  UserX,
  Crown,
  Star,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PlatformUserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('users');

  // Fetch platform users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['platformUsers', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/api/platform-admin/users?search=${searchTerm}&role=${roleFilter}&status=${statusFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch user statistics
  const { data: statsData } = useQuery({
    queryKey: ['platformUserStats'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/users/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const users = usersData?.users || [];
  const stats = statsData?.stats || {};

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/api/platform-admin/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformUsers']);
      queryClient.invalidateQueries(['platformUserStats']);
      setShowAddForm(false);
      toast.success('User added successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to add user: ${error.message}`);
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const response = await api.put(`/api/platform-admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformUsers']);
      queryClient.invalidateQueries(['platformUserStats']);
      toast.success('User status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/api/platform-admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformUsers']);
      queryClient.invalidateQueries(['platformUserStats']);
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const handleStatusUpdate = (userId, newStatus) => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleDeleteUser = (userId, userName) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'ca_firm_admin':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'ca':
      case 'senior_ca':
        return <UserCheck className="h-4 w-4 text-gold-500" />;
      case 'user':
      case 'guest':
        return <Users className="h-4 w-4 text-slate-500" />;
      default:
        return <Users className="h-4 w-4 text-slate-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'platform_admin':
        return 'bg-blue-100 text-blue-800';
      case 'ca_firm_admin':
        return 'bg-green-100 text-green-800';
      case 'ca':
      case 'senior_ca':
        return 'bg-gold-100 text-gold-800';
      case 'user':
      case 'guest':
        return 'bg-slate-100 text-gray-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-error-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gold-500" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      default:
        return <Users className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-error-100 text-red-800';
      case 'pending':
        return 'bg-gold-100 text-gold-800';
      case 'suspended':
        return 'bg-error-100 text-red-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'users', name: 'All Users', count: stats.total || 0 },
    { id: 'active', name: 'Active', count: stats.active || 0 },
    { id: 'pending', name: 'Pending', count: stats.pending || 0 },
    { id: 'suspended', name: 'Suspended', count: stats.suspended || 0 },
  ];

  const filteredUsers = users.filter(user => {
    if (selectedTab === 'users') return true;
    return user.status === selectedTab;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-elevation-1 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-heading-3 font-semibold text-slate-900">Platform User Management</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/platform-admin/users/export')}
                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Users</span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Total Users</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Active Users</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-gold-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Pending</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-error-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Suspended</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.suspended || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-elevation-1 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="platform_admin">Platform Admin</option>
                <option value="ca_firm_admin">CA Firm Admin</option>
                <option value="ca">CA</option>
                <option value="senior_ca">Senior CA</option>
                <option value="user">User</option>
                <option value="guest">Guest</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-elevation-1 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-elevation-1 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-heading-4 font-medium text-slate-900 mb-2">No users found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No users have been registered yet'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add First User
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-elevation-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-heading-4 font-semibold text-slate-900">
                {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(user.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-slate-900">{user.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          {user.is_premium && (
                            <span className="px-2 py-1 text-body-small rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>Premium</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-regular text-slate-600">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{user.mobile || 'No mobile'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{user.organization || 'No organization'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Last Login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>Activity Score: {user.activity_score || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/platform-admin/users/${user.user_id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/platform-admin/users/${user.user_id}/edit`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(user.user_id, 'active')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                          title="Approve User"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {user.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(user.user_id, 'suspended')}
                          className="p-2 text-gold-600 hover:text-gold-800 hover:bg-gold-50 rounded-xl transition-colors"
                          title="Suspend User"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user.user_id, user.name)}
                        className="p-2 text-error-600 hover:text-red-800 hover:bg-error-50 rounded-xl transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add User Form Modal */}
        {showAddForm && (
          <AddUserForm
            onClose={() => setShowAddForm(false)}
            onSubmit={addUserMutation.mutate}
            isLoading={addUserMutation.isLoading}
          />
        )}
      </main>
    </div>
  );
};

// Add User Form Component
const AddUserForm = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'user',
    organization: '',
    is_premium: false,
    status: 'pending',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Add New User</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="ca">CA</option>
              <option value="senior_ca">Senior CA</option>
              <option value="ca_firm_admin">CA Firm Admin</option>
              <option value="platform_admin">Platform Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter organization name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_premium"
              checked={formData.is_premium}
              onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_premium" className="text-body-regular font-medium text-slate-700">
              Premium User
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformUserManagement;
