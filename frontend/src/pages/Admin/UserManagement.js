// =====================================================
// USER MANAGEMENT - ADMIN PANEL
// Comprehensive user management interface for platform administrators
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mock user data
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+919876543210',
          pan: 'ABCDE1234F',
          role: 'user',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          lastLogin: new Date('2024-01-20'),
          filingsCount: 3,
          totalRevenue: 7500,
          isVerified: true,
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+919876543211',
          pan: 'FGHIJ5678K',
          role: 'user',
          status: 'active',
          createdAt: new Date('2024-01-10'),
          lastLogin: new Date('2024-01-19'),
          filingsCount: 1,
          totalRevenue: 2500,
          isVerified: true,
        },
        {
          id: 3,
          name: 'CA Firm Alpha',
          email: 'admin@cafirmalpha.com',
          phone: '+919876543212',
          pan: 'LMNOP9012Q',
          role: 'ca_firm_admin',
          status: 'active',
          createdAt: new Date('2024-01-05'),
          lastLogin: new Date('2024-01-20'),
          filingsCount: 45,
          totalRevenue: 112500,
          isVerified: true,
          firmName: 'CA Firm Alpha',
          subscriptionPlan: 'Pro Plan',
        },
        {
          id: 4,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+919876543213',
          pan: 'RSTUV3456W',
          role: 'user',
          status: 'suspended',
          createdAt: new Date('2024-01-08'),
          lastLogin: new Date('2024-01-18'),
          filingsCount: 0,
          totalRevenue: 0,
          isVerified: false,
          suspensionReason: 'Violation of terms of service',
        },
        {
          id: 5,
          name: 'CA Firm Beta',
          email: 'contact@cafirmbeta.com',
          phone: '+919876543214',
          pan: 'XYZAB7890C',
          role: 'ca_firm_admin',
          status: 'pending',
          createdAt: new Date('2024-01-20'),
          lastLogin: null,
          filingsCount: 0,
          totalRevenue: 0,
          isVerified: false,
          firmName: 'CA Firm Beta',
          subscriptionPlan: null,
        },
      ];

      setUsers(mockUsers);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.pan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success-600 bg-success-100';
      case 'suspended': return 'text-error-600 bg-error-100';
      case 'pending': return 'text-warning-600 bg-warning-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'user': return 'text-primary-600 bg-primary-100';
      case 'ca_firm_admin': return 'text-secondary-600 bg-secondary-100';
      case 'admin': return 'text-neutral-600 bg-neutral-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleUserAction = (action, user) => {
    switch (action) {
      case 'view':
        setSelectedUser(user);
        setShowUserModal(true);
        break;
      case 'edit':
        // Navigate to edit user page
        console.log('Edit user:', user.id);
        break;
      case 'suspend':
        // Suspend user
        console.log('Suspend user:', user.id);
        break;
      case 'activate':
        // Activate user
        console.log('Activate user:', user.id);
        break;
      case 'delete':
        // Delete user
        console.log('Delete user:', user.id);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Users...</Typography.H1>
            <Typography.Body>Please wait while we load user data.</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography.H1 className="mb-2">User Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage platform users, CA firms, and access controls
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              Export Users
            </button>
            <button className="px-4 py-2 bg-secondary-500 text-white rounded-lg text-sm font-medium hover:bg-secondary-600 transition-colors">
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or PAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="user">End Users</option>
                  <option value="ca_firm_admin">CA Firms</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span>Users ({filteredUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Filings</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <Typography.Small className="font-medium text-neutral-700">
                              {user.name}
                            </Typography.Small>
                            <Typography.Small className="text-neutral-500">
                              {user.email}
                            </Typography.Small>
                            <Typography.Small className="text-neutral-500">
                              PAN: {user.pan}
                            </Typography.Small>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role === 'ca_firm_admin' ? 'CA Firm' : user.role}
                        </span>
                        {user.firmName && (
                          <Typography.Small className="text-neutral-500 mt-1">
                            {user.firmName}
                          </Typography.Small>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          {user.isVerified && (
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Typography.Small className="font-medium">
                          {user.filingsCount}
                        </Typography.Small>
                      </td>
                      <td className="py-4 px-4">
                        <Typography.Small className="font-medium">
                          {formatCurrency(user.totalRevenue)}
                        </Typography.Small>
                      </td>
                      <td className="py-4 px-4">
                        <Typography.Small className="text-neutral-500">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </Typography.Small>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUserAction('view', user)}
                            className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('edit', user)}
                            className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleUserAction('suspend', user)}
                              className="p-1 text-neutral-500 hover:text-warning-600 transition-colors"
                              title="Suspend User"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction('activate', user)}
                              className="p-1 text-neutral-500 hover:text-success-600 transition-colors"
                              title="Activate User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Typography.H3>User Details</Typography.H3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Basic Information
                    </Typography.Small>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography.Small className="text-neutral-500">Name</Typography.Small>
                        <Typography.Small className="font-medium">{selectedUser.name}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Email</Typography.Small>
                        <Typography.Small className="font-medium">{selectedUser.email}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Phone</Typography.Small>
                        <Typography.Small className="font-medium">{selectedUser.phone}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">PAN</Typography.Small>
                        <Typography.Small className="font-medium">{selectedUser.pan}</Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Account Information
                    </Typography.Small>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography.Small className="text-neutral-500">Role</Typography.Small>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                          {selectedUser.role === 'ca_firm_admin' ? 'CA Firm' : selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Status</Typography.Small>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Created</Typography.Small>
                        <Typography.Small className="font-medium">{formatDate(selectedUser.createdAt)}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Last Login</Typography.Small>
                        <Typography.Small className="font-medium">
                          {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
                        </Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* CA Firm Information */}
                  {selectedUser.role === 'ca_firm_admin' && (
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-3">
                        CA Firm Information
                      </Typography.Small>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Typography.Small className="text-neutral-500">Firm Name</Typography.Small>
                          <Typography.Small className="font-medium">{selectedUser.firmName}</Typography.Small>
                        </div>
                        <div>
                          <Typography.Small className="text-neutral-500">Subscription Plan</Typography.Small>
                          <Typography.Small className="font-medium">
                            {selectedUser.subscriptionPlan || 'No plan selected'}
                          </Typography.Small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suspension Information */}
                  {selectedUser.status === 'suspended' && selectedUser.suspensionReason && (
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-3">
                        Suspension Information
                      </Typography.Small>
                      <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                        <Typography.Small className="text-error-700">
                          {selectedUser.suspensionReason}
                        </Typography.Small>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleUserAction('edit', selectedUser)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Edit User
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default UserManagement;
