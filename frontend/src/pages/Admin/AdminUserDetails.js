// =====================================================
// ADMIN USER DETAILS PAGE
// Enterprise-grade user detail management for admins
// =====================================================

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Building2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  TrendingUp,
  BarChart3,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Star,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminUserDetails = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user details
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      const response = await api.get(`/api/admin/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch user filings
  const { data: filingsData } = useQuery({
    queryKey: ['adminUserFilings', userId],
    queryFn: async () => {
      const response = await api.get(`/api/admin/users/${userId}/filings`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch user activity
  const { data: activityData } = useQuery({
    queryKey: ['adminUserActivity', userId],
    queryFn: async () => {
      const response = await api.get(`/api/admin/users/${userId}/activity`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const userDetails = userData?.user;
  const filings = filingsData?.filings || [];
  const activities = activityData?.activities || [];

  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (userDetails) {
      setEditFormData({
        name: userDetails.name || '',
        email: userDetails.email || '',
        mobile: userDetails.mobile || '',
        role: userDetails.role || '',
        status: userDetails.status || '',
        organization: userDetails.organization || '',
        address_line_1: userDetails.address_line_1 || '',
        address_line_2: userDetails.address_line_2 || '',
        city: userDetails.city || '',
        state: userDetails.state || '',
        pincode: userDetails.pincode || '',
        is_premium: userDetails.is_premium || false,
        notes: userDetails.notes || '',
      });
    }
  }, [userDetails]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.put(`/api/admin/users/${userId}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUser', userId]);
      setIsEditing(false);
      toast.success('User updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const response = await api.put(`/api/admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUser', userId]);
      toast.success('User status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/api/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User deleted successfully!');
      navigate('/admin/users');
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    await updateUserMutation.mutateAsync(editFormData);
  };

  const handleStatusUpdate = (newStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleDeleteUser = () => {
    if (window.confirm(`Are you sure you want to delete ${userDetails?.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate();
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
        return <UserCheck className="h-4 w-4 text-orange-500" />;
      case 'user':
      case 'guest':
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
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
        return 'bg-orange-100 text-orange-800';
      case 'user':
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'filings', name: 'Filings', icon: FileText },
    { id: 'activity', name: 'Activity', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Back to Users</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {userDetails.name}
                </h1>
                <p className="text-sm text-gray-500">User ID: {userDetails.user_id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={deleteUserMutation.isLoading}
                    className="flex items-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    disabled={updateUserMutation.isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{updateUserMutation.isLoading ? 'Saving...' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>

              {isEditing ? (
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input
                        type="tel"
                        value={editFormData.mobile}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="ca">CA</option>
                        <option value="senior_ca">Senior CA</option>
                        <option value="ca_firm_admin">CA Firm Admin</option>
                        <option value="platform_admin">Platform Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-500">{userDetails.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mobile</p>
                        <p className="text-sm text-gray-500">{userDetails.mobile || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Joined</p>
                        <p className="text-sm text-gray-500">
                          {new Date(userDetails.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-500">
                          {userDetails.address_line_1 && userDetails.city && userDetails.state
                            ? `${userDetails.address_line_1}, ${userDetails.city}, ${userDetails.state} - ${userDetails.pincode}`
                            : 'Not provided'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Organization</p>
                        <p className="text-sm text-gray-500">{userDetails.organization || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Login</p>
                        <p className="text-sm text-gray-500">
                          {userDetails.last_login ? new Date(userDetails.last_login).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status and Role */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Role</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(userDetails.status)}
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(userDetails.status)}`}>
                    {userDetails.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(userDetails.role)}
                  <span className={`px-3 py-1 text-sm rounded-full ${getRoleColor(userDetails.role)}`}>
                    {userDetails.role.replace('_', ' ')}
                  </span>
                </div>
                {userDetails.is_premium && (
                  <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Premium</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Filings</p>
                    <p className="text-2xl font-semibold text-gray-900">{filings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filings.filter(f => f.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Activity Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{userDetails.activity_score || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{userDetails.total_spent || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filings Tab */}
        {activeTab === 'filings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">User Filings</h2>
              <button
                onClick={() => navigate(`/admin/filings?user_id=${userId}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Filings
              </button>
            </div>

            {filings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No filings found</h3>
                <p className="text-gray-500 mb-6">This user hasn't filed any ITR yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {filings.length} Filing{filings.length !== 1 ? 's' : ''}
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {filings.slice(0, 10).map((filing) => (
                    <div key={filing.filing_id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{filing.itr_type}</h4>
                            <p className="text-sm text-gray-500">
                              Assessment Year: {filing.assessment_year}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(filing.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            filing.status === 'completed' ? 'bg-green-100 text-green-800' :
                            filing.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            filing.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {filing.status.replace('_', ' ')}
                          </span>

                          <button
                            onClick={() => navigate(`/admin/filings/${filing.filing_id}`)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">User Activity</h2>

            {activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity found</h3>
                <p className="text-gray-500">This user hasn't performed any activities yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activities.length} Activity{activities.length !== 1 ? 'ies' : ''}
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.metadata && (
                            <p className="text-xs text-gray-400 mt-1">
                              {JSON.stringify(activity.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">User Settings</h2>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleStatusUpdate('active')}
                  disabled={userDetails.status === 'active'}
                  className="p-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-900">Activate</span>
                </button>

                <button
                  onClick={() => handleStatusUpdate('suspended')}
                  disabled={userDetails.status === 'suspended'}
                  className="p-4 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-orange-900">Suspend</span>
                </button>

                <button
                  onClick={() => handleStatusUpdate('inactive')}
                  disabled={userDetails.status === 'inactive'}
                  className="p-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-red-900">Deactivate</span>
                </button>

                <button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={userDetails.status === 'pending'}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Set Pending</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUserDetails;
