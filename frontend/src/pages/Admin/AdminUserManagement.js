// =====================================================
// ADMIN USER MANAGEMENT - MOBILE-FIRST USER ADMINISTRATION
// Enterprise-grade user management with DesignSystem components
// =====================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../../components/UI';
import { typography, spacing, components, layout } from '../../styles/designTokens';
import {
  useAdminUsers,
  useUpdateAdminUserStatus,
  useDeleteAdminUser,
} from '../../features/admin/users/hooks/use-users';
import {
  Search,
  Filter,
  Trash2,
  Shield,
  User,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Crown,
  Star,
  Eye,
  Ban,
  X,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
} from 'lucide-react';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegistrationSource, setFilterRegistrationSource] = useState('all');
  const [filterHasFilings, setFilterHasFilings] = useState('all');
  const [filterHasPayments, setFilterHasPayments] = useState('all');
  const [registrationDateFrom, setRegistrationDateFrom] = useState('');
  const [registrationDateTo, setRegistrationDateTo] = useState('');
  const [lastLoginFrom, setLastLoginFrom] = useState('');
  const [lastLoginTo, setLastLoginTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Build query params
  const queryParams = {
    page,
    limit,
    search: searchTerm || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    authProvider: filterRegistrationSource !== 'all' ? filterRegistrationSource : undefined,
    hasFilings: filterHasFilings === 'true' ? 'true' : undefined,
    hasPayments: filterHasPayments === 'true' ? 'true' : undefined,
    registrationDateFrom: registrationDateFrom || undefined,
    registrationDateTo: registrationDateTo || undefined,
    lastLoginFrom: lastLoginFrom || undefined,
    lastLoginTo: lastLoginTo || undefined,
  };

  // Fetch users using hook
  const { data: usersData, isLoading } = useAdminUsers(queryParams);

  const users = usersData?.data?.users || usersData?.users || [];
  const pagination = usersData?.data?.pagination || usersData?.pagination;

  // Mutations
  const updateUserStatusMutation = useUpdateAdminUserStatus();
  const deleteUserMutation = useDeleteAdminUser();

  const handleStatusChange = (userId, newStatus) => {
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleViewUser = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleDeleteUser = (userId, userName) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to delete ${userName || 'this user'}? This action cannot be undone.`)) {
      deleteUserMutation.mutate({
        userId,
        reason: 'Deleted by admin from user management page',
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-warning-600" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-info-600" />;
      case 'ca_admin':
        return <Star className="h-4 w-4 text-secondary-600" />;
      case 'chartered_accountant':
        return <User className="h-4 w-4 text-success-600" />;
      case 'user':
        return <User className="h-4 w-4 text-neutral-600" />;
      default:
        return <User className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return 'bg-warning-100 text-warning-800';
      case 'platform_admin':
        return 'bg-info-100 text-info-800';
      case 'ca_admin':
        return 'bg-secondary-100 text-secondary-800';
      case 'chartered_accountant':
        return 'bg-success-100 text-success-800';
      case 'user':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'inactive':
        return 'bg-error-100 text-error-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'suspended':
        return 'bg-neutral-200 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
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
        return <Ban className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleOptions = ['all', 'super_admin', 'platform_admin', 'ca_admin', 'chartered_accountant', 'user'];
  const statusOptions = ['all', 'active', 'inactive', 'pending', 'suspended'];

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading users...</Typography.Body>
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
            <Typography.H1 className="mb-2">User Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              {filteredUsers.length} users found
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>
                      {role === 'all' ? 'All Roles' : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={filterRegistrationSource}
                  onChange={(e) => setFilterRegistrationSource(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Sources</option>
                  <option value="LOCAL">Local</option>
                  <option value="GOOGLE">Google</option>
                  <option value="OTHER">Other</option>
                </select>
                <select
                  value={filterHasFilings}
                  onChange={(e) => setFilterHasFilings(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Users</option>
                  <option value="true">Has Filings</option>
                  <option value="false">No Filings</option>
                </select>
                <select
                  value={filterHasPayments}
                  onChange={(e) => setFilterHasPayments(e.target.value)}
                  className="px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Users</option>
                  <option value="true">Has Payments</option>
                  <option value="false">No Payments</option>
                </select>
                <div>
                  <label className="block text-body-small text-neutral-600 mb-1">Registration From</label>
                  <input
                    type="date"
                    value={registrationDateFrom}
                    onChange={(e) => setRegistrationDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-body-small text-neutral-600 mb-1">Registration To</label>
                  <input
                    type="date"
                    value={registrationDateTo}
                    onChange={(e) => setRegistrationDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-body-small text-neutral-600 mb-1">Last Login From</label>
                  <input
                    type="date"
                    value={lastLoginFrom}
                    onChange={(e) => setLastLoginFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-body-small text-neutral-600 mb-1">Last Login To</label>
                  <input
                    type="date"
                    value={lastLoginTo}
                    onChange={(e) => setLastLoginTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-neutral-400" />
              </div>
              <Typography.H3 className="mb-2">No users found</Typography.H3>
              <Typography.Body className="text-neutral-600">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'No users match your filters. Try adjusting your search criteria.'
                  : 'No users available yet.'}
              </Typography.Body>
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="space-y-4">
            {filteredUsers.map((user) => (
              <StaggerItem key={user.id}>
                <Card hover className="cursor-pointer" onClick={() => handleViewUser(user.id)}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {getRoleIcon(user.role)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Typography.Small className="font-semibold text-neutral-900">
                              {user.fullName || user.name || 'Unknown User'}
                            </Typography.Small>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleColor(user.role)}`}>
                              {user.role?.replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex items-center gap-1 ${getStatusColor(user.status)}`}>
                              {getStatusIcon(user.status)}
                              <span className="capitalize">{user.status}</span>
                            </span>
                          </div>

                          <Typography.Small className="text-neutral-600 truncate block">
                            {user.email}
                          </Typography.Small>

                          {/* Additional Info */}
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            {user.phone && (
                              <div className="flex items-center space-x-1 text-neutral-500">
                                <Phone className="h-3 w-3" />
                                <Typography.Small className="text-body-small">{user.phone}</Typography.Small>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 text-neutral-500">
                              <Calendar className="h-3 w-3" />
                              <Typography.Small className="text-body-small">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </Typography.Small>
                            </div>
                            {user.last_login && (
                              <div className="flex items-center space-x-1 text-neutral-500">
                                <Clock className="h-3 w-3" />
                                <Typography.Small className="text-body-small">
                                  Last login {new Date(user.last_login).toLocaleDateString()}
                                </Typography.Small>
                              </div>
                            )}
                            {user.total_filings > 0 && (
                              <div className="flex items-center space-x-1 text-neutral-500">
                                <FileText className="h-3 w-3" />
                                <Typography.Small className="text-body-small">{user.total_filings} filings</Typography.Small>
                              </div>
                            )}
                          </div>
                          {/* Tags */}
                          {user.metadata?.tags && user.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.metadata.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-body-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {tag}
                                </span>
                              ))}
                              {user.metadata.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-body-small">
                                  +{user.metadata.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Typography.Small className="text-neutral-600">
              Page {page} of {pagination.totalPages}
            </Typography.Small>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Actions Modal */}
      {selectedUser && showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Actions</CardTitle>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserModal(false);
                }}
                className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <Typography.Small className="font-medium text-neutral-900">
                    {selectedUser.fullName || selectedUser.name}
                  </Typography.Small>
                  <Typography.Small className="text-neutral-600 text-body-small">
                    {selectedUser.email}
                  </Typography.Small>
                </div>
              </div>

              {/* View Profile */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleViewUser(selectedUser.id);
                  setShowUserModal(false);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Button>

              {/* Status Actions */}
              <div>
                <Typography.Small className="font-medium text-neutral-700 mb-2 block">
                  Change Status
                </Typography.Small>
                <div className="grid grid-cols-2 gap-2">
                  {['active', 'inactive', 'pending', 'suspended'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedUser.id, status);
                        setShowUserModal(false);
                      }}
                      disabled={selectedUser.status === status}
                      className={`p-2 rounded-xl text-sm font-medium transition-colors ${selectedUser.status === status
                        ? 'bg-primary-100 text-primary-700 cursor-not-allowed'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Actions */}
              <div className="pt-4 border-t border-neutral-200">
                <Button
                  variant="error"
                  className="w-full"
                  onClick={() => {
                    handleDeleteUser(selectedUser.id, selectedUser.fullName || selectedUser.name);
                    setShowUserModal(false);
                  }}
                  disabled={deleteUserMutation.isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageTransition>
  );
};

export default AdminUserManagement;
