// =====================================================
// INVOICE MANAGEMENT - ADMIN PANEL
// Comprehensive invoice management and tracking for platform administrators
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  FileText,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mock invoice data
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockInvoices = [
        {
          id: 'INV-2024-001',
          invoiceNumber: 'BB-2024-001',
          type: 'itr_filing',
          status: 'paid',
          amount: 2500,
          currency: 'INR',
          createdAt: new Date('2024-01-20T10:30:00'),
          dueDate: new Date('2024-01-20T10:30:00'),
          paidAt: new Date('2024-01-20T10:35:00'),
          user: {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            pan: 'ABCDE1234F',
          },
          description: 'ITR Filing for Assessment Year 2023-24',
          paymentMethod: 'razorpay',
          paymentId: 'pay_1234567890',
          downloadUrl: '/invoices/INV-2024-001.pdf',
        },
        {
          id: 'INV-2024-002',
          invoiceNumber: 'BB-2024-002',
          type: 'expert_review',
          status: 'paid',
          amount: 500,
          currency: 'INR',
          createdAt: new Date('2024-01-19T15:45:00'),
          dueDate: new Date('2024-01-19T15:45:00'),
          paidAt: new Date('2024-01-19T15:50:00'),
          user: {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            pan: 'FGHIJ5678K',
          },
          description: 'Expert Review Service for ITR Filing',
          paymentMethod: 'razorpay',
          paymentId: 'pay_1234567891',
          downloadUrl: '/invoices/INV-2024-002.pdf',
        },
        {
          id: 'INV-2024-003',
          invoiceNumber: 'BB-2024-003',
          type: 'ca_subscription',
          status: 'paid',
          amount: 15000,
          currency: 'INR',
          createdAt: new Date('2024-01-18T09:00:00'),
          dueDate: new Date('2024-02-18T09:00:00'),
          paidAt: new Date('2024-01-18T09:05:00'),
          user: {
            id: 3,
            name: 'CA Firm Alpha',
            email: 'admin@cafirmalpha.com',
            pan: 'LMNOP9012Q',
          },
          description: 'Pro Plan Subscription - Monthly',
          paymentMethod: 'razorpay',
          paymentId: 'pay_1234567892',
          downloadUrl: '/invoices/INV-2024-003.pdf',
        },
        {
          id: 'INV-2024-004',
          invoiceNumber: 'BB-2024-004',
          type: 'itr_filing',
          status: 'pending',
          amount: 2500,
          currency: 'INR',
          createdAt: new Date('2024-01-20T14:30:00'),
          dueDate: new Date('2024-01-21T14:30:00'),
          paidAt: null,
          user: {
            id: 4,
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            pan: 'RSTUV3456W',
          },
          description: 'ITR Filing for Assessment Year 2023-24',
          paymentMethod: null,
          paymentId: null,
          downloadUrl: null,
        },
        {
          id: 'INV-2024-005',
          invoiceNumber: 'BB-2024-005',
          type: 'ca_subscription',
          status: 'overdue',
          amount: 50000,
          currency: 'INR',
          createdAt: new Date('2024-01-15T10:00:00'),
          dueDate: new Date('2024-01-16T10:00:00'),
          paidAt: null,
          user: {
            id: 5,
            name: 'CA Firm Beta',
            email: 'contact@cafirmbeta.com',
            pan: 'XYZAB7890C',
          },
          description: 'Enterprise Plan Subscription - Annual',
          paymentMethod: null,
          paymentId: null,
          downloadUrl: null,
        },
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.user.pan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-success-600 bg-success-100';
      case 'pending': return 'text-warning-600 bg-warning-100';
      case 'overdue': return 'text-error-600 bg-error-100';
      case 'cancelled': return 'text-neutral-600 bg-neutral-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'itr_filing': return 'text-primary-600 bg-primary-100';
      case 'expert_review': return 'text-secondary-600 bg-secondary-100';
      case 'ca_subscription': return 'text-warning-600 bg-warning-100';
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatType = (type) => {
    switch (type) {
      case 'itr_filing': return 'ITR Filing';
      case 'expert_review': return 'Expert Review';
      case 'ca_subscription': return 'CA Subscription';
      default: return type;
    }
  };

  const handleInvoiceAction = (action, invoice) => {
    switch (action) {
      case 'view':
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
        break;
      case 'download':
        // Download invoice
        console.log('Download invoice:', invoice.id);
        break;
      case 'resend':
        // Resend invoice email
        console.log('Resend invoice:', invoice.id);
        break;
      case 'mark_paid':
        // Mark invoice as paid
        console.log('Mark invoice as paid:', invoice.id);
        break;
      default:
        break;
    }
  };

  const getInvoiceStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const pending = invoices.filter(i => i.status === 'pending').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

    return {
      total,
      paid,
      pending,
      overdue,
      totalRevenue,
      pendingRevenue,
    };
  };

  const stats = getInvoiceStats();

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Invoices...</Typography.H1>
            <Typography.Body>Please wait while we load invoice data.</Typography.Body>
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
            <Typography.H1 className="mb-2">Invoice Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage and track platform invoices and payments
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              Export Invoices
            </button>
          </div>
        </div>

        {/* Invoice Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Small className="text-neutral-600 mb-1">
                    Total Invoices
                  </Typography.Small>
                  <Typography.H3 className="text-2xl font-bold text-neutral-900">
                    {stats.total}
                  </Typography.H3>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Small className="text-neutral-600 mb-1">
                    Paid Invoices
                  </Typography.Small>
                  <Typography.H3 className="text-2xl font-bold text-success-600">
                    {stats.paid}
                  </Typography.H3>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Small className="text-neutral-600 mb-1">
                    Pending Invoices
                  </Typography.Small>
                  <Typography.H3 className="text-2xl font-bold text-warning-600">
                    {stats.pending}
                  </Typography.H3>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Small className="text-neutral-600 mb-1">
                    Total Revenue
                  </Typography.Small>
                  <Typography.H3 className="text-2xl font-bold text-secondary-600">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography.H3>
                </div>
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-secondary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                    placeholder="Search invoices by number, user, or PAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="itr_filing">ITR Filing</option>
                  <option value="expert_review">Expert Review</option>
                  <option value="ca_subscription">CA Subscription</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <span>Invoices ({filteredInvoices.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Invoice</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <Typography.Small className="font-medium text-neutral-700">
                            {invoice.invoiceNumber}
                          </Typography.Small>
                          <Typography.Small className="text-neutral-500">
                            {invoice.id}
                          </Typography.Small>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <Typography.Small className="font-medium text-neutral-700">
                            {invoice.user.name}
                          </Typography.Small>
                          <Typography.Small className="text-neutral-500">
                            {invoice.user.email}
                          </Typography.Small>
                          <Typography.Small className="text-neutral-500">
                            PAN: {invoice.user.pan}
                          </Typography.Small>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(invoice.type)}`}>
                          {formatType(invoice.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Typography.Small className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </Typography.Small>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Typography.Small className="text-neutral-500">
                          {formatDate(invoice.createdAt)}
                        </Typography.Small>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleInvoiceAction('view', invoice)}
                            className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.downloadUrl && (
                            <button
                              onClick={() => handleInvoiceAction('download', invoice)}
                              className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => handleInvoiceAction('resend', invoice)}
                              className="p-1 text-neutral-500 hover:text-warning-600 transition-colors"
                              title="Resend Invoice"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          {invoice.status === 'overdue' && (
                            <button
                              onClick={() => handleInvoiceAction('mark_paid', invoice)}
                              className="p-1 text-neutral-500 hover:text-success-600 transition-colors"
                              title="Mark as Paid"
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

        {/* Invoice Details Modal */}
        {showInvoiceModal && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowInvoiceModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Typography.H3>Invoice Details</Typography.H3>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Invoice Information */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Invoice Information
                    </Typography.Small>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography.Small className="text-neutral-500">Invoice Number</Typography.Small>
                        <Typography.Small className="font-medium">{selectedInvoice.invoiceNumber}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Invoice ID</Typography.Small>
                        <Typography.Small className="font-medium">{selectedInvoice.id}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Type</Typography.Small>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedInvoice.type)}`}>
                          {formatType(selectedInvoice.type)}
                        </span>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Status</Typography.Small>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Amount</Typography.Small>
                        <Typography.Small className="font-medium">{formatCurrency(selectedInvoice.amount)}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Created</Typography.Small>
                        <Typography.Small className="font-medium">{formatDate(selectedInvoice.createdAt)}</Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      User Information
                    </Typography.Small>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography.Small className="text-neutral-500">Name</Typography.Small>
                        <Typography.Small className="font-medium">{selectedInvoice.user.name}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Email</Typography.Small>
                        <Typography.Small className="font-medium">{selectedInvoice.user.email}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">PAN</Typography.Small>
                        <Typography.Small className="font-medium">{selectedInvoice.user.pan}</Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  {selectedInvoice.status === 'paid' && (
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-3">
                        Payment Information
                      </Typography.Small>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Typography.Small className="text-neutral-500">Payment Method</Typography.Small>
                          <Typography.Small className="font-medium">{selectedInvoice.paymentMethod}</Typography.Small>
                        </div>
                        <div>
                          <Typography.Small className="text-neutral-500">Payment ID</Typography.Small>
                          <Typography.Small className="font-medium">{selectedInvoice.paymentId}</Typography.Small>
                        </div>
                        <div>
                          <Typography.Small className="text-neutral-500">Paid At</Typography.Small>
                          <Typography.Small className="font-medium">{formatDate(selectedInvoice.paidAt)}</Typography.Small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Description
                    </Typography.Small>
                    <Typography.Small className="text-neutral-600">
                      {selectedInvoice.description}
                    </Typography.Small>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowInvoiceModal(false)}
                      className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Close
                    </button>
                    {selectedInvoice.downloadUrl && (
                      <button
                        onClick={() => handleInvoiceAction('download', selectedInvoice)}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    )}
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

export default InvoiceManagement;
