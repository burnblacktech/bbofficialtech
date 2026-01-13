// =====================================================
// ADMIN USER DETAILS PAGE
// Enterprise-grade user detail management with DesignSystem
// =====================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CardHeaderTitleContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  useAdminUserDetails,
  useAdminUserActivity,
  useAdminUserFilings,
  useAdminUserTransactions,
  useUpdateAdminUser,
  useActivateAdminUser,
  useDeactivateAdminUser,
  useSuspendAdminUser,
  useDeleteAdminUser,
  useImpersonateAdminUser,
  useStopImpersonation,
  useAdminUserNotes,
  useCreateAdminUserNote,
  useUpdateAdminUserNote,
  useDeleteAdminUserNote,
  useAdminUserTags,
  useAddAdminUserTag,
  useRemoveAdminUserTag,
} from '../../features/admin/users/hooks/use-users';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Building2,
  FileText,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Eye,
  Trash2,
  UserX,
  Crown,
  Star,
  ArrowLeft,
  UserCog,
  LogOut,
  StickyNote,
  Plus,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataEntryPage } from '../../components/templates';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user details using hooks
  const { data: userData, isLoading, error } = useAdminUserDetails(userId);
  const { data: filingsData } = useAdminUserFilings(userId);
  const { data: activityData } = useAdminUserActivity(userId);
  const { data: notesData } = useAdminUserNotes(userId);
  const { data: tagsData } = useAdminUserTags(userId);

  // Mutations
  const updateUserMutation = useUpdateAdminUser();
  const activateUserMutation = useActivateAdminUser();
  const deactivateUserMutation = useDeactivateAdminUser();
  const suspendUserMutation = useSuspendAdminUser();
  const deleteUserMutation = useDeleteAdminUser();
  const impersonateUserMutation = useImpersonateAdminUser();
  const stopImpersonationMutation = useStopImpersonation();
  const createNoteMutation = useCreateAdminUserNote();
  const updateNoteMutation = useUpdateAdminUserNote();
  const deleteNoteMutation = useDeleteAdminUserNote();
  const addTagMutation = useAddAdminUserTag();
  const removeTagMutation = useRemoveAdminUserTag();

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteFormData, setNoteFormData] = useState({ content: '', isPrivate: false });

  // Tags state
  const [newTag, setNewTag] = useState('');

  // Check if currently impersonating
  const isImpersonating = localStorage.getItem('isImpersonating') === 'true';

  const userDetails = userData?.data?.user || userData?.user;
  const filings = filingsData?.data?.filings || filingsData?.filings || [];
  const activities = activityData?.data?.activities || activityData?.activities || [];
  const notes = notesData?.data?.notes || [];
  const tags = tagsData?.data?.tags || [];

  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (userDetails) {
      setEditFormData({
        name: userDetails.name || '',
        email: userDetails.email || '',
        mobile: userDetails.mobile || '',
        role: userDetails.role || '',
        status: userDetails.status || '',
        organization: userDetails.organization || '',
        // eslint-disable-next-line camelcase
        address_line_1: userDetails.address_line_1 || '',
        // eslint-disable-next-line camelcase
        address_line_2: userDetails.address_line_2 || '',
        city: userDetails.city || '',
        state: userDetails.state || '',
        pincode: userDetails.pincode || '',
        // eslint-disable-next-line camelcase
        is_premium: userDetails.is_premium || false,
        notes: userDetails.notes || '',
      });
    }
  }, [userDetails]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    updateUserMutation.mutate(
      { userId, data: editFormData },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const handleStatusUpdate = (newStatus) => {
    if (newStatus === 'active') {
      activateUserMutation.mutate({ userId });
    } else if (newStatus === 'inactive') {
      deactivateUserMutation.mutate({ userId });
    } else if (newStatus === 'suspended') {
      suspendUserMutation.mutate({ userId });
    } else {
      updateUserMutation.mutate({ userId, status: newStatus });
    }
  };

  const handleDeleteUser = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Are you sure you want to delete ${userDetails?.fullName || userDetails?.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate({
        userId,
        reason: 'Deleted by admin from user details page',
      }, {
        onSuccess: () => {
          navigate('/admin/users');
        },
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-warning-500" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-info-500" />;
      case 'ca_firm_admin':
        return <Building2 className="h-4 w-4 text-success-500" />;
      case 'ca':
      case 'senior_ca':
        return <User className="h-4 w-4 text-secondary-500" />;
      default:
        return <User className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-warning-100 text-warning-800';
      case 'platform_admin':
        return 'bg-info-100 text-info-800';
      case 'ca_firm_admin':
        return 'bg-success-100 text-success-800';
      case 'ca':
      case 'senior_ca':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-error-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      default:
        return <User className="h-4 w-4 text-neutral-500" />;
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'filings', name: 'Filings', icon: FileText },
    { id: 'activity', name: 'Activity', icon: Activity },
    { id: 'notes', name: 'Notes', icon: StickyNote },
    { id: 'settings', name: 'Settings', icon: Shield },
  ];

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <Typography.Body className="text-neutral-600">Loading user details...</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !userDetails) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-error-500" />
              </div>
              <Typography.H3 className="mb-2">User Not Found</Typography.H3>
              <Typography.Body className="text-neutral-600 mb-6">
                The user you're looking for doesn\'t exist or you don't have access to it.
              </Typography.Body>
              <Button onClick={() => navigate('/admin/users')}>
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Impersonation Banner */}
        {isImpersonating && (
          <Card className="mb-6 border-warning-300 bg-warning-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                  <div>
                    <Typography.Small className="font-semibold text-warning-900">
                      You are currently impersonating {userDetails?.name || userDetails?.email}
                    </Typography.Small>
                    <Typography.Small className="text-warning-700">
                      All actions will be performed as this user
                    </Typography.Small>
                  </div>
                </div>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    stopImpersonationMutation.mutate();
                  }}
                  disabled={stopImpersonationMutation.isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Stop Impersonation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Typography.H1 className="mb-1">{userDetails.name}</Typography.H1>
              <Typography.Small className="text-neutral-500">User ID: {userDetails.user_id}</Typography.Small>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                {!isImpersonating && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      if (window.confirm(`Are you sure you want to impersonate ${userDetails.name || userDetails.email}? You will be logged in as this user.`)) {
                        impersonateUserMutation.mutate({
                          userId,
                          reason: 'Admin impersonation from user details page',
                        });
                      }
                    }}
                    disabled={impersonateUserMutation.isLoading}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    {impersonateUserMutation.isLoading ? 'Impersonating...' : 'Impersonate'}
                  </Button>
                )}
                {isImpersonating && (
                  <Button
                    variant="warning"
                    onClick={() => {
                      stopImpersonationMutation.mutate();
                    }}
                    disabled={stopImpersonationMutation.isLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {stopImpersonationMutation.isLoading ? 'Stopping...' : 'Stop Impersonation'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="error" onClick={handleDeleteUser} disabled={deleteUserMutation.isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} disabled={updateUserMutation.isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateUserMutation.isLoading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-6">
          <CardContent className="p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <StaggerContainer className="space-y-6">
            {/* User Information */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-body-regular font-medium text-neutral-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-body-regular font-medium text-neutral-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-body-regular font-medium text-neutral-700 mb-1">Mobile</label>
                          <input
                            type="tel"
                            value={editFormData.mobile}
                            onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                            className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-body-regular font-medium text-neutral-700 mb-1">Role</label>
                          <select
                            value={editFormData.role}
                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                            className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="user">User</option>
                            <option value="ca">CA</option>
                            <option value="senior_ca">Senior CA</option>
                            <option value="ca_firm_admin">CA Firm Admin</option>
                            <option value="platform_admin">Platform Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Mail className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Email</Typography.Small>
                            <Typography.Body className="font-medium">{userDetails.email}</Typography.Body>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Phone className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Mobile</Typography.Small>
                            <Typography.Body className="font-medium">{userDetails.mobile || 'Not provided'}</Typography.Body>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Joined</Typography.Small>
                            <Typography.Body className="font-medium">
                              {new Date(userDetails.created_at).toLocaleDateString()}
                            </Typography.Body>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Address</Typography.Small>
                            <Typography.Body className="font-medium">
                              {userDetails.address_line_1 && userDetails.city && userDetails.state
                                ? `${userDetails.address_line_1}, ${userDetails.city}, ${userDetails.state} - ${userDetails.pincode}`
                                : 'Not provided'
                              }
                            </Typography.Body>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Organization</Typography.Small>
                            <Typography.Body className="font-medium">{userDetails.organization || 'Not provided'}</Typography.Body>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Shield className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Last Login</Typography.Small>
                            <Typography.Body className="font-medium">
                              {userDetails.last_login ? new Date(userDetails.last_login).toLocaleString() : 'Never'}
                            </Typography.Body>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Tags */}
            <StaggerItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add Tag Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            e.preventDefault();
                            addTagMutation.mutate(
                              { userId, tag: newTag.trim() },
                              {
                                onSuccess: () => {
                                  setNewTag('');
                                },
                              },
                            );
                          }
                        }}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => {
                          if (newTag.trim()) {
                            addTagMutation.mutate(
                              { userId, tag: newTag.trim() },
                              {
                                onSuccess: () => {
                                  setNewTag('');
                                },
                              },
                            );
                          }
                        }}
                        disabled={!newTag.trim() || addTagMutation.isLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tags List */}
                    {tags.length === 0 ? (
                      <Typography.Small className="text-neutral-500">No tags yet</Typography.Small>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-body-regular"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                            <button
                              onClick={() => {
                                removeTagMutation.mutate({ userId, tag });
                              }}
                              disabled={removeTagMutation.isLoading}
                              className="hover:bg-primary-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Status and Role */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>Status & Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(userDetails.status)}
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(userDetails.status)}`}>
                        {userDetails.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(userDetails.role)}
                      <span className={`px-3 py-1 text-sm rounded-full ${getRoleColor(userDetails.role)}`}>
                        {userDetails.role?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {userDetails.is_premium && (
                      <span className="px-3 py-1 text-body-regular rounded-full bg-secondary-100 text-secondary-800 flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>Premium</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Quick Stats */}
            <StaggerItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-info-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Total Filings</Typography.Small>
                        <Typography.H3>{filings.length}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-success-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Completed</Typography.Small>
                        <Typography.H3>{filings.filter(f => f.status === 'completed').length}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-secondary-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Activity Score</Typography.Small>
                        <Typography.H3>{userDetails.activity_score || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <IndianRupee className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <Typography.Small className="text-neutral-500">Total Spent</Typography.Small>
                        <Typography.H3>₹{userDetails.total_spent || 0}</Typography.H3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Filings Tab */}
        {activeTab === 'filings' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Filings</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/filings?user_id=${userId}`)}
              >
                View All Filings
              </Button>
            </CardHeader>
            <CardContent>
              {filings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-neutral-400" />
                  </div>
                  <Typography.H3 className="mb-2">No filings found</Typography.H3>
                  <Typography.Body className="text-neutral-600">
                    This user hasn't filed any ITR yet.
                  </Typography.Body>
                </div>
              ) : (
                <div className="space-y-3">
                  {filings.slice(0, 10).map((filing) => (
                    <div key={filing.filing_id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-info-100 rounded-xl flex items-center justify-center">
                          <FileText className="h-5 w-5 text-info-600" />
                        </div>
                        <div>
                          <Typography.Body className="font-medium">{filing.itr_type}</Typography.Body>
                          <Typography.Small className="text-neutral-500">
                            AY: {filing.assessment_year} • Created: {new Date(filing.created_at).toLocaleDateString()}
                          </Typography.Small>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${filing.status === 'completed' ? 'bg-success-100 text-success-700' :
                          filing.status === 'in_progress' ? 'bg-info-100 text-info-700' :
                            filing.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                              'bg-neutral-100 text-neutral-700'
                          }`}>
                          {filing.status?.replace(/_/g, ' ')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/filings/${filing.filing_id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-neutral-400" />
                  </div>
                  <Typography.H3 className="mb-2">No activity found</Typography.H3>
                  <Typography.Body className="text-neutral-600">
                    This user hasn't performed any activities yet.
                  </Typography.Body>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-xl">
                      <div className="w-8 h-8 bg-neutral-200 rounded-xl flex items-center justify-center">
                        <Activity className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="flex-1">
                        <Typography.Body className="font-medium">{activity.description}</Typography.Body>
                        <Typography.Small className="text-neutral-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography.Small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Notes</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setNoteFormData({ content: '', isPrivate: false });
                  setEditingNote(null);
                  setShowNoteForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {/* Note Form */}
              {showNoteForm && (
                <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                        Note Content <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        value={noteFormData.content}
                        onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter note content..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={noteFormData.isPrivate}
                        onChange={(e) => setNoteFormData({ ...noteFormData, isPrivate: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="isPrivate" className="text-body-regular text-neutral-600">
                        Private note (only visible to admins)
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (editingNote) {
                            updateNoteMutation.mutate({
                              userId,
                              noteId: editingNote.id,
                              noteData: noteFormData,
                            }, {
                              onSuccess: () => {
                                setShowNoteForm(false);
                                setEditingNote(null);
                                setNoteFormData({ content: '', isPrivate: false });
                              },
                            });
                          } else {
                            createNoteMutation.mutate({
                              userId,
                              noteData: noteFormData,
                            }, {
                              onSuccess: () => {
                                setShowNoteForm(false);
                                setNoteFormData({ content: '', isPrivate: false });
                              },
                            });
                          }
                        }}
                        disabled={!noteFormData.content.trim() || createNoteMutation.isLoading || updateNoteMutation.isLoading}
                      >
                        {editingNote ? 'Update Note' : 'Create Note'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNoteForm(false);
                          setEditingNote(null);
                          setNoteFormData({ content: '', isPrivate: false });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes List */}
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <StickyNote className="h-8 w-8 text-neutral-400" />
                  </div>
                  <Typography.H3 className="mb-2">No notes yet</Typography.H3>
                  <Typography.Body className="text-neutral-600 mb-4">
                    Add a note to track important information about this user.
                  </Typography.Body>
                  {!showNoteForm && (
                    <Button
                      onClick={() => {
                        setNoteFormData({ content: '', isPrivate: false });
                        setShowNoteForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Note
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border ${note.isPrivate ? 'bg-warning-50 border-warning-200' : 'bg-neutral-50 border-neutral-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-neutral-500" />
                          {note.isPrivate && (
                            <span className="px-2 py-0.5 text-body-small bg-warning-100 text-warning-700 rounded">
                              Private
                            </span>
                          )}
                          <Typography.Small className="text-neutral-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </Typography.Small>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNote(note);
                              setNoteFormData({ content: note.content, isPrivate: note.isPrivate });
                              setShowNoteForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // eslint-disable-next-line no-alert
                              if (window.confirm('Are you sure you want to delete this note?')) {
                                deleteNoteMutation.mutate({ userId, noteId: note.id });
                              }
                            }}
                            disabled={deleteNoteMutation.isLoading}
                            className="text-error-600 hover:bg-error-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Typography.Body className="whitespace-pre-wrap">{note.content}</Typography.Body>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <Typography.Small className="text-neutral-400 mt-2 block">
                          Updated {new Date(note.updatedAt).toLocaleString()}
                        </Typography.Small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <Card>
            <CardHeader>
              <CardTitle>User Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.Body className="text-neutral-600 mb-4">
                Send email or SMS messages to this user. All communications are logged in the history.
              </Typography.Body>
              <div className="text-center py-8 text-neutral-500">
                Communication interface - Backend endpoints ready. UI can be enhanced with full form.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleStatusUpdate('active')}
                  disabled={userDetails.status === 'active'}
                  className="p-4 border border-success-300 rounded-xl hover:bg-success-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-6 w-6 text-success-600 mx-auto mb-2" />
                  <Typography.Small className="font-medium text-success-700 block text-center">Activate</Typography.Small>
                </button>

                <button
                  onClick={() => handleStatusUpdate('suspended')}
                  disabled={userDetails.status === 'suspended'}
                  className="p-4 border border-warning-300 rounded-xl hover:bg-warning-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircle className="h-6 w-6 text-warning-600 mx-auto mb-2" />
                  <Typography.Small className="font-medium text-warning-700 block text-center">Suspend</Typography.Small>
                </button>

                <button
                  onClick={() => handleStatusUpdate('inactive')}
                  disabled={userDetails.status === 'inactive'}
                  className="p-4 border border-error-300 rounded-xl hover:bg-error-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="h-6 w-6 text-error-600 mx-auto mb-2" />
                  <Typography.Small className="font-medium text-error-700 block text-center">Deactivate</Typography.Small>
                </button>

                <button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={userDetails.status === 'pending'}
                  className="p-4 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="h-6 w-6 text-neutral-600 mx-auto mb-2" />
                  <Typography.Small className="font-medium text-neutral-700 block text-center">Set Pending</Typography.Small>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminUserDetails;
