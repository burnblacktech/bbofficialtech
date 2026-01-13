// =====================================================
// PLATFORM CA FIRMS PAGE
// Enterprise-grade CA firm registry management for platform admins
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  IndianRupee,
  Filter,
  Download,
  Star,
  MapPin,
  Phone,
  Mail,
  Crown,
  UserCheck,
  Activity,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../../components/UI';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const PlatformCAFirms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  // Fetch CA firms
  const { data: firmsData, isLoading } = useQuery({
    queryKey: ['platformCAFirms', searchTerm, statusFilter, tierFilter],
    queryFn: async () => {
      const response = await api.get(`/api/platform-admin/ca-firms?search=${searchTerm}&status=${statusFilter}&tier=${tierFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch CA firm statistics
  const { data: statsData } = useQuery({
    queryKey: ['platformCAFirmStats'],
    queryFn: async () => {
      const response = await api.get('/api/platform-admin/ca-firms/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const firms = firmsData?.firms || [];
  const stats = statsData?.stats || {};

  // Add CA firm mutation
  const addFirmMutation = useMutation({
    mutationFn: async (firmData) => {
      const response = await api.post('/api/platform-admin/ca-firms', firmData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformCAFirms']);
      queryClient.invalidateQueries(['platformCAFirmStats']);
      setShowAddForm(false);
      toast.success('CA firm registered successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to register CA firm: ${error.message}`);
    }
  });

  // Update CA firm status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ firmId, status }) => {
      const response = await api.put(`/api/platform-admin/ca-firms/${firmId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformCAFirms']);
      queryClient.invalidateQueries(['platformCAFirmStats']);
      toast.success('CA firm status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update CA firm: ${error.message}`);
    }
  });

  // Update CA firm tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ firmId, tier }) => {
      const response = await api.put(`/api/platform-admin/ca-firms/${firmId}/tier`, { tier });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformCAFirms']);
      queryClient.invalidateQueries(['platformCAFirmStats']);
      toast.success('CA firm tier updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update CA firm tier: ${error.message}`);
    }
  });

  const handleStatusUpdate = (firmId, newStatus) => {
    updateStatusMutation.mutate({ firmId, status: newStatus });
  };

  const handleTierUpdate = (firmId, newTier) => {
    updateTierMutation.mutate({ firmId, tier: newTier });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-purple-500" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-error-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'suspended':
        return 'bg-error-100 text-red-800';
      case 'under_review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'premium':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'standard':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'basic':
        return <Building2 className="h-4 w-4 text-slate-500" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'standard':
        return 'bg-yellow-100 text-yellow-800';
      case 'basic':
        return 'bg-slate-100 text-gray-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'all', name: 'All Firms', count: stats.total || 0 },
    { id: 'active', name: 'Active', count: stats.active || 0 },
    { id: 'pending', name: 'Pending', count: stats.pending || 0 },
    { id: 'premium', name: 'Premium', count: stats.premium || 0 },
  ];

  const filteredFirms = firms.filter(firm => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'premium') return firm.tier === 'premium';
    return firm.status === selectedTab;
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
              <h1 className="text-heading-3 font-semibold text-slate-900">CA Firm Registry</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/platform-admin/ca-firms/export')}
                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Registry</span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Register Firm</span>
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
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Total Firms</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Active Firms</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Premium Firms</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.premium || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-body-regular font-medium text-slate-600">Total CAs</p>
                <p className="text-heading-2 font-semibold text-slate-900">{stats.total_cas || 0}</p>
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
                placeholder="Search CA firms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
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
                <option value="under_review">Under Review</option>
              </select>
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="basic">Basic</option>
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
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <span>{tab.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* CA Firms List */}
        {filteredFirms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-elevation-1 p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-heading-4 font-medium text-slate-900 mb-2">No CA firms found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No CA firms have been registered yet'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Register First CA Firm
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-elevation-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-heading-4 font-semibold text-slate-900">
                {filteredFirms.length} CA Firm{filteredFirms.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredFirms.map((firm) => (
                <div key={firm.firm_id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(firm.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-slate-900">{firm.firm_name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(firm.status)}`}>
                            {firm.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(firm.tier)} flex items-center space-x-1`}>
                            {getTierIcon(firm.tier)}
                            <span>{firm.tier}</span>
                          </span>
                          {firm.is_verified && (
                            <span className="px-2 py-1 text-body-small rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-regular text-slate-600">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{firm.city}, {firm.state}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{firm.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{firm.email}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{firm.total_cas || 0} CAs</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{firm.total_clients || 0} clients</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <IndianRupee className="h-4 w-4" />
                              <span>₹{firm.monthly_revenue || 0}/month</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-body-small text-slate-500">
                          Registered: {new Date(firm.created_at).toLocaleDateString()}
                          {firm.last_activity && (
                            <span className="ml-4">
                              Last Activity: {new Date(firm.last_activity).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/platform-admin/ca-firms/${firm.firm_id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/platform-admin/ca-firms/${firm.firm_id}/edit`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                        title="Edit Firm"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {firm.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(firm.firm_id, 'active')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-colors"
                          title="Approve Firm"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {firm.tier !== 'premium' && (
                        <button
                          onClick={() => handleTierUpdate(firm.firm_id, 'premium')}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-colors"
                          title="Upgrade to Premium"
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      )}

                      {firm.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(firm.firm_id, 'suspended')}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-xl transition-colors"
                          title="Suspend Firm"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add CA Firm Form Modal */}
        {showAddForm && (
          <AddCAFirmForm
            onClose={() => setShowAddForm(false)}
            onSubmit={addFirmMutation.mutate}
            isLoading={addFirmMutation.isLoading}
          />
        )}
      </main>
    </div>
  );
};

// Add CA Firm Form Component
const AddCAFirmForm = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    firm_name: '',
    registration_number: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    gst_number: '',
    pan_number: '',
    tier: 'basic',
    status: 'pending',
    is_verified: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-heading-4 font-semibold text-slate-900 mb-4">Register New CA Firm</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Firm Name *
              </label>
              <input
                type="text"
                required
                value={formData.firm_name}
                onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter firm name"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter registration number"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={formData.contact_person_name}
                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Contact Person Email *
              </label>
              <input
                type="email"
                required
                value={formData.contact_person_email}
                onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact person email"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Contact Person Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.contact_person_phone}
                onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact person phone"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                PAN Number *
              </label>
              <input
                type="text"
                required
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter PAN number"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={formData.address_line_1}
              onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address line 1"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.address_line_2}
              onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address line 2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter city"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter state"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter pincode"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
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
                Verified Firm
              </label>
            </div>
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
              {isLoading ? 'Registering...' : 'Register CA Firm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformCAFirms;
