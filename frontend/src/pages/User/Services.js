// =====================================================
// MOBILE-FIRST SERVICES PAGE
// Touch-friendly service management for all devices
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Edit,
  MoreVertical,
  FileText,
  User,
  DollarSign,
  Settings,
  ChevronRight,
  ChevronDown,
  Star,
  MessageCircle,
} from 'lucide-react';
import api from '../../services/api';

const Services = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['userServices', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/services/user-services');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const services = servicesData?.services || [];

  // Update service status mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, status }) => {
      const response = await api.patch(`/services/${serviceId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userServices', user?.user_id]);
    },
  });

  const handleStatusChange = (serviceId, newStatus) => {
    updateServiceMutation.mutate({ serviceId, status: newStatus });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'in_progress':
        return <Clock className="h-3 w-3" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      case 'on_hold':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getServiceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'itr_filing':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'tax_consultation':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'audit':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'other':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getServiceTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'itr_filing':
        return 'ITR Filing';
      case 'tax_consultation':
        return 'Tax Consultation';
      case 'audit':
        return 'Audit';
      case 'other':
        return 'Other';
      default:
        return type || 'Unknown';
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getServiceTypeLabel(service.service_type).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || service.status === filterStatus;
    const matchesType = filterType === 'all' || service.service_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'itr_filing', label: 'ITR Filing' },
    { value: 'tax_consultation', label: 'Tax Consultation' },
    { value: 'audit', label: 'Audit' },
    { value: 'other', label: 'Other' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-sm text-neutral-600">Loading services...</p>
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
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-burnblack-black">Services</h1>
                <p className="text-xs text-neutral-500">{filteredServices.length} services</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <Filter className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Service Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-3">
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'No services match your filters'
                  : 'No services available'}
              </p>
              <button
                onClick={() => navigate('/filing/start')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Request Service
              </button>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-lg bg-gray-50">
                      {getServiceIcon(service.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{service.title}</h3>
                      <p className="text-xs text-gray-500">{getServiceTypeLabel(service.service_type)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center space-x-1 ${getStatusColor(service.status)}`}>
                          {getStatusIcon(service.status)}
                          <span className="capitalize">{service.status.replace('_', ' ')}</span>
                        </span>
                        {service.priority === 'high' && (
                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="p-1 rounded hover:bg-gray-100 active:scale-95 transition-transform"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {service.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      Created {new Date(service.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      Updated {new Date(service.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {service.assigned_to && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Assigned to CA</span>
                    </div>
                  )}
                  {service.estimated_amount > 0 && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">₹{service.estimated_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar for In Progress Services */}
                {service.status === 'in_progress' && service.progress && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{service.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${service.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Service Actions Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Service Actions</h2>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* View Details */}
              <button
                onClick={() => {
                  navigate(`/services/${selectedService.id}`);
                  setSelectedService(null);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:scale-95 transition-transform"
              >
                <Eye className="h-4 w-4" />
                <span>View Details</span>
              </button>

              {/* Status Actions */}
              {selectedService.status !== 'completed' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Change Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['in_progress', 'on_hold', 'completed', 'cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusChange(selectedService.id, status);
                          setSelectedService(null);
                        }}
                        disabled={selectedService.status === status}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedService.status === status
                            ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <button
                onClick={() => {
                  navigate('/support');
                  setSelectedService(null);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:scale-95 transition-transform"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-blue-600">
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Services</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default Services;
