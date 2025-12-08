// =====================================================
// ADMIN CA FIRMS PAGE
// Enterprise-grade CA firm management with DesignSystem
// =====================================================
/* eslint-disable camelcase */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Building2,
  Users,
  FileText,
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
  Star,
  MapPin,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCAFirms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch CA firms
  const { data: firmsData, isLoading } = useQuery({
    queryKey: ['adminCAFirms', searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/admin/ca-firms?search=${searchTerm}&status=${statusFilter}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch CA firm statistics
  const { data: statsData } = useQuery({
    queryKey: ['adminCAFirmStats'],
    queryFn: async () => {
      const response = await api.get('/admin/ca-firms/stats');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const firms = firmsData?.firms || [];
  const stats = statsData?.stats || {};

  // Add CA firm mutation
  const addFirmMutation = useMutation({
    mutationFn: async (firmData) => {
      const response = await api.post('/admin/ca-firms', firmData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCAFirms']);
      queryClient.invalidateQueries(['adminCAFirmStats']);
      setShowAddForm(false);
      toast.success('CA firm added successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to add CA firm: ${error.message}`);
    },
  });

  // Update CA firm status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ firmId, status }) => {
      const response = await api.put(`/admin/ca-firms/${firmId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCAFirms']);
      queryClient.invalidateQueries(['adminCAFirmStats']);
      toast.success('CA firm status updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update CA firm: ${error.message}`);
    },
  });

  // Delete CA firm mutation
  const deleteFirmMutation = useMutation({
    mutationFn: async (firmId) => {
      const response = await api.delete(`/admin/ca-firms/${firmId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCAFirms']);
      queryClient.invalidateQueries(['adminCAFirmStats']);
      toast.success('CA firm deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete CA firm: ${error.message}`);
    },
  });

  const handleStatusUpdate = (firmId, newStatus) => {
    updateStatusMutation.mutate({ firmId, status: newStatus });
  };

  const handleDeleteFirm = (firmId, firmName) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to delete ${firmName}? This action cannot be undone.`)) {
      deleteFirmMutation.mutate(firmId);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      default:
        return <Building2 className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'inactive':
        return 'bg-error-100 text-error-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'suspended':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading CA firms...</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">CA Firm Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage CA firms and their registrations
            </Typography.Body>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add CA Firm
          </Button>
        </div>

        {/* Statistics Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-info-600" />
                  </div>
                  <div className="ml-4">
                    <Typography.Small className="text-neutral-500">Total Firms</Typography.Small>
                    <Typography.H3>{stats.total || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <Typography.Small className="text-neutral-500">Active</Typography.Small>
                    <Typography.H3>{stats.active || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="ml-4">
                    <Typography.Small className="text-neutral-500">Pending</Typography.Small>
                    <Typography.H3>{stats.pending || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div className="ml-4">
                    <Typography.Small className="text-neutral-500">Total CAs</Typography.Small>
                    <Typography.H3>{stats.total_cas || 0}</Typography.H3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search CA firms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CA Firms List */}
        {firms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-neutral-400" />
              </div>
              <Typography.H3 className="mb-2">No CA firms found</Typography.H3>
              <Typography.Body className="text-neutral-600 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No CA firms have been registered yet'
                }
              </Typography.Body>
              <Button onClick={() => setShowAddForm(true)}>
                Add First CA Firm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{firms.length} CA Firm{firms.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StaggerContainer className="divide-y divide-neutral-200">
                {firms.map((firm) => (
                  <StaggerItem key={firm.firm_id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(firm.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Typography.Body className="font-semibold">{firm.firm_name}</Typography.Body>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(firm.status)}`}>
                              {firm.status}
                            </span>
                            {firm.is_premium && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-secondary-100 text-secondary-700 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Premium
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-neutral-600">
                                <MapPin className="h-4 w-4" />
                                <span>{firm.city}, {firm.state}</span>
                              </div>
                              <div className="flex items-center gap-2 text-neutral-600">
                                <Phone className="h-4 w-4" />
                                <span>{firm.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-neutral-600">
                                <Mail className="h-4 w-4" />
                                <span>{firm.email}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-neutral-600">
                                <Users className="h-4 w-4" />
                                <span>{firm.total_cas || 0} CAs</span>
                              </div>
                              <div className="flex items-center gap-2 text-neutral-600">
                                <FileText className="h-4 w-4" />
                                <span>{firm.total_clients || 0} clients</span>
                              </div>
                              <div className="flex items-center gap-2 text-neutral-600">
                                <IndianRupee className="h-4 w-4" />
                                <span>₹{firm.monthly_revenue || 0}</span>
                              </div>
                            </div>
                          </div>

                          <Typography.Small className="text-neutral-500 mt-2 block">
                            Registered: {new Date(firm.created_at).toLocaleDateString()}
                            {firm.last_activity && (
                              <span className="ml-4">
                                Last Activity: {new Date(firm.last_activity).toLocaleDateString()}
                              </span>
                            )}
                          </Typography.Small>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/ca-firms/${firm.firm_id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/ca-firms/${firm.firm_id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {firm.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(firm.firm_id, 'active')}
                            className="text-success-600 hover:bg-success-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {firm.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(firm.firm_id, 'suspended')}
                            className="text-warning-600 hover:bg-warning-50"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFirm(firm.firm_id, firm.firm_name)}
                          className="text-error-600 hover:bg-error-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </CardContent>
          </Card>
        )}

        {/* Add CA Firm Modal */}
        {showAddForm && (
          <AddCAFirmForm
            onClose={() => setShowAddForm(false)}
            onSubmit={addFirmMutation.mutate}
            isLoading={addFirmMutation.isLoading}
          />
        )}
      </div>
    </PageTransition>
  );
};

// Add CA Firm Form Component
const AddCAFirmForm = ({ onClose, onSubmit, isLoading }) => {
  // eslint-disable-next-line camelcase
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
    is_premium: false,
    status: 'pending',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add New CA Firm</CardTitle>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Firm Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firm_name}
                  onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter firm name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Registration Number <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email <span className="text-error-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone <span className="text-error-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Contact Person Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_person_name}
                  onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  PAN Number <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter PAN number"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Address Line 1 <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address_line_1}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter address line 1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  City <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  State <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Pincode <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter pincode"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_premium" className="text-sm font-medium text-neutral-700">
                Premium Firm
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add CA Firm'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCAFirms;
