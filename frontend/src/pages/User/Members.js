// =====================================================
// MOBILE-FIRST MEMBERS PAGE
// Touch-friendly member management for all devices
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
  Crown,
  Shield,
  Star,
  MoreVertical,
  X,
} from 'lucide-react';
import api from '../../services/api';

const Members = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch members
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/members');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const members = membersData?.members || [];

  // Update member status mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, status }) => {
      const response = await api.patch(`/members/${memberId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members', user?.user_id]);
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      const response = await api.delete(`/members/${memberId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members', user?.user_id]);
    },
  });

  const handleStatusChange = (memberId, newStatus) => {
    updateMemberMutation.mutate({ memberId, status: newStatus });
  };

  const handleDeleteMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <User className="h-4 w-4 text-slate-600" />;
      case 'premium':
        return <Star className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-slate-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-slate-100 text-gray-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-error-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-slate-100 text-gray-800';
      default:
        return 'bg-slate-100 text-gray-800';
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

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleOptions = ['all', 'admin', 'moderator', 'member', 'premium'];
  const statusOptions = ['all', 'active', 'inactive', 'pending', 'suspended'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-body-regular text-neutral-600">Loading members...</p>
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
                className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-slate-900">Members</h1>
                <p className="text-body-small text-slate-500">{filteredMembers.length} members</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Filter className="h-5 w-5 text-slate-700" />
              </button>
            </div>
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
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            {/* Role Filter */}
            <div>
              <label className="text-body-small font-medium text-slate-700 mb-2 block">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-body-small font-medium text-slate-700 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No members found</h3>
              <p className="text-body-regular text-slate-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'No members match your filters'
                  : 'No members available'}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-elevation-1 transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-xl bg-slate-50">
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">{member.name}</h3>
                      <p className="text-body-small text-slate-500">{member.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center space-x-1 ${getStatusColor(member.status)}`}>
                          {getStatusIcon(member.status)}
                          <span className="capitalize">{member.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="p-1 rounded hover:bg-slate-100 active:scale-95 transition-transform"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-body-small">
                  {member.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600">{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-600">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {member.last_active && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600">
                        Last active {new Date(member.last_active).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {member.total_filings > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600">{member.total_filings} filings</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Member Actions Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-heading-4 font-semibold text-slate-900">Member Actions</h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Status Actions */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">Change Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['active', 'inactive', 'pending', 'suspended'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedMember.id, status);
                        setSelectedMember(null);
                      }}
                      disabled={selectedMember.status === status}
                      className={`p-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedMember.status === status
                          ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Actions */}
              <div className="pt-3 border-t">
                <button
                  onClick={() => {
                    handleDeleteMember(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-xl hover:bg-red-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Member</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-body-small">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-blue-600">
            <Users className="h-5 w-5 mb-1" />
            <span className="text-body-small font-medium">Members</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
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

export default Members;
