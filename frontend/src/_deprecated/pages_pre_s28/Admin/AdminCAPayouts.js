// =====================================================
// ADMIN CA PAYOUT MANAGEMENT PAGE
// CA firm payouts with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  IndianRupee,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Building2,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminCAPayouts = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFirms, setSelectedFirms] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduleType: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
  });

  useEffect(() => {
    loadPayouts();
  }, [pagination.offset, statusFilter]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCAPayouts({
        status: statusFilter,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setPayouts(data.payouts || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (selectedFirms.length === 0) {
      toast.error('Please select at least one CA firm');
      return;
    }

    // eslint-disable-next-line no-alert
    if (!window.confirm(`Process payouts for ${selectedFirms.length} CA firm(s)?`)) {
      return;
    }

    setProcessing(true);
    try {
      await adminService.processCAPayouts(selectedFirms);
      toast.success(`Payouts processed for ${selectedFirms.length} firm(s)`);
      setSelectedFirms([]);
      loadPayouts();
    } catch (error) {
      console.error('Failed to process payouts:', error);
      toast.error('Failed to process payouts');
    } finally {
      setProcessing(false);
    }
  };

  const handleSchedulePayouts = async () => {
    setProcessing(true);
    try {
      await adminService.scheduleCAPayouts(scheduleData);
      toast.success('Payout schedule created successfully');
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Failed to schedule payouts:', error);
      toast.error('Failed to schedule payouts');
    } finally {
      setProcessing(false);
    }
  };

  const toggleFirmSelection = (firmId) => {
    setSelectedFirms(prev =>
      prev.includes(firmId)
        ? prev.filter(id => id !== firmId)
        : [...prev, firmId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedFirms.length === payouts.length) {
      setSelectedFirms([]);
    } else {
      setSelectedFirms(payouts.map(p => p.firmId));
    }
  };

  const filteredPayouts = payouts.filter(payout =>
    searchTerm
      ? payout.firmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.firmEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      : true,
  );

  const totalPendingAmount = payouts.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">CA Payout Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage CA firm commissions and payouts
            </Typography.Body>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button
              onClick={handleProcessPayouts}
              disabled={selectedFirms.length === 0 || processing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Process ({selectedFirms.length})
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StaggerItem>
            <Card>
              <CardContent className="p-4 text-center">
                <Typography.H3 className="text-primary-600">
                  ₹{totalPendingAmount.toLocaleString('en-IN')}
                </Typography.H3>
                <Typography.Small className="text-neutral-500">Total Pending</Typography.Small>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4 text-center">
                <Typography.H3>{payouts.length}</Typography.H3>
                <Typography.Small className="text-neutral-500">CA Firms</Typography.Small>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4 text-center">
                <Typography.H3>{selectedFirms.length}</Typography.H3>
                <Typography.Small className="text-neutral-500">Selected</Typography.Small>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by firm name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="all">All</option>
              </select>
              <Button variant="outline" onClick={loadPayouts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payouts List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payouts</CardTitle>
            {payouts.length > 0 && (
              <label className="flex items-center gap-2 text-body-regular cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFirms.length === payouts.length && payouts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                Select All
              </label>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No payouts found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  No payouts match your current filters.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredPayouts.map((payout) => (
                  <StaggerItem key={payout.firmId} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedFirms.includes(payout.firmId)}
                        onChange={() => toggleFirmSelection(payout.firmId)}
                        className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Typography.Body className="font-semibold">{payout.firmName}</Typography.Body>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            payout.pendingAmount > 0 ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'
                          }`}>
                            {payout.pendingAmount > 0 ? 'Pending' : 'Paid'}
                          </span>
                        </div>
                        <Typography.Small className="text-neutral-500 block mb-2">
                          {payout.firmEmail}
                        </Typography.Small>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-regular">
                          <div>
                            <Typography.Small className="text-neutral-500">Revenue</Typography.Small>
                            <Typography.Body className="font-medium">
                              ₹{payout.totalRevenue?.toLocaleString('en-IN') || 0}
                            </Typography.Body>
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Commission ({payout.commissionPercentage}%)</Typography.Small>
                            <Typography.Body className="font-medium">
                              ₹{payout.commissionAmount?.toLocaleString('en-IN') || 0}
                            </Typography.Body>
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Paid</Typography.Small>
                            <Typography.Body className="font-medium text-success-600">
                              ₹{payout.paidCommissions?.toLocaleString('en-IN') || 0}
                            </Typography.Body>
                          </div>
                          <div>
                            <Typography.Small className="text-neutral-500">Pending</Typography.Small>
                            <Typography.Body className="font-medium text-primary-600">
                              ₹{payout.pendingAmount?.toLocaleString('en-IN') || 0}
                            </Typography.Body>
                          </div>
                        </div>
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

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Schedule Recurring Payouts</CardTitle>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Schedule Type
                  </label>
                  <select
                    value={scheduleData.scheduleType}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduleType: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                  </select>
                </div>
                {scheduleData.scheduleType === 'monthly' && (
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Day of Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={scheduleData.dayOfMonth}
                      onChange={(e) => setScheduleData({ ...scheduleData, dayOfMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSchedulePayouts} disabled={processing}>
                    {processing ? 'Saving...' : 'Save Schedule'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminCAPayouts;
