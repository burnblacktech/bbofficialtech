// =====================================================
// ADMIN TRANSACTION MANAGEMENT PAGE
// Full-featured financial transactions management
// Implements admin-flows.md Section 6.2
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import Badge from '../../components/DesignSystem/components/Badge';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  IndianRupee,
  Search,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Filter,
  CreditCard,
  Wallet,
  Building2,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminTransactionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    disputed: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [refundData, setRefundData] = useState({
    amount: '',
    reason: '',
    refundType: 'full',
  });
  const [disputeData, setDisputeData] = useState({
    reason: '',
    details: '',
  });
  const [newNote, setNewNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  useEffect(() => {
    loadTransactions();
  }, [pagination.offset, filters]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getTransactionStats({ timeRange });
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      };
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const data = await adminService.getTransactions(params);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (transactionId) => {
    try {
      const data = await adminService.getTransactionDetails(transactionId);
      setSelectedTransaction(data.transaction);
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      toast.error('Failed to load transaction details');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundData.reason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }

    setProcessing(true);
    try {
      await adminService.processRefund(selectedTransaction.id, refundData);
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundData({ amount: '', reason: '', refundType: 'full' });
      setSelectedTransaction(null);
      loadTransactions();
      loadStats();
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsDisputed = async () => {
    if (!disputeData.reason.trim()) {
      toast.error('Please provide a dispute reason');
      return;
    }

    setProcessing(true);
    try {
      await adminService.markAsDisputed(selectedTransaction.id, disputeData);
      toast.success('Transaction marked as disputed');
      setShowDisputeModal(false);
      setDisputeData({ reason: '', details: '' });
      handleViewDetails(selectedTransaction.id);
      loadTransactions();
    } catch (error) {
      console.error('Failed to mark as disputed:', error);
      toast.error('Failed to mark transaction as disputed');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setProcessing(true);
    try {
      await adminService.addTransactionNotes(selectedTransaction.id, newNote);
      toast.success('Note added successfully');
      setNewNote('');
      handleViewDetails(selectedTransaction.id);
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPayment = async (transactionId) => {
    setProcessing(true);
    try {
      await adminService.retryFailedPayment(transactionId);
      toast.success('Payment retry initiated');
      loadTransactions();
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = { ...filters, format };
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await adminService.exportTransactions(params);
      const blob = new Blob([format === 'csv' ? response : JSON.stringify(response.transactions, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Failed to export transactions:', error);
      toast.error('Failed to export transactions');
    }
  };

  const openRefundModal = (transaction) => {
    setSelectedTransaction(transaction);
    setRefundData({
      amount: transaction.totalAmount,
      reason: '',
      refundType: 'full',
    });
    setShowRefundModal(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
        transaction.user?.fullName?.toLowerCase().includes(searchLower) ||
        transaction.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success-100 text-success-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'refunded':
        return 'bg-info-100 text-info-700';
      case 'failed':
        return 'bg-error-100 text-error-700';
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success-100 text-success-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'failed':
        return 'bg-error-100 text-error-700';
      case 'refunded':
        return 'bg-info-100 text-info-700';
      case 'partial':
        return 'bg-primary-100 text-primary-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'razorpay':
      case 'stripe':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Transaction Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              View and manage all financial transactions
            </Typography.Body>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-primary-600 font-medium">Total Revenue</Typography.Small>
                    <Typography.H2 className="text-primary-900">
                      {statsLoading ? '...' : formatCurrency(stats?.summary?.totalRevenue)}
                    </Typography.H2>
                    <Typography.Small className="text-primary-600">
                      {stats?.summary?.successfulTransactions || 0} successful
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-primary-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-success-600 font-medium">Success Rate</Typography.Small>
                    <Typography.H2 className="text-success-900">
                      {statsLoading ? '...' : `${stats?.summary?.successRate || 0}%`}
                    </Typography.H2>
                    <Typography.Small className="text-success-600">
                      Avg: {formatCurrency(stats?.summary?.averageTransaction)}
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-success-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-warning-600 font-medium">Pending</Typography.Small>
                    <Typography.H2 className="text-warning-900">
                      {statsLoading ? '...' : stats?.summary?.pendingTransactions || 0}
                    </Typography.H2>
                    <Typography.Small className="text-warning-600">
                      Awaiting payment
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-warning-200 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-gradient-to-br from-error-50 to-error-100 border-error-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-error-600 font-medium">Refunded</Typography.Small>
                    <Typography.H2 className="text-error-900">
                      {statsLoading ? '...' : formatCurrency(stats?.summary?.totalRefunded)}
                    </Typography.H2>
                    <Typography.Small className="text-error-600">
                      {stats?.summary?.refundedTransactions || 0} transactions
                    </Typography.Small>
                  </div>
                  <div className="w-12 h-12 bg-error-200 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-error-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-neutral-500" />
              <Typography.Body className="font-medium">Filters</Typography.Body>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by invoice, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filters.paymentStatus}
                onChange={(e) => {
                  setFilters({ ...filters, paymentStatus: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={filters.paymentMethod}
                onChange={(e) => {
                  setFilters({ ...filters, paymentMethod: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Payment Methods</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="offline">Offline</option>
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="End Date"
              />
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.disputed === 'true'}
                  onChange={(e) => {
                    setFilters({ ...filters, disputed: e.target.checked ? 'true' : '' });
                    setPagination({ ...pagination, offset: 0 });
                  }}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <Typography.Small>Disputed Only</Typography.Small>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    status: '',
                    paymentStatus: '',
                    paymentMethod: '',
                    startDate: '',
                    endDate: '',
                    minAmount: '',
                    disputed: '',
                  });
                  setSearchTerm('');
                  setPagination({ ...pagination, offset: 0 });
                }}
              >
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={loadTransactions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No transactions found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  Try adjusting your filters.
                </Typography.Body>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Typography.Body className="font-medium">{transaction.invoiceNumber}</Typography.Body>
                            {transaction.metadata?.disputed && (
                              <Badge variant="error" size="sm">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Disputed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Typography.Body className="font-medium">{transaction.user?.fullName || 'N/A'}</Typography.Body>
                          <Typography.Small className="text-neutral-500">{transaction.user?.email || 'N/A'}</Typography.Small>
                        </td>
                        <td className="px-4 py-4">
                          <Typography.Body className="font-semibold">{formatCurrency(transaction.totalAmount)}</Typography.Body>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                            {transaction.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            <Typography.Small className="capitalize">{transaction.paymentMethod || 'N/A'}</Typography.Small>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Typography.Small className="text-neutral-600">
                            {new Date(transaction.invoiceDate).toLocaleDateString()}
                          </Typography.Small>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(transaction.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {transaction.paymentStatus === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryPayment(transaction.id)}
                                disabled={processing}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            {transaction.paymentStatus === 'paid' && !transaction.metadata?.disputed && (
                              <Button variant="error" size="sm" onClick={() => openRefundModal(transaction)}>
                                Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        {/* Transaction Detail Modal */}
        {selectedTransaction && !showRefundModal && !showDisputeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
                <CardTitle className="flex items-center gap-2">
                  Transaction Details
                  {selectedTransaction.metadata?.disputed && (
                    <Badge variant="error">Disputed</Badge>
                  )}
                </CardTitle>
                <button onClick={() => setSelectedTransaction(null)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Typography.Small className="text-neutral-500">Invoice Number</Typography.Small>
                    <Typography.Body className="font-medium">{selectedTransaction.invoiceNumber}</Typography.Body>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Date</Typography.Small>
                    <Typography.Body>{new Date(selectedTransaction.invoiceDate).toLocaleDateString()}</Typography.Body>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Status</Typography.Small>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">User</Typography.Small>
                    <Typography.Body className="font-medium">{selectedTransaction.user?.fullName || 'N/A'}</Typography.Body>
                    <Typography.Small className="text-neutral-400">{selectedTransaction.user?.email || 'N/A'}</Typography.Small>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Amount</Typography.Small>
                    <Typography.H3>{formatCurrency(selectedTransaction.totalAmount)}</Typography.H3>
                  </div>
                  <div>
                    <Typography.Small className="text-neutral-500">Payment Method</Typography.Small>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <Typography.Body className="capitalize">{selectedTransaction.paymentMethod || 'N/A'}</Typography.Body>
                    </div>
                  </div>
                </div>

                {/* Filing Info */}
                {selectedTransaction.filing && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <Typography.Small className="text-neutral-500 font-medium mb-2 block">Related Filing</Typography.Small>
                    <div className="flex items-center gap-4">
                      <Typography.Body>{selectedTransaction.filing.itrType}</Typography.Body>
                      <Typography.Body className="text-neutral-500">AY {selectedTransaction.filing.assessmentYear}</Typography.Body>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTransaction.filing.status)}`}>
                        {selectedTransaction.filing.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dispute Info */}
                {selectedTransaction.metadata?.disputed && (
                  <div className="p-4 bg-error-50 rounded-lg border border-error-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-error-600" />
                      <Typography.Body className="font-medium text-error-700">Dispute Information</Typography.Body>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Typography.Small className="text-error-600">Reason:</Typography.Small>
                        <Typography.Body>{selectedTransaction.metadata.disputeReason}</Typography.Body>
                      </div>
                      <div>
                        <Typography.Small className="text-error-600">Status:</Typography.Small>
                        <Typography.Body className="capitalize">{selectedTransaction.metadata.disputeStatus}</Typography.Body>
                      </div>
                      <div>
                        <Typography.Small className="text-error-600">Disputed At:</Typography.Small>
                        <Typography.Body>{new Date(selectedTransaction.metadata.disputedAt).toLocaleString()}</Typography.Body>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Typography.Body className="font-medium">Admin Notes</Typography.Body>
                    <Button variant="outline" size="sm" onClick={() => setShowNotesModal(true)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                  {selectedTransaction.metadata?.adminNotes?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTransaction.metadata.adminNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-neutral-50 rounded-lg">
                          <Typography.Body>{note.content}</Typography.Body>
                          <Typography.Small className="text-neutral-500">
                            {note.addedByName} • {new Date(note.addedAt).toLocaleString()}
                          </Typography.Small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Typography.Small className="text-neutral-500">No notes yet</Typography.Small>
                  )}
                </div>

                {/* Related Transactions */}
                {selectedTransaction.relatedTransactions?.length > 0 && (
                  <div>
                    <Typography.Body className="font-medium mb-3">Related Transactions</Typography.Body>
                    <div className="space-y-2">
                      {selectedTransaction.relatedTransactions.map((related) => (
                        <div key={related.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <div>
                            <Typography.Body className="font-medium">{related.invoiceNumber}</Typography.Body>
                            <Typography.Small className="text-neutral-500">
                              {new Date(related.invoiceDate).toLocaleDateString()}
                            </Typography.Small>
                          </div>
                          <div className="flex items-center gap-2">
                            <Typography.Body>{formatCurrency(related.totalAmount)}</Typography.Body>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(related.status)}`}>
                              {related.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200">
                  {selectedTransaction.paymentStatus === 'paid' && !selectedTransaction.metadata?.disputed && (
                    <>
                      <Button variant="error" onClick={() => setShowRefundModal(true)}>
                        Process Refund
                      </Button>
                      <Button variant="outline" onClick={() => setShowDisputeModal(true)}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Mark as Disputed
                      </Button>
                    </>
                  )}
                  {selectedTransaction.paymentStatus === 'failed' && (
                    <Button variant="primary" onClick={() => handleRetryPayment(selectedTransaction.id)} disabled={processing}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Notes Modal */}
        {showNotesModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Add Note</CardTitle>
                <button onClick={() => setShowNotesModal(false)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Note</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Enter your note..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote} disabled={!newNote.trim() || processing}>
                    {processing ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mark as Disputed</CardTitle>
                <button onClick={() => setShowDisputeModal(false)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Dispute Reason <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={disputeData.reason}
                    onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="unauthorized_transaction">Unauthorized Transaction</option>
                    <option value="duplicate_charge">Duplicate Charge</option>
                    <option value="service_not_provided">Service Not Provided</option>
                    <option value="incorrect_amount">Incorrect Amount</option>
                    <option value="customer_complaint">Customer Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Additional Details</label>
                  <textarea
                    value={disputeData.details}
                    onChange={(e) => setDisputeData({ ...disputeData, details: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter additional details..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button variant="outline" onClick={() => setShowDisputeModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="error" onClick={handleMarkAsDisputed} disabled={!disputeData.reason || processing}>
                    {processing ? 'Processing...' : 'Mark as Disputed'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Process Refund</CardTitle>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundData({ amount: '', reason: '', refundType: 'full' });
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <Typography.Small className="text-neutral-500">Transaction Amount</Typography.Small>
                  <Typography.H3>{formatCurrency(selectedTransaction.totalAmount)}</Typography.H3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Refund Type</label>
                  <select
                    value={refundData.refundType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setRefundData({
                        ...refundData,
                        refundType: type,
                        amount: type === 'full' ? selectedTransaction.totalAmount : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="full">Full Refund</option>
                    <option value="partial">Partial Refund</option>
                  </select>
                </div>
                {refundData.refundType === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Refund Amount <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedTransaction.totalAmount}
                      value={refundData.amount}
                      onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder={`Max: ₹${selectedTransaction.totalAmount}`}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Refund Reason <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter refund reason..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundModal(false);
                      setRefundData({ amount: '', reason: '', refundType: 'full' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="error" onClick={handleProcessRefund} disabled={!refundData.reason.trim() || processing}>
                    {processing ? 'Processing...' : 'Process Refund'}
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

export default AdminTransactionManagement;
