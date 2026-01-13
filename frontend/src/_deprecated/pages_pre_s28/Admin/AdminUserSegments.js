// =====================================================
// ADMIN USER SEGMENTS PAGE
// Manages dynamic user segments with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminUserSegments = () => {
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      userType: '',
      status: '',
      registrationDate: {
        $gte: '',
        $lte: '',
      },
    },
    metadata: {},
  });
  const [members, setMembers] = useState([]);
  const [membersPagination, setMembersPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSegments();
  }, [pagination.offset, activeFilter]);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const params = {
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        limit: pagination.limit,
        offset: pagination.offset,
      };
      const data = await adminService.getUserSegments(params);
      setSegments(data.segments || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load segments:', error);
      toast.error('Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  const loadSegmentMembers = async (segmentId) => {
    try {
      const segment = segments.find(s => s.id === segmentId);
      if (segment) {
        setSelectedSegment(segment);
      }
      const data = await adminService.getSegmentMembers(segmentId, {
        limit: membersPagination.limit,
        offset: membersPagination.offset,
      });
      setMembers(data.members || []);
      setMembersPagination(data.pagination || membersPagination);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Failed to load segment members:', error);
      toast.error('Failed to load segment members');
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.criteria) {
      toast.error('Please fill all required fields');
      return;
    }

    setProcessing(true);
    try {
      await adminService.createUserSegment(formData);
      toast.success('Segment created successfully');
      setShowCreateModal(false);
      resetForm();
      loadSegments();
    } catch (error) {
      console.error('Failed to create segment:', error);
      toast.error(error.response?.data?.message || 'Failed to create segment');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    setProcessing(true);
    try {
      await adminService.updateUserSegment(selectedSegment.id, formData);
      toast.success('Segment updated successfully');
      setShowEditModal(false);
      setSelectedSegment(null);
      resetForm();
      loadSegments();
    } catch (error) {
      console.error('Failed to update segment:', error);
      toast.error('Failed to update segment');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (segmentId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    setProcessing(segmentId);
    try {
      await adminService.deleteUserSegment(segmentId);
      toast.success('Segment deleted successfully');
      loadSegments();
    } catch (error) {
      console.error('Failed to delete segment:', error);
      toast.error('Failed to delete segment');
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (segment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name || '',
      description: segment.description || '',
      criteria: segment.criteria || {
        userType: '',
        status: '',
        registrationDate: {
          $gte: '',
          $lte: '',
        },
      },
      metadata: segment.metadata || {},
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {
        userType: '',
        status: '',
        registrationDate: {
          $gte: '',
          $lte: '',
        },
      },
      metadata: {},
    });
  };

  const filteredSegments = segments.filter((segment) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        segment.name?.toLowerCase().includes(searchLower) ||
        segment.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const userTypes = ['END_USER', 'CA', 'CA_FIRM_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN'];
  const userStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">User Segments</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Create and manage dynamic user segments for targeting and analytics
            </Typography.Body>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search segments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Segments</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <Button variant="outline" onClick={loadSegments}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Segments List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredSegments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No segments found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  Create your first user segment to get started.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredSegments.map((segment) => (
                  <StaggerItem key={segment.id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Typography.Body className="font-medium">{segment.name}</Typography.Body>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            segment.isActive ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {segment.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Typography.Small className="text-neutral-500 block mb-2">
                          {segment.description || 'No description'}
                        </Typography.Small>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-body-small rounded">
                            {segment.memberCount || 0} members
                          </span>
                          {segment.criteria?.userType && (
                            <span className="px-2 py-1 bg-info-100 text-info-700 text-body-small rounded">
                              {segment.criteria.userType}
                            </span>
                          )}
                          {segment.criteria?.status && (
                            <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-body-small rounded">
                              {segment.criteria.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSegmentMembers(segment.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Members
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(segment)}
                          disabled={processing === segment.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(segment.id)}
                          disabled={processing === segment.id}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Typography.Small className="text-neutral-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </Typography.Small>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= pagination.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{showCreateModal ? 'Create Segment' : 'Edit Segment'}</CardTitle>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedSegment(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Segment Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Active CA Users"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the segment..."
                  />
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <Typography.Small className="font-medium text-neutral-700 mb-3 block">Criteria</Typography.Small>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                        User Type
                      </label>
                      <select
                        value={formData.criteria.userType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criteria: { ...formData.criteria, userType: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All User Types</option>
                        {userTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                        User Status
                      </label>
                      <select
                        value={formData.criteria.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criteria: { ...formData.criteria, status: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Statuses</option>
                        {userStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                        Registration Date From
                      </label>
                      <input
                        type="date"
                        value={formData.criteria.registrationDate.$gte}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              registrationDate: {
                                ...formData.criteria.registrationDate,
                                $gte: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                        Registration Date To
                      </label>
                      <input
                        type="date"
                        value={formData.criteria.registrationDate.$lte}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criteria: {
                              ...formData.criteria,
                              registrationDate: {
                                ...formData.criteria.registrationDate,
                                $lte: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                      setSelectedSegment(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    disabled={!formData.name || processing}
                  >
                    {processing ? 'Saving...' : showCreateModal ? 'Create Segment' : 'Update Segment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedSegment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Segment Members: {selectedSegment.name}</CardTitle>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setMembers([]);
                    setSelectedSegment(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
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
                      This segment doesn't have any members yet.
                    </Typography.Body>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <div>
                          <Typography.Body className="font-medium">{member.fullName || 'N/A'}</Typography.Body>
                          <Typography.Small className="text-neutral-500">{member.email}</Typography.Small>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-body-small rounded">
                            {member.role}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            member.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {member.status}
                          </span>
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

export default AdminUserSegments;
