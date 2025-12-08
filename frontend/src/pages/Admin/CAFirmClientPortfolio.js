// =====================================================
// CA FIRM CLIENT PORTFOLIO PAGE
// Enterprise-grade client portfolio management for CA firm admins
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
  Activity,
  IndianRupee,
  FileText,
  MapPin,
  Plus,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CAFirmClientPortfolio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  // Fetch firm clients
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['caFirmClients', searchTerm, statusFilter, tierFilter],
    queryFn: async () => {
      const response = await api.get(`/api/ca-firm-admin/clients?search=${searchTerm}&status=${statusFilter}&tier=${tierFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch client statistics
  const { data: statsData } = useQuery({
    queryKey: ['caFirmClientStats'],
    queryFn: async () => {
      const response = await api.get('/api/ca-firm-admin/clients/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const clients = clientsData?.clients || [];
  const stats = statsData?.stats || {};

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (clientData) => {
      const response = await api.post('/api/ca-firm-admin/clients', clientData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmClients']);
      queryClient.invalidateQueries(['caFirmClientStats']);
      setShowAddForm(false);
      toast.success('Client added successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });

  // Update client status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }) => {
      const response = await api.put(`/api/ca-firm-admin/clients/${clientId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmClients']);
      queryClient.invalidateQueries(['caFirmClientStats']);
      toast.success('Client status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  // Update client tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ clientId, tier }) => {
      const response = await api.put(`/api/ca-firm-admin/clients/${clientId}/tier`, { tier });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmClients']);
      queryClient.invalidateQueries(['caFirmClientStats']);
      toast.success('Client tier updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update client tier: ${error.message}`);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId) => {
      const response = await api.delete(`/api/ca-firm-admin/clients/${clientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caFirmClients']);
      queryClient.invalidateQueries(['caFirmClientStats']);
      toast.success('Client removed successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to remove client: ${error.message}`);
    },
  });

  const handleStatusUpdate = (clientId, newStatus) => {
    updateStatusMutation.mutate({ clientId, status: newStatus });
  };

  const handleTierUpdate = (clientId, newTier) => {
    updateTierMutation.mutate({ clientId, tier: newTier });
  };

  const handleDeleteClient = (clientId, clientName) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to remove ${clientName}? This action cannot be undone.`)) {
      deleteClientMutation.mutate(clientId);
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
        return <Users className="h-4 w-4 text-gray-500" />;
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

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'premium':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'standard':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'basic':
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'standard':
        return 'bg-yellow-100 text-yellow-800';
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'all', name: 'All Clients', count: stats.total || 0 },
    { id: 'active', name: 'Active', count: stats.active || 0 },
    { id: 'premium', name: 'Premium', count: stats.premium || 0 },
    { id: 'pending', name: 'Pending', count: stats.pending || 0 },
  ];

  const filteredClients = clients.filter(client => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'premium') return client.tier === 'premium';
    return client.status === selectedTab;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Client Portfolio</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/ca-firm-admin/clients/export')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Portfolio</span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Premium Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.premium || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.monthly_revenue || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="basic">Basic</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No clients have been added yet'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Client
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredClients.length} Client{filteredClients.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <div key={client.client_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(client.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{client.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(client.tier)} flex items-center space-x-1`}>
                            {getTierIcon(client.tier)}
                            <span>{client.tier}</span>
                          </span>
                          {client.is_verified && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{client.mobile || 'No mobile'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{client.city}, {client.state}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{client.total_filings || 0} filings</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4" />
                              <span>Activity Score: {client.activity_score || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <IndianRupee className="h-4 w-4" />
                              <span>Revenue: ₹{client.monthly_revenue || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Joined: {new Date(client.created_at).toLocaleDateString()}
                          {client.last_activity && (
                            <span className="ml-4">
                              Last Activity: {new Date(client.last_activity).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/ca-firm-admin/clients/${client.client_id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/ca-firm-admin/clients/${client.client_id}/edit`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Client"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {client.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(client.client_id, 'active')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate Client"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {client.tier !== 'premium' && (
                        <button
                          onClick={() => handleTierUpdate(client.client_id, 'premium')}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Upgrade to Premium"
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      )}

                      {client.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(client.client_id, 'suspended')}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Suspend Client"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteClient(client.client_id, client.name)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Client"
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

        {/* Add Client Form Modal */}
        {showAddForm && (
          <AddClientForm
            onClose={() => setShowAddForm(false)}
            onSubmit={addClientMutation.mutate}
            isLoading={addClientMutation.isLoading}
          />
        )}
      </main>
    </div>
  );
};

// Add Client Form Component
const AddClientForm = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    pan_number: '',
    aadhaar_number: '',
    tier: 'basic',
    status: 'pending',
    is_verified: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Client</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN Number *
            </label>
            <input
              type="text"
              required
              value={formData.pan_number}
              onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PAN number"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={formData.address_line_1}
              onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address line 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter city"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode *
            </label>
            <input
              type="text"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter pincode"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_verified" className="text-sm font-medium text-gray-700">
              Verified Client
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CAFirmClientPortfolio;
