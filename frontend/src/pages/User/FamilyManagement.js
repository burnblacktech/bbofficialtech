// =====================================================
// MOBILE-FIRST FAMILY MANAGEMENT PAGE
// Touch-friendly family member management for all devices
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  User,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Search,
  Filter,
  ChevronRight,
  Users,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { enterpriseLogger } from '../../utils/logger';

const FamilyManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);

  // Family member form state
  const [memberData, setMemberData] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    panNumber: '',
    aadharNumber: '',
    isDependent: true,
    income: 0,
  });

  // Fetch family members
  const { data: familyData, isLoading } = useQuery({
    queryKey: ['familyMembers', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/family');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const familyMembers = familyData?.data?.familyMembers || [];

  // Add family member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData) => {
      const response = await api.post('/family', memberData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['familyMembers', user?.user_id]);
      setShowAddForm(false);
      resetForm();
    },
  });

  // Update family member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, memberData }) => {
      const response = await api.put(`/family/${memberId}`, memberData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['familyMembers', user?.user_id]);
      setEditingMember(null);
      resetForm();
    },
  });

  // Delete family member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      const response = await api.delete(`/family/${memberId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['familyMembers', user?.user_id]);
    },
  });

  const resetForm = () => {
    setMemberData({
      firstName: '',
      lastName: '',
      relationship: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      panNumber: '',
      aadharNumber: '',
      isDependent: true,
      income: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMemberData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMember) {
        await updateMemberMutation.mutateAsync({
          memberId: editingMember.id,
          memberData,
        });
      } else {
        await addMemberMutation.mutateAsync(memberData);
      }
    } catch (error) {
      enterpriseLogger.error('Error saving family member:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setMemberData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || '',
      dateOfBirth: member.dateOfBirth || '',
      phone: member.phone || '',
      email: member.email || '',
      panNumber: member.panNumber || '',
      aadharNumber: member.aadharNumber || '',
      isDependent: member.isDependent || true,
      income: member.income || 0,
    });
    setShowAddForm(true);
  };

  const handleDelete = (memberId) => {
    if (window.confirm('Are you sure you want to delete this family member?')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const getRelationshipIcon = (relationship) => {
    switch (relationship?.toLowerCase()) {
      case 'spouse':
        return <User className="h-4 w-4 text-pink-600" />;
      case 'child':
        return <User className="h-4 w-4 text-info-500" />;
      case 'parent':
        return <User className="h-4 w-4 text-success-500" />;
      case 'sibling':
        return <User className="h-4 w-4 text-gold-500" />;
      default:
        return <User className="h-4 w-4 text-slate-600" />;
    }
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredMembers = familyMembers.filter(member => {
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
    const relationship = member.relationship?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    return fullName.includes(searchLower) ||
           relationship.includes(searchLower) ||
           member.email?.toLowerCase().includes(searchLower);
  });

  const relationshipOptions = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Other',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-body-regular text-neutral-600">Loading family members...</p>
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
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-burnblack-black">Family Members</h1>
                <p className="text-body-small text-neutral-500">{filteredMembers.length} members</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingMember(null);
                resetForm();
              }}
              className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Family Members List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="dashboard-card-burnblack p-8 text-center">
              <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-burnblack-black mb-2">No family members</h3>
              <p className="text-body-regular text-neutral-500 mb-4">
                {searchTerm ? 'No members match your search' : 'Add your first family member to get started'}
              </p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingMember(null);
                  resetForm();
                }}
                className="btn-burnblack px-4 py-2 rounded-xl active:scale-95 transition-transform"
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Add Family Member
              </button>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="dashboard-card-burnblack hover:shadow-elevation-1 transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-xl bg-slate-50">
                      {getRelationshipIcon(member.relationship)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="text-body-small text-slate-500 capitalize">{member.relationship}</p>
                      <div className="flex items-center space-x-3 mt-1 text-body-small text-slate-500">
                        <span>Age: {getAge(member.date_of_birth)}</span>
                        {member.is_dependent && (
                          <span className="bg-success-50 text-success-600 px-2 py-1 rounded-full">
                            Dependent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-1 rounded hover:bg-gold-50 active:scale-95 transition-transform"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-gold-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1 rounded hover:bg-error-100 active:scale-95 transition-transform"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-error-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-body-small">
                  {member.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600 truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600">{member.phone}</span>
                    </div>
                  )}
                  {member.pan_number && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600 font-mono">{member.pan_number}</span>
                    </div>
                  )}
                  {member.annual_income > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">₹</span>
                      <span className="text-slate-600">{member.annual_income.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add/Edit Family Member Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-heading-4 font-semibold text-slate-900">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMember(null);
                  resetForm();
                }}
                className="p-1 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-small font-medium text-slate-700 mb-1 block">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={memberData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="text-body-small font-medium text-slate-700 mb-1 block">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={memberData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="text-body-small font-medium text-slate-700 mb-1 block">Relationship</label>
                <select
                  name="relationship"
                  value={memberData.relationship}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-body-small font-medium text-slate-700 mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={memberData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contact Information */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={memberData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="text-body-small font-medium text-slate-700 mb-1 block">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={memberData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-small font-medium text-slate-700 mb-1 block">PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={memberData.panNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="text-body-small font-medium text-slate-700 mb-1 block">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={memberData.aadharNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Aadhar number"
                    maxLength={12}
                  />
                </div>
              </div>

              <div>
                <label className="text-body-small font-medium text-slate-700 mb-1 block">Annual Income (₹)</label>
                <input
                  type="number"
                  name="income"
                  value={memberData.income}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter annual income"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isDependent"
                  checked={memberData.isDependent}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-gold-500 focus:ring-gold-500"
                />
                <label className="text-body-regular text-slate-700">Mark as dependent</label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-xl text-body-regular font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gold-500 text-white py-2 px-4 rounded-xl hover:bg-gold-600 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    editingMember ? 'Update Member' : 'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-body-small">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gold-600">
            <Users className="h-5 w-5 mb-1" />
            <span className="text-body-small font-medium">Family</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-body-small">Settings</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default FamilyManagement;
