// =====================================================
// CA FIRM STAFF MANAGEMENT PAGE
// Enterprise-grade staff management for CA firm admins
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
  FileText,
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
  Activity,
  IndianRupee,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CAFirmStaffManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('staff');

  // Fetch firm staff
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['caFirmStaff', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/api/ca-firm-admin/staff?search=${searchTerm}&role=${roleFilter}&status=${statusFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch staff statistics
  const { data: statsData } = useQuery({
    queryKey: ['caFirmStaffStats'],
    queryFn: async () => {
      const response = await api.get('/api/ca-firm-admin/staff/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const staff = staffData?.staff || [];
  const stats = statsData?.stats || {};

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (staffData) => {
      const response = await api.post('/api/ca-firm-admin/staff', staffData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmStaff']);
      queryClient.invalidateQueries(['caFirmStaffStats']);
      setShowAddForm(false);
      toast.success('Staff member added successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to add staff member: ${error.message}`);
    },
  });

  // Update staff status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ staffId, status }) => {
      const response = await api.put(`/api/ca-firm-admin/staff/${staffId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmStaff']);
      queryClient.invalidateQueries(['caFirmStaffStats']);
      toast.success('Staff status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update staff status: ${error.message}`);
    },
  });

  // Update staff role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ staffId, role }) => {
      const response = await api.put(`/api/ca-firm-admin/staff/${staffId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmStaff']);
      queryClient.invalidateQueries(['caFirmStaffStats']);
      toast.success('Staff role updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update staff role: ${error.message}`);
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId) => {
      const response = await api.delete(`/api/ca-firm-admin/staff/${staffId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmStaff']);
      queryClient.invalidateQueries(['caFirmStaffStats']);
      toast.success('Staff member removed successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to remove staff member: ${error.message}`);
    },
  });

  const handleStatusUpdate = (staffId, newStatus) => {
    updateStatusMutation.mutate({ staffId, status: newStatus });
  };

  const handleRoleUpdate = (staffId, newRole) => {
    updateRoleMutation.mutate({ staffId, role: newRole });
  };

  const handleDeleteStaff = (staffId, staffName) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to remove ${staffName}? This action cannot be undone.`)) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ca_firm_admin':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'senior_ca':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'ca':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'junior_ca':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'assistant':
        return <Users className="h-4 w-4 text-slate-500" />;
      default:
        return <Users className="h-4 w-4 text-slate-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ca_firm_admin':
        return 'bg-purple-100 text-purple-800';
      case 'senior_ca':
        return 'bg-yellow-100 text-yellow-800';
      case 'ca':
        return 'bg-green-100 text-green-800';
      case 'junior_ca':
        return 'bg-blue-100 text-blue-800';
      case 'assistant':
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
    { id: 'staff', name: 'All Staff', count: stats.total || 0 },
    { id: 'active', name: 'Active', count: stats.active || 0 },
    { id: 'cas', name: 'CAs', count: stats.cas || 0 },
    { id: 'pending', name: 'Pending', count: stats.pending || 0 },
  ];

  const filteredStaff = staff.filter(member => {
    if (selectedTab === 'staff') return true;
    if (selectedTab === 'cas') return ['ca', 'senior_ca', 'junior_ca'].includes(member.role);
    return member.status === selectedTab;
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
              <h1 className="text-heading-3 font-semibold text-slate-900">Staff Management</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/ca-firm-admin/staff/export')}
                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Staff</span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff</span>
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
                <p className="text-body-regular font-medium text-slate-600">Total Staff</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Active Staff</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">CAs</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.cas || 0}</p>
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-elevation-1 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff members..."
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
                <option value="ca_firm_admin">CA Firm Admin</option>
                <option value="senior_ca">Senior CA</option>
                <option value="ca">CA</option>
                <option value="junior_ca">Junior CA</option>
                <option value="assistant">Assistant</option>
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

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl shadow-elevation-1 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-heading-4 font-medium text-slate-900 mb-2">No staff members found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No staff members have been added yet'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-elevation-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-heading-4 font-semibold text-slate-900">
                {filteredStaff.length} Staff Member{filteredStaff.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <div key={member.staff_id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(member.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-slate-900">{member.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)} flex items-center space-x-1`}>
                            {getRoleIcon(member.role)}
                            <span>{member.role.replace('_', ' ')}</span>
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          {member.is_verified && (
                            <span className="px-2 py-1 text-body-small rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-regular text-slate-600">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{member.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{member.mobile || 'No mobile'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{member.total_clients || 0} clients</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4" />
                              <span>Activity Score: {member.activity_score || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <IndianRupee className="h-4 w-4" />
                              <span>Revenue: ₹{member.monthly_revenue || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-body-small text-slate-500">
                          Last Login: {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                          {member.last_activity && (
                            <span className="ml-4">
                              Last Activity: {new Date(member.last_activity).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/ca-firm-admin/staff/${member.staff_id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/ca-firm-admin/staff/${member.staff_id}/edit`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                        title="Edit Staff"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {member.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(member.staff_id, 'active')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                          title="Approve Staff"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {member.role !== 'ca_firm_admin' && (
                        <button
                          onClick={() => handleRoleUpdate(member.staff_id, 'ca')}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-colors"
                          title="Promote to CA"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}

                      {member.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(member.staff_id, 'suspended')}
                          className="p-2 text-gold-600 hover:text-gold-800 hover:bg-gold-50 rounded-xl transition-colors"
                          title="Suspend Staff"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteStaff(member.staff_id, member.name)}
                        className="p-2 text-error-600 hover:text-red-800 hover:bg-error-50 rounded-xl transition-colors"
                        title="Remove Staff"
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

        {/* Add Staff Form Modal */}
        {showAddForm && (
          <AddStaffForm
            onClose={() => setShowAddForm(false)}
            onSubmit={addStaffMutation.mutate}
            isLoading={addStaffMutation.isLoading}
          />
        )}
      </main>
    </div>
  );
};

// Add Staff Form Component
const AddStaffForm = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'assistant',
    status: 'pending',
    designation: '',
    department: '',
    joining_date: '',
    salary: '',
    is_verified: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Add New Staff Member</h3>

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
              <option value="assistant">Assistant</option>
              <option value="junior_ca">Junior CA</option>
              <option value="ca">CA</option>
              <option value="senior_ca">Senior CA</option>
            </select>
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter designation"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter department"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Joining Date
            </label>
            <input
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Salary
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter salary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={formData.is_verified}
              onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_verified" className="text-body-regular font-medium text-slate-700">
              Verified Staff Member
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
              {isLoading ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CAFirmStaffManagement;
