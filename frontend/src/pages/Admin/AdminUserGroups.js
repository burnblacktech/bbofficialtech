// =====================================================
// ADMIN USER GROUPS PAGE
// Manages user groups with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { adminUsersService } from '../../features/admin/users/services/users.service';
import toast from 'react-hot-toast';

const AdminUserGroups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.getUserGroups();
      setGroups(data.data?.groups || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupName) => {
    try {
      const data = await adminUsersService.getGroupMembers(groupName);
      setMembers(data.data?.members || []);
      setSelectedGroup({ name: groupName });
      setShowMembersModal(true);
    } catch (error) {
      console.error('Failed to load group members:', error);
      toast.error('Failed to load group members');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setProcessing(true);
    try {
      await adminUsersService.createUserGroup(formData);
      toast.success('Group created successfully');
      setShowCreateModal(false);
      resetForm();
      loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error.response?.data?.error || 'Failed to create group');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (groupName) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"? This will remove all users from this group.`)) {
      return;
    }

    setProcessing(groupName);
    try {
      await adminUsersService.deleteUserGroup(groupName);
      toast.success('Group deleted successfully');
      loadGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group');
    } finally {
      setProcessing(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setSelectedGroup(null);
  };

  const filteredGroups = groups.filter((group) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        group.name?.toLowerCase().includes(searchLower) ||
        group.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">User Groups</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Organize users into groups for easier management and bulk operations
            </Typography.Body>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button variant="outline" onClick={loadGroups}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No groups found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  Create your first user group to get started.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredGroups.map((group) => (
                  <StaggerItem key={group.name} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color || '#3B82F6' }}
                          />
                          <Typography.Body className="font-medium">{group.name}</Typography.Body>
                        </div>
                        {group.description && (
                          <Typography.Small className="text-neutral-500 block mb-2">
                            {group.description}
                          </Typography.Small>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                            {group.memberCount || 0} members
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadGroupMembers(group.name)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Members
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group.name)}
                          disabled={processing === group.name}
                          className="text-error-600 hover:bg-error-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Create Group</CardTitle>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Group Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Premium Users"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the group..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name.trim() || processing}
                  >
                    {processing ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Group Members: {selectedGroup.name}</CardTitle>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setMembers([]);
                    setSelectedGroup(null);
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-neutral-400" />
                    </div>
                    <Typography.H3 className="mb-2">No members found</Typography.H3>
                    <Typography.Body className="text-neutral-600">
                      This group doesn't have any members yet.
                    </Typography.Body>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <Typography.Body className="font-medium">{member.fullName || 'N/A'}</Typography.Body>
                          <Typography.Small className="text-neutral-500">{member.email}</Typography.Small>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                            {member.role}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Remove member logic
                            }}
                            className="text-error-600 hover:bg-error-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminUserGroups;

