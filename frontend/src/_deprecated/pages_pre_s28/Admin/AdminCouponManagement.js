// =====================================================
// ADMIN COUPON MANAGEMENT PAGE
// Manages discount coupons and promotional codes
// =====================================================

import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import Badge from '../../components/DesignSystem/components/Badge';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminCouponManagement = () => {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    applicablePlans: [],
    userRestrictions: {
      userTypes: [],
      userIds: [],
      newUsersOnly: false,
    },
    minimumOrderValue: 0,
  });
  const [usageStats, setUsageStats] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, [pagination.offset, activeFilter]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const params = {
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        limit: pagination.limit,
        offset: pagination.offset,
      };
      const data = await adminService.getCoupons(params);
      setCoupons(data.coupons || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const loadCouponUsage = async (coupon) => {
    try {
      const data = await adminService.getCouponUsage(coupon.id);
      setUsageStats(data.usage);
      setSelectedCoupon(coupon);
      setShowUsageModal(true);
    } catch (error) {
      console.error('Failed to load coupon usage:', error);
      toast.error('Failed to load coupon usage');
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setProcessing(true);
    try {
      await adminService.createCoupon(formData);
      toast.success('Coupon created successfully');
      setShowCreateModal(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    setProcessing(true);
    try {
      await adminService.updateCoupon(selectedCoupon.id, formData);
      toast.success('Coupon updated successfully');
      setShowEditModal(false);
      setSelectedCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Failed to update coupon:', error);
      toast.error('Failed to update coupon');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (couponId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    setProcessing(couponId);
    try {
      await adminService.deleteCoupon(couponId);
      toast.success('Coupon deleted successfully');
      loadCoupons();
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      toast.error('Failed to delete coupon');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (coupon) => {
    setProcessing(coupon.id);
    try {
      await adminService.updateCoupon(coupon.id, {
        isActive: !coupon.isActive,
      });
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully`);
      loadCoupons();
    } catch (error) {
      console.error('Failed to toggle coupon status:', error);
      toast.error('Failed to update coupon status');
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      usageLimit: coupon.usageLimit || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      applicablePlans: coupon.applicablePlans || [],
      userRestrictions: coupon.userRestrictions || {
        userTypes: [],
        userIds: [],
        newUsersOnly: false,
      },
      minimumOrderValue: coupon.minimumOrderValue || 0,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      applicablePlans: [],
      userRestrictions: {
        userTypes: [],
        userIds: [],
        newUsersOnly: false,
      },
      minimumOrderValue: 0,
    });
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return coupon.code?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const userTypes = ['individual', 'ca', 'enterprise'];

  const getStatusBadge = (coupon) => {
    const isValid = coupon.isValid ? coupon.isValid() : (
      coupon.isActive &&
      new Date() >= new Date(coupon.startDate) &&
      new Date() <= new Date(coupon.endDate) &&
      (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
    );

    if (isValid && coupon.isActive) {
      return <Badge variant="success">Valid</Badge>;
    } else if (!coupon.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="warning">Expired</Badge>;
  };

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Coupon Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Create and manage discount coupons and promotional codes
            </Typography.Body>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
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
                  placeholder="Search by coupon code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <Button variant="outline" onClick={loadCoupons}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No coupons found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  Create your first coupon to get started.
                </Typography.Body>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Coupon Code
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Validity
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {filteredCoupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Body className="font-mono font-medium">{coupon.code}</Typography.Body>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Body>
                              {coupon.discountType === 'percentage'
                                ? `${coupon.discountValue}%`
                                : `₹${coupon.discountValue}`}
                            </Typography.Body>
                            {coupon.minimumOrderValue > 0 && (
                              <Typography.Small className="text-neutral-500 block">
                                Min: ₹{coupon.minimumOrderValue}
                              </Typography.Small>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Small className="block">
                              {new Date(coupon.startDate).toLocaleDateString()}
                            </Typography.Small>
                            <Typography.Small className="text-neutral-500">
                              to {new Date(coupon.endDate).toLocaleDateString()}
                            </Typography.Small>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Body>
                              {coupon.usedCount || 0}
                              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                            </Typography.Body>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(coupon)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadCouponUsage(coupon)}
                              >
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Usage
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(coupon)}
                                disabled={processing === coupon.id}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(coupon.id)}
                                disabled={processing === coupon.id}
                                className="text-error-600 hover:text-error-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                    <Typography.Small className="text-neutral-600">
                      Showing {pagination.offset + 1} to{' '}
                      {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </Typography.Small>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })
                        }
                        disabled={pagination.offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                        }
                        disabled={pagination.offset + pagination.limit >= pagination.total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{showCreateModal ? 'Create Coupon' : 'Edit Coupon'}</CardTitle>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedCoupon(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Coupon Code <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="DISCOUNT10"
                      disabled={showEditModal}
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Discount Type <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Discount Value <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="Unlimited if empty"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Start Date <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      End Date <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Minimum Order Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumOrderValue}
                    onChange={(e) => setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    User Type Restrictions
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {userTypes.map((type) => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.userRestrictions.userTypes.includes(type)}
                          onChange={(e) => {
                            const currentTypes = formData.userRestrictions.userTypes || [];
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                userRestrictions: {
                                  ...formData.userRestrictions,
                                  userTypes: [...currentTypes, type],
                                },
                              });
                            } else {
                              setFormData({
                                ...formData,
                                userRestrictions: {
                                  ...formData.userRestrictions,
                                  userTypes: currentTypes.filter(t => t !== type),
                                },
                              });
                            }
                          }}
                          className="mr-2 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-body-regular text-neutral-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.userRestrictions.newUsersOnly}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          userRestrictions: {
                            ...formData.userRestrictions,
                            newUsersOnly: e.target.checked,
                          },
                        });
                      }}
                      className="mr-2 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-body-regular text-neutral-700">New Users Only</span>
                  </label>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                      setSelectedCoupon(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    disabled={
                      !formData.code ||
                      !formData.discountValue ||
                      !formData.startDate ||
                      !formData.endDate ||
                      processing
                    }
                  >
                    {processing ? 'Saving...' : showCreateModal ? 'Create Coupon' : 'Update Coupon'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Usage Stats Modal */}
        {showUsageModal && selectedCoupon && usageStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Coupon Usage Statistics</CardTitle>
                <button
                  onClick={() => {
                    setShowUsageModal(false);
                    setUsageStats(null);
                    setSelectedCoupon(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Typography.Small className="text-neutral-500">Coupon Code</Typography.Small>
                  <Typography.Body className="font-mono font-semibold">{selectedCoupon.code}</Typography.Body>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography.Small className="text-neutral-500">Total Used</Typography.Small>
                    <Typography.H3>{usageStats.totalUsed}</Typography.H3>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Usage Limit</Typography.Small>
                    <Typography.H3>{usageStats.usageLimit || 'Unlimited'}</Typography.H3>
                  </div>
                  {usageStats.usageLimit && (
                    <div>
                      <Typography.Small className="text-neutral-500">Remaining Uses</Typography.Small>
                      <Typography.H3>{usageStats.remainingUses}</Typography.H3>
                    </div>
                  )}
                  <div>
                    <Typography.Small className="text-neutral-500">Status</Typography.Small>
                    <div className="mt-1">
                      <Badge variant={usageStats.isValid ? 'success' : 'warning'}>
                        {usageStats.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <Typography.Small className="text-neutral-500 block">
                    Start Date: {new Date(usageStats.startDate).toLocaleDateString()}
                  </Typography.Small>
                  <Typography.Small className="text-neutral-500 block">
                    End Date: {new Date(usageStats.endDate).toLocaleDateString()}
                  </Typography.Small>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminCouponManagement;
