import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Building2 } from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard } from '../../components/DesignSystem/EnterpriseComponents';
import api from '../../services/api';
import { enterpriseLogger } from '../../utils/logger';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0 });

  // Fetch clients data
  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }) });

      const response = await api.get(`/client-management/clients?${params}`);

      if (response.data.success) {
        setClients(response.data.clients);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      enterpriseLogger.error('Error fetching clients:', { error });
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/client-management/statistics');
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      enterpriseLogger.error('Error fetching statistics:', { error });
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStatistics();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClients(1);
    }, 500);

  return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (newPage) => {
    fetchClients(newPage);
  };

  const handleAddClient = async (clientData) => {
    try {
      const response = await api.post('/client-management/clients', clientData);
      if (response.data.success) {
        setShowAddClient(false);
        fetchClients();
        fetchStatistics();
      }
    } catch (error) {
      enterpriseLogger.error('Error adding client:', { error });
    }
  };

  const handleUpdateClient = async (clientId, updateData) => {
    try {
      const response = await api.put(`/client-management/clients/${clientId}`, updateData);
      if (response.data.success) {
        fetchClients();
        fetchStatistics();
      }
    } catch (error) {
      enterpriseLogger.error('Error updating client:', { error });
    }
  };

  const handleRemoveClient = async (clientId) => {
    try {
      const response = await api.delete(`/client-management/clients/${clientId}`);
      if (response.data.success) {
        fetchClients();
        fetchStatistics();
      }
    } catch (error) {
      enterpriseLogger.error('Error removing client:', { error });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-error-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-error-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-1 font-bold text-slate-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Client Management
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your CA firm clients and their filing activities
            </p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Add Client
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-body-regular font-medium text-slate-600">Total Clients</p>
              <p className="text-heading-2 font-bold text-slate-900">{statistics.total_clients || 0}</p>
            </div>
                </Card>
        </div>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-xl">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-body-regular font-medium text-slate-600">Active Clients</p>
              <p className="text-heading-2 font-bold text-slate-900">{statistics.active_clients || 0}</p>
            </div>
                </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-xl">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-body-regular font-medium text-slate-600">Assigned Clients</p>
              <p className="text-heading-2 font-bold text-slate-900">{statistics.assigned_clients || 0}</p>
            </div>
                </Card>
        </div>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-gold-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-gold-600" />
            </div>
            <div className="ml-4">
              <p className="text-body-regular font-medium text-slate-600">Family Clients</p>
              <p className="text-heading-2 font-bold text-slate-900">{statistics.family_clients || 0}</p>
            </div>
                </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by name, PAN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
                </Card>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-elevation-1 border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  PAN
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Assigned CA
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Filings
                </th>
                <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-slate-500">Loading clients...</p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No clients found</p>
                    <p className="text-slate-400 text-body-regular">Add your first client to get started</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-body-regular">
                            {client.client_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-body-regular font-medium text-slate-900">
                            {client.client_name}
                          </div>
                          <div className="text-body-regular text-slate-500">
                            {client.relationship_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body-regular font-mono text-slate-900">
                        {client.client_pan}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body-regular text-slate-900">{client.client_email}</div>
                      <div className="text-body-regular text-slate-500">{client.client_mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.assigned_ca_name ? (
                        <div>
                          <div className="text-body-regular font-medium text-slate-900">
                            {client.assigned_ca_name}
                          </div>
                          <div className="text-body-regular text-slate-500">
                            {client.assigned_ca_email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-body-regular text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body-regular text-slate-900">
                        {client.completed_filings || 0} / {client.total_filings || 0}
                      </div>
                      <div className="text-body-regular text-slate-500">completed</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-body-regular font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-slate-600 hover:text-slate-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-error-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-body-regular font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-body-regular font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-body-regular text-slate-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-elevation-1 -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-body-regular font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-body-regular font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={handleAddClient}
        />
      )}
    </div>
  );
};

// Add Client Modal Component
const AddClientModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    clientPan: '',
    clientName: '',
    clientEmail: '',
    clientMobile: '',
    relationshipType: 'client' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-elevation-3 rounded-xl bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading-4 font-medium text-slate-900">Add New Client</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Client PAN *
              </label>
              <input
                type="text"
                name="clientPan"
                value={formData.clientPan}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                name="clientMobile"
                value={formData.clientMobile}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Relationship Type
              </label>
              <select
                name="relationshipType"
                value={formData.relationshipType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="family">Family</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-body-regular font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-body-regular font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
