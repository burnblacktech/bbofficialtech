// =====================================================
// CA STAFF DASHBOARD - ENTERPRISE GRADE
// CA professional interface for managing assigned clients
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services';
import { toast } from 'react-hot-toast';
import {
  Users,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import itrService from '../../services/api/itrService';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import InvoiceBadge from '../../components/ITR/InvoiceBadge';

const CAStaffDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedClients, setAssignedClients] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [billingStats, setBillingStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load assigned clients
      const clientsResponse = await apiClient.get(`/users?assignedTo=${user.id}&role=END_USER`);
      if (clientsResponse.data.success) {
        setAssignedClients(clientsResponse.data.data.users || []);
      }

      // Load filings assigned to this CA (with role-based data including invoices)
      const filingsResponse = await itrService.getUserITRs({ status: undefined });
      const filings = filingsResponse.data?.filings || filingsResponse.filings || [];
      if (filings.length > 0) {
        setFilings(filings);

        // Calculate billing stats from filings
        const stats = {
          totalRevenue: 0,
          paidRevenue: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
        };

        filings.forEach(filing => {
          if (filing.invoice) {
            const invoiceAmount = parseFloat(filing.invoice.totalAmount || filing.invoice.amount || 0);
            stats.totalRevenue += invoiceAmount;
            if (filing.invoice.paymentStatus === 'paid') {
              stats.paidRevenue += invoiceAmount;
            }
            if (filing.invoice.status === 'sent' && filing.invoice.paymentStatus === 'pending') {
              stats.pendingInvoices++;
              // Check if overdue
              if (filing.invoice.dueDate) {
                const dueDate = new Date(filing.invoice.dueDate);
                if (dueDate < new Date()) {
                  stats.overdueInvoices++;
                }
              }
            }
          }
        });

        setBillingStats(stats);
      }

      // Load service tickets
      const ticketsResponse = await apiClient.get(`/tickets?assignedTo=${user.id}&limit=10`);
      if (ticketsResponse.data.success) {
        setTickets(ticketsResponse.data.data.tickets || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFilingStatus = async (filingId, status) => {
    try {
      const response = await apiClient.put(`/itr/${filingId}/status`, { status });
      if (response.data.success) {
        toast.success('Filing status updated successfully');
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to update filing status');
    }
  };

  const handleRespondToTicket = async (ticketId, message) => {
    try {
      const response = await apiClient.post(`/tickets/${ticketId}/messages`, { message });
      if (response.data.success) {
        toast.success('Response sent successfully');
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const filteredClients = assignedClients.filter(client =>
    client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pendingFilings = filings.filter(filing =>
    ['draft', 'paused', 'in_progress', 'under_review'].includes(filing.status),
  );

  const completedFilings = filings.filter(filing =>
    ['submitted', 'acknowledged', 'processed'].includes(filing.status),
  );

  const reviewQueue = filings.filter(filing =>
    filing.reviewStatus === 'pending' || filing.reviewStatus === 'in_review',
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-elevation-1 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-heading-2 font-bold text-slate-900">CA Staff Dashboard</h1>
              <p className="text-slate-600">Manage your assigned clients and filings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-body-regular text-slate-500">
                Welcome, {user.fullName}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Assigned Clients</p>
                <p className="text-heading-2 font-bold text-slate-900">{assignedClients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Pending Filings</p>
                <p className="text-heading-2 font-bold text-slate-900">{pendingFilings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Completed</p>
                <p className="text-heading-2 font-bold text-slate-900">{completedFilings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Open Tickets</p>
                <p className="text-heading-2 font-bold text-slate-900">{tickets.filter(t => t.status === 'open').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-regular font-medium text-green-700">Total Revenue</p>
                <p className="text-heading-2 font-bold text-green-900">
                  ₹{billingStats.totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-regular font-medium text-blue-700">Paid Revenue</p>
                <p className="text-heading-2 font-bold text-blue-900">
                  ₹{billingStats.paidRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-regular font-medium text-yellow-700">Pending Invoices</p>
                <p className="text-heading-2 font-bold text-yellow-900">{billingStats.pendingInvoices}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-regular font-medium text-error-700">Overdue Invoices</p>
                <p className="text-heading-2 font-bold text-red-900">{billingStats.overdueInvoices}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-error-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'clients', label: 'Assigned Clients', icon: Users },
              { id: 'filings', label: 'Filings', icon: FileText },
              { id: 'billing', label: 'Billing', icon: IndianRupee },
              { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-heading-4 font-medium text-slate-900">Assigned Clients</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Active Filings
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const clientFilings = filings.filter(f => f.userId === client.id);
                    const activeFilings = clientFilings.filter(f =>
                      ['draft', 'in_progress', 'under_review'].includes(f.status),
                    );

                    return (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular font-medium text-slate-900">
                            {client.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-error-100 text-red-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-900">{activeFilings.length}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-4">
                            View Filings
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Message
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'filings' && (
          <div className="space-y-6">
            {/* Review Queue */}
            {reviewQueue.length > 0 && (
              <div className="bg-white rounded-xl shadow">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-heading-4 font-medium text-slate-900">Review Queue</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          ITR Type
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          Audit Status
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          Review Status
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviewQueue.map((filing) => (
                        <tr key={filing.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-body-regular font-medium text-slate-900">
                              {filing.client?.name || filing.user?.name || 'Unknown'}
                            </div>
                            {filing.client?.pan && (
                              <div className="text-body-small text-slate-500">{filing.client.pan}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-medium ${
                                filing.itrType === 'ITR-3' || filing.itrType === 'ITR3'
                                  ? 'text-blue-700 font-semibold'
                                  : 'text-slate-500'
                              }`}>
                                {filing.itrType}
                              </div>
                              {(filing.itrType === 'ITR-3' || filing.itrType === 'ITR3') && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-body-small font-medium bg-blue-100 text-blue-800">
                                  Business
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(filing.itrType === 'ITR-3' || filing.itrType === 'ITR3') ? (
                              filing.auditInfo?.isAuditApplicable ? (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-error-100 text-red-800">
                                    Audit Required
                                  </span>
                                  {filing.auditInfo?.auditReportNumber ? (
                                    <span className="text-body-small text-green-600">Report Filed</span>
                                  ) : (
                                    <span className="text-body-small text-yellow-600">Report Pending</span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-green-100 text-green-800">
                                  No Audit
                                </span>
                              )
                            ) : (
                              <span className="text-body-small text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              filing.reviewStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              filing.reviewStatus === 'in_review' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-gray-800'
                            }`}>
                              {filing.reviewStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {filing.invoice ? (
                              <InvoiceBadge invoice={filing.invoice} showNumber={false} />
                            ) : (
                              <span className="text-body-small text-slate-400">No invoice</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-4">
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Filings */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-heading-4 font-medium text-slate-900">Pending Filings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        ITR Type
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Audit Status
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingFilings.map((filing) => (
                      <tr key={filing.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular font-medium text-slate-900">
                            {filing.client?.name || filing.user?.name || 'Unknown'}
                          </div>
                          {filing.client?.pan && (
                            <div className="text-body-small text-slate-500">{filing.client.pan}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-medium ${
                              filing.itrType === 'ITR-3' || filing.itrType === 'ITR3'
                                ? 'text-blue-700 font-semibold'
                                : 'text-slate-500'
                            }`}>
                              {filing.itrType}
                            </div>
                            {(filing.itrType === 'ITR-3' || filing.itrType === 'ITR3') && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-body-small font-medium bg-blue-100 text-blue-800">
                                Business
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(filing.itrType === 'ITR-3' || filing.itrType === 'ITR3') ? (
                            filing.auditInfo?.isAuditApplicable ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-error-100 text-red-800">
                                  Audit Required
                                </span>
                                {filing.auditInfo?.auditReportNumber ? (
                                  <span className="text-body-small text-green-600">Report Filed</span>
                                ) : (
                                  <span className="text-body-small text-yellow-600">Report Pending</span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-small font-medium bg-green-100 text-green-800">
                                No Audit
                              </span>
                            )
                          ) : (
                            <span className="text-body-small text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <FilingStatusBadge filing={filing} showInvoice={false} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {filing.invoice ? (
                            <InvoiceBadge invoice={filing.invoice} showNumber={false} />
                          ) : (
                            <span className="text-body-small text-slate-400">No invoice</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-500">
                            {new Date(filing.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-4">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Completed Filings */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-heading-4 font-medium text-slate-900">Recently Completed</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        ITR Type
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {completedFilings.slice(0, 5).map((filing) => (
                      <tr key={filing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular font-medium text-slate-900">
                            {filing.user?.fullName || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-500">ITR-{filing.itrType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-500">
                            {new Date(filing.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Billing Overview */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-heading-4 font-medium text-slate-900">Billing Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Revenue Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-slate-600">Total Revenue</span>
                        <span className="text-body-large font-bold text-slate-900">
                          ₹{billingStats.totalRevenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-slate-600">Paid Revenue</span>
                        <span className="text-body-large font-bold text-green-600">
                          ₹{billingStats.paidRevenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-slate-600">Outstanding</span>
                        <span className="text-body-large font-bold text-yellow-600">
                          ₹{(billingStats.totalRevenue - billingStats.paidRevenue).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Invoice Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-slate-600">Pending Invoices</span>
                        <span className="text-body-large font-bold text-yellow-600">{billingStats.pendingInvoices}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-regular text-slate-600">Overdue Invoices</span>
                        <span className="text-body-large font-bold text-error-600">{billingStats.overdueInvoices}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Filings with Invoices */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-heading-4 font-medium text-slate-900">Client Filings & Invoices</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        ITR Type
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filings.filter(f => f.invoice).slice(0, 10).map((filing) => (
                      <tr key={filing.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular font-medium text-slate-900">
                            {filing.client?.name || filing.user?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular text-slate-500">{filing.itrType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <FilingStatusBadge filing={filing} showInvoice={false} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {filing.invoice?.invoiceNumber ? (
                            <span className="text-body-regular text-slate-900">#{filing.invoice.invoiceNumber}</span>
                          ) : (
                            <span className="text-body-small text-slate-400">No invoice</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-body-regular font-medium text-slate-900">
                            ₹{parseFloat(filing.invoice?.totalAmount || filing.invoice?.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {filing.invoice && (
                            <InvoiceBadge invoice={filing.invoice} showNumber={false} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-heading-4 font-medium text-slate-900">Support Tickets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body-regular font-medium text-slate-900">
                          #{ticket.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body-regular text-slate-500">
                          {ticket.user?.fullName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-body-regular text-slate-900">{ticket.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'open' ? 'bg-error-100 text-red-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.priority === 'high' ? 'bg-error-100 text-red-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          Respond
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CAStaffDashboard;
