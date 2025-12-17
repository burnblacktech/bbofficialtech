// =====================================================
// CA CLIENT MANAGEMENT - MOBILE-FIRST CLIENT ADMINISTRATION
// Enterprise-grade client management for Chartered Accountants
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  FileText,
  IndianRupee,
  Star,
  MessageCircle,
  Download,
  RefreshCw,
  UserPlus,
  FileCheck,
  TrendingUp,
  X,
} from 'lucide-react';

const CAClientManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);

  // Fetch clients
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['caClients'],
    queryFn: async () => {
      const response = await api.get('/ca/clients');
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const clients = clientsData?.clients || [];

  // Update client status mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, status }) => {
      const response = await api.patch(`/ca/clients/${clientId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caClients']);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId) => {
      const response = await api.delete(`/ca/clients/${clientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['caClients']);
    },
  });

  const handleStatusChange = (clientId, newStatus) => {
    updateClientMutation.mutate({ clientId, status: newStatus });
  };

  const handleDeleteClient = (clientId) => {
    if (window.confirm('Are you sure you want to remove this client? This action cannot be undone.')) {
      deleteClientMutation.mutate(clientId);
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
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getClientTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'individual':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'business':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'huf':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-slate-600" />;
    }
  };

  const getClientTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'individual':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-green-100 text-green-800';
      case 'huf':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.pan?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesType = filterType === 'all' || client.client_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOptions = ['all', 'active', 'inactive', 'pending', 'suspended'];
  const typeOptions = ['all', 'individual', 'business', 'huf'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-body-regular text-neutral-600">Loading clients...</p>
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
                onClick={() => navigate('/ca/dashboard')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-burnblack-black">Client Management</h1>
                <p className="text-body-small text-neutral-500">{filteredClients.length} clients</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <Filter className="h-5 w-5 text-burnblack-black" />
              </button>
              <button
                onClick={() => navigate('/ca/clients/new')}
                className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform"
              >
                <Plus className="h-5 w-5" />
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
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burnblack-gold focus:border-transparent"
          />
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="dashboard-card-burnblack p-4 space-y-3">
            {/* Status Filter */}
            <div>
              <label className="text-body-small font-medium text-neutral-700 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-burnblack-gold"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-body-small font-medium text-neutral-700 mb-2 block">Client Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-burnblack-gold"
              >
                {typeOptions.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Clients List */}
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <div className="dashboard-card-burnblack p-8 text-center">
              <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-burnblack-black mb-2">No clients found</h3>
              <p className="text-body-regular text-neutral-500 mb-4">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'No clients match your filters'
                  : 'Add your first client to get started'}
              </p>
              <button
                onClick={() => navigate('/ca/clients/new')}
                className="btn-burnblack px-4 py-2 rounded-xl active:scale-95 transition-transform"
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Add Client
              </button>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="dashboard-card-burnblack hover:shadow-elevation-1 transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-xl bg-neutral-50">
                      {getClientTypeIcon(client.client_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-burnblack-black">{client.name}</h3>
                      <p className="text-body-small text-neutral-500">{client.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getClientTypeColor(client.client_type)}`}>
                          {client.client_type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center space-x-1 ${getStatusColor(client.status)}`}>
                          {getStatusIcon(client.status)}
                          <span className="capitalize">{client.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientModal(true);
                      }}
                      className="p-1 rounded hover:bg-neutral-100 active:scale-95 transition-transform"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-body-small">
                  {client.pan && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">{client.pan}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-neutral-400" />
                    <span className="text-neutral-600">
                      Added {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {client.total_filings > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileCheck className="h-3 w-3 text-neutral-400" />
                      <span className="text-neutral-600">{client.total_filings} filings</span>
                    </div>
                  )}
                </div>

                {/* Client Stats */}
                {client.total_filings > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-sm font-semibold text-burnblack-black">{client.completed_filings || 0}</div>
                        <div className="text-body-small text-neutral-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-burnblack-black">{client.pending_filings || 0}</div>
                        <div className="text-body-small text-neutral-500">Pending</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-burnblack-black">₹{client.total_revenue?.toLocaleString() || 0}</div>
                        <div className="text-body-small text-neutral-500">Revenue</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Client Actions Modal */}
      {selectedClient && showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="dashboard-card-burnblack w-full max-w-md">
            <div className="sticky top-0 bg-burnblack-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-heading-4 font-semibold text-burnblack-black">Client Actions</h2>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setShowClientModal(false);
                }}
                className="p-1 rounded-xl hover:bg-neutral-100"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* View Profile */}
              <button
                onClick={() => {
                  navigate(`/ca/clients/${selectedClient.id}`);
                  setShowClientModal(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-50 text-neutral-700 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <Eye className="h-4 w-4" />
                <span>View Profile</span>
              </button>

              {/* Message Client */}
              <button
                onClick={() => {
                  navigate(`/ca/messages/${selectedClient.id}`);
                  setShowClientModal(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-50 text-neutral-700 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send Message</span>
              </button>

              {/* Status Actions */}
              <div>
                <h3 className="text-sm font-medium text-burnblack-black mb-2">Change Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['active', 'inactive', 'pending', 'suspended'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedClient.id, status);
                        setShowClientModal(false);
                      }}
                      disabled={selectedClient.status === status}
                      className={`p-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedClient.status === status
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
                    handleDeleteClient(selectedClient.id);
                    setShowClientModal(false);
                  }}
                  className="w-full bg-error-600 text-white py-2 px-4 rounded-xl hover:bg-error-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Client</span>
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

export default CAClientManagement;
