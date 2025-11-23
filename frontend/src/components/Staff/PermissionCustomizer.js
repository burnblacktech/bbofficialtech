// =====================================================
// STAFF PERMISSION CUSTOMIZER
// Advanced staff management with time-based and module-level controls
// =====================================================

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Clock,
  Calendar,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  RotateCcw,
  Filter,
  Search,
  Download,
  Upload,
  FileText,
  TrendingUp,
  UserCheck,
  UserX,
  Bell,
  Info
} from 'lucide-react';
import { Button, Card, Alert } from '../UI';
import { ROLES, PERMISSION_MODULES, PERMISSION_ACTIONS, TIME_BASED_ACCESS, ACCESS_DURATIONS } from '../../constants/roles';
import { permissionEngine } from '../../services/permissionEngine';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PermissionCustomizer = ({ user, staffMember, onSave, onCancel }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('permissions');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Permission state
  const [permissions, setPermissions] = useState({
    baseRole: staffMember?.role || ROLES.CA,
    modulePermissions: {},
    temporaryAccess: [],
    customPermissions: []
  });

  // Temporary access form state
  const [temporaryAccessForm, setTemporaryAccessForm] = useState({
    modules: [],
    actions: [],
    duration: ACCESS_DURATIONS.ONE_WEEK,
    customExpiryDate: '',
    reason: '',
    startTime: '',
    recurring: false
  });

  // Form visibility states
  const [showTemporaryForm, setShowTemporaryForm] = useState(false);
  const [showCustomPermissionForm, setShowCustomPermissionForm] = useState(false);

  // Fetch staff member's current permissions
  const { data: staffPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['staffPermissions', staffMember?.id],
    queryFn: async () => {
      const response = await api.get(`/api/staff/${staffMember.id}/permissions`);
      return response.data;
    },
    enabled: !!staffMember?.id,
    onSuccess: (data) => {
      if (data) {
        setPermissions(prev => ({
          ...prev,
          modulePermissions: data.modulePermissions || {},
          temporaryAccess: data.temporaryAccess || [],
          customPermissions: data.customPermissions || []
        }));
      }
    }
  });

  // Fetch available roles
  const { data: availableRoles } = useQuery({
    queryKey: ['availableRoles'],
    queryFn: async () => {
      const response = await api.get('/api/roles/available');
      return response.data;
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (permissionData) => {
      const response = await api.put(`/api/staff/${staffMember.id}/permissions`, permissionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffPermissions', staffMember.id]);
      queryClient.invalidateQueries(['staffList']);
      toast.success('Permissions updated successfully!');
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    }
  });

  // Grant temporary access mutation
  const grantTemporaryAccessMutation = useMutation({
    mutationFn: async (accessConfig) => {
      const response = await api.post(`/api/staff/${staffMember.id}/temporary-access`, accessConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffPermissions', staffMember.id]);
      toast.success('Temporary access granted successfully!');
      setShowTemporaryForm(false);
      setTemporaryAccessForm({
        modules: [],
        actions: [],
        duration: ACCESS_DURATIONS.ONE_WEEK,
        customExpiryDate: '',
        reason: '',
        startTime: '',
        recurring: false
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to grant temporary access');
    }
  });

  // Revoke temporary access mutation
  const revokeAccessMutation = useMutation({
    mutationFn: async (accessId) => {
      const response = await api.delete(`/api/staff/${staffMember.id}/temporary-access/${accessId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffPermissions', staffMember.id]);
      toast.success('Access revoked successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    }
  });

  // Module definitions for UI
  const moduleDefinitions = {
    [PERMISSION_MODULES.ITR_FILING]: {
      name: 'ITR Filing',
      icon: FileText,
      description: 'Income Tax Return filing operations',
      actions: ['create', 'read', 'update', 'delete', 'submit'],
      color: 'blue'
    },
    [PERMISSION_MODULES.USER_MANAGEMENT]: {
      name: 'User Management',
      icon: Users,
      description: 'Manage client and user accounts',
      actions: ['create', 'read', 'update', 'delete'],
      color: 'green'
    },
    [PERMISSION_MODULES.STAFF_MANAGEMENT]: {
      name: 'Staff Management',
      icon: Users,
      description: 'Manage firm staff and permissions',
      actions: ['create', 'read', 'update', 'delete'],
      color: 'purple'
    },
    [PERMISSION_MODULES.BILLING_INVOICING]: {
      name: 'Billing & Invoicing',
      icon: TrendingUp,
      description: 'Manage billing and invoicing',
      actions: ['create', 'read', 'update', 'view_billing'],
      color: 'yellow'
    },
    [PERMISSION_MODULES.REPORTS_ANALYTICS]: {
      name: 'Reports & Analytics',
      icon: TrendingUp,
      description: 'View reports and analytics',
      actions: ['read', 'export'],
      color: 'indigo'
    },
    [PERMISSION_MODULES.DOCUMENT_MANAGEMENT]: {
      name: 'Document Management',
      icon: FileText,
      description: 'Manage client documents',
      actions: ['create', 'read', 'update', 'delete'],
      color: 'orange'
    },
    [PERMISSION_MODULES.CLIENT_MANAGEMENT]: {
      name: 'Client Management',
      icon: Users,
      description: 'Manage client relationships',
      actions: ['create', 'read', 'update', 'assign'],
      color: 'pink'
    }
  };

  // Handle module permission toggle
  const handleModulePermissionToggle = (module, action) => {
    setPermissions(prev => ({
      ...prev,
      modulePermissions: {
        ...prev.modulePermissions,
        [module]: {
          ...prev.modulePermissions[module],
          [action]: !prev.modulePermissions[module]?.[action]
        }
      }
    }));
  };

  // Handle role change
  const handleRoleChange = (newRole) => {
    setPermissions(prev => ({
      ...prev,
      baseRole: newRole
    }));
  };

  // Handle temporary access form
  const handleTemporaryAccessSubmit = async () => {
    if (!temporaryAccessForm.modules.length || !temporaryAccessForm.actions.length) {
      toast.error('Please select at least one module and action');
      return;
    }

    const accessConfig = {
      modules: temporaryAccessForm.modules,
      permissions: temporaryAccessForm.actions,
      duration: temporaryAccessForm.duration,
      reason: temporaryAccessForm.reason,
      startTime: temporaryAccessForm.startTime || null,
      recurring: temporaryAccessForm.recurring,
      grantedBy: user.user_id
    };

    if (temporaryAccessForm.duration === ACCESS_DURATIONS.CUSTOM && temporaryAccessForm.customExpiryDate) {
      accessConfig.customExpiryDate = temporaryAccessForm.customExpiryDate;
    }

    grantTemporaryAccessMutation.mutate(accessConfig);
  };

  // Revoke temporary access
  const handleRevokeAccess = (accessId) => {
    if (window.confirm('Are you sure you want to revoke this temporary access?')) {
      revokeAccessMutation.mutate(accessId);
    }
  };

  // Save all permissions
  const handleSavePermissions = async () => {
    setIsLoading(true);
    try {
      await updatePermissionsMutation.mutateAsync(permissions);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter modules based on search
  const filteredModules = Object.entries(moduleDefinitions).filter(([module, definition]) =>
    definition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    definition.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Permission Customizer</h2>
              <p className="text-blue-100">Configure advanced permissions and access controls</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Staff Info */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{staffMember?.name || 'Staff Member'}</h3>
                <p className="text-sm text-gray-500">
                  Current Role: <span className="font-medium">{permissions.baseRole}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={permissions.baseRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableRoles?.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="flex">
            {[
              { id: 'permissions', label: 'Module Permissions', icon: Shield },
              { id: 'temporary', label: 'Temporary Access', icon: Clock },
              { id: 'custom', label: 'Custom Rules', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'permissions' && (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Module Permissions Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredModules.map(([module, definition]) => (
                      <Card key={module} className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className={`p-2 bg-${definition.color}-100 rounded-lg`}>
                            <definition.icon className={`w-5 h-5 text-${definition.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{definition.name}</h4>
                            <p className="text-sm text-gray-500">{definition.description}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {definition.actions.map(action => {
                            const isChecked = permissions.modulePermissions[module]?.[action];
                            return (
                              <label
                                key={action}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked || false}
                                  onChange={() => handleModulePermissionToggle(module, action)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 capitalize">
                                  {action.replace('_', ' ')}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'temporary' && (
                <div className="space-y-6">
                  {/* Active Temporary Access */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Temporary Access</h3>
                    {permissions.temporaryAccess.length > 0 ? (
                      <div className="space-y-3">
                        {permissions.temporaryAccess.map(access => (
                          <Card key={access.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium text-gray-900">
                                    {access.modules.join(', ')}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    • {permissionEngine.formatExpiryDate(access.expiresAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{access.reason}</p>
                                <div className="flex flex-wrap gap-2">
                                  {access.permissions.map(permission => (
                                    <span
                                      key={permission}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {permission}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRevokeAccess(access.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-8 text-center">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No active temporary access found</p>
                      </Card>
                    )}
                  </div>

                  {/* Grant Temporary Access */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Grant Temporary Access</h3>
                      <Button
                        variant="outline"
                        onClick={() => setShowTemporaryForm(!showTemporaryForm)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Temporary Access</span>
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showTemporaryForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <Card className="p-6 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Modules</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(moduleDefinitions).map(([module, definition]) => (
                                  <label
                                    key={module}
                                    className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={temporaryAccessForm.modules.includes(module)}
                                      onChange={(e) => {
                                        setTemporaryAccessForm(prev => ({
                                          ...prev,
                                          modules: e.target.checked
                                            ? [...prev.modules, module]
                                            : prev.modules.filter(m => m !== module)
                                        }));
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{definition.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.values(PERMISSION_ACTIONS).map(action => (
                                  <label
                                    key={action}
                                    className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={temporaryAccessForm.actions.includes(action)}
                                      onChange={(e) => {
                                        setTemporaryAccessForm(prev => ({
                                          ...prev,
                                          actions: e.target.checked
                                            ? [...prev.actions, action]
                                            : prev.actions.filter(a => a !== action)
                                        }));
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm capitalize">{action.replace('_', ' ')}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                <select
                                  value={temporaryAccessForm.duration}
                                  onChange={(e) => setTemporaryAccessForm(prev => ({
                                    ...prev,
                                    duration: e.target.value
                                  }))}
                                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value={ACCESS_DURATIONS.ONE_DAY}>1 Day</option>
                                  <option value={ACCESS_DURATIONS.ONE_WEEK}>1 Week</option>
                                  <option value={ACCESS_DURATIONS.ONE_MONTH}>1 Month</option>
                                  <option value={ACCESS_DURATIONS.THREE_MONTHS}>3 Months</option>
                                  <option value={ACCESS_DURATIONS.SIX_MONTHS}>6 Months</option>
                                  <option value={ACCESS_DURATIONS.ONE_YEAR}>1 Year</option>
                                  <option value={ACCESS_DURATIONS.CUSTOM}>Custom</option>
                                </select>
                              </div>

                              {temporaryAccessForm.duration === ACCESS_DURATIONS.CUSTOM && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Expiry Date</label>
                                  <input
                                    type="datetime-local"
                                    value={temporaryAccessForm.customExpiryDate}
                                    onChange={(e) => setTemporaryAccessForm(prev => ({
                                      ...prev,
                                      customExpiryDate: e.target.value
                                    }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                              <input
                                type="text"
                                value={temporaryAccessForm.reason}
                                onChange={(e) => setTemporaryAccessForm(prev => ({
                                  ...prev,
                                  reason: e.target.value
                                }))}
                                placeholder="Reason for temporary access"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div className="flex justify-end space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowTemporaryForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleTemporaryAccessSubmit}
                                loading={grantTemporaryAccessMutation.isLoading}
                              >
                                Grant Access
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === 'custom' && (
                <div className="space-y-6">
                  <Card className="p-8 text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Rules</h3>
                    <p className="text-gray-500">
                      Advanced custom permission rules are coming soon. This will allow you to create sophisticated access control patterns.
                    </p>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Changes will be applied immediately</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              loading={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PermissionCustomizer;