// =====================================================
// ADMIN TICKET QUEUE PAGE
// Advanced ticket management with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  RefreshCw,
  CheckCircle,
  User,
  UserPlus,
  SortAsc,
  SortDesc,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import Badge from '../../components/DesignSystem/components/Badge';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminTicketQueue = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ticketTypeFilter, setTicketTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPages: 0,
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [assignData, setAssignData] = useState({ assignedTo: '', caFirmId: '' });
  const [closeData, setCloseData] = useState({ resolution: '', resolutionNotes: '' });
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [statusFilter, priorityFilter, ticketTypeFilter, pagination.offset, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.offset === 0) {
        loadTickets();
      } else {
        setPagination({ ...pagination, offset: 0 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter.toUpperCase() : undefined,
        ticketType: ticketTypeFilter !== 'all' ? ticketTypeFilter : undefined,
        search: searchTerm || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy,
        sortOrder,
      };
      const data = await adminService.getAdminTickets(params);
      setTickets(data.tickets || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminService.getTicketStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load ticket statistics:', error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket) return;
    setProcessing('assign');
    try {
      await adminService.assignTicket(selectedTicket.id, assignData);
      toast.success('Ticket assigned successfully');
      setShowAssignModal(false);
      setSelectedTicket(null);
      setAssignData({ assignedTo: '', caFirmId: '' });
      loadTickets();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setProcessing(null);
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    setProcessing('close');
    try {
      await adminService.closeTicket(selectedTicket.id, closeData);
      toast.success('Ticket closed successfully');
      setShowCloseModal(false);
      setSelectedTicket(null);
      setCloseData({ resolution: '', resolutionNotes: '' });
      loadTickets();
      loadStats();
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to close ticket');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const statusMap = {
      'OPEN': 'danger',
      'IN_PROGRESS': 'warning',
      'PENDING_USER': 'warning',
      'PENDING_CA': 'warning',
      'RESOLVED': 'success',
      'CLOSED': 'secondary',
      'ESCALATED': 'danger',
    };
    return statusMap[status] || 'secondary';
  };

  const getPriorityBadgeVariant = (priority) => {
    const priorityMap = {
      'LOW': 'success',
      'MEDIUM': 'warning',
      'HIGH': 'danger',
      'URGENT': 'danger',
      'CRITICAL': 'danger',
    };
    return priorityMap[priority] || 'secondary';
  };

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Ticket Queue</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage and resolve support tickets
            </Typography.Body>
          </div>
          <Button variant="outline" onClick={() => { loadTickets(); loadStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StaggerItem>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Total Tickets</Typography.Small>
                      <Typography.H3>{stats.total || 0}</Typography.H3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-warning-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Open Tickets</Typography.Small>
                      <Typography.H3>{stats.open || 0}</Typography.H3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Closed Tickets</Typography.Small>
                      <Typography.H3>{stats.closed || 0}</Typography.H3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-error-600" />
                    </div>
                    <div className="ml-3">
                      <Typography.Small className="text-neutral-500">Unassigned</Typography.Small>
                      <Typography.H3>{stats.unassigned || 0}</Typography.H3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_USER">Pending User</option>
                <option value="PENDING_CA">Pending CA</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <select
                value={ticketTypeFilter}
                onChange={(e) => {
                  setTicketTypeFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="FILING_SUPPORT">Filing Support</option>
                <option value="DOCUMENT_REVIEW">Document Review</option>
                <option value="TAX_QUERY">Tax Query</option>
                <option value="TECHNICAL_ISSUE">Technical Issue</option>
                <option value="PAYMENT_ISSUE">Payment Issue</option>
                <option value="REFUND_REQUEST">Refund Request</option>
                <option value="GENERAL_INQUIRY">General Inquiry</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setTicketTypeFilter('all');
                  setPagination({ ...pagination, offset: 0 });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No tickets found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  No tickets match your current filters.
                </Typography.Body>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('ticketNumber')}
                            className="flex items-center space-x-1 hover:text-neutral-700"
                          >
                            <span>Ticket</span>
                            {sortBy === 'ticketNumber' && (
                              sortOrder === 'ASC' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-body-small font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Small className="font-mono font-medium">{ticket.ticketNumber}</Typography.Small>
                          </td>
                          <td className="px-6 py-4">
                            <Typography.Body className="font-medium">{ticket.subject}</Typography.Body>
                            <Typography.Small className="text-neutral-500">{ticket.ticketType}</Typography.Small>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Small>{ticket.user?.name || ticket.user?.email || 'N/A'}</Typography.Small>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Small>{ticket.assignedUser?.name || ticket.firm?.firmName || 'Unassigned'}</Typography.Small>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography.Small className="text-neutral-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </Typography.Small>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {!ticket.assignedTo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowAssignModal(true);
                                  }}
                                  disabled={processing === ticket.id}
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              )}
                              {ticket.status !== 'CLOSED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowCloseModal(true);
                                  }}
                                  disabled={processing === ticket.id}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Assign Modal */}
        {showAssignModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assign Ticket</CardTitle>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTicket(null);
                    setAssignData({ assignedTo: '', caFirmId: '' });
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Assign to User (User ID)
                  </label>
                  <input
                    type="text"
                    value={assignData.assignedTo}
                    onChange={(e) => setAssignData({ ...assignData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Assign to CA Firm (Firm ID)
                  </label>
                  <input
                    type="text"
                    value={assignData.caFirmId}
                    onChange={(e) => setAssignData({ ...assignData, caFirmId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter CA firm ID"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedTicket(null);
                      setAssignData({ assignedTo: '', caFirmId: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={processing === 'assign' || (!assignData.assignedTo && !assignData.caFirmId)}
                  >
                    {processing === 'assign' ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Close Modal */}
        {showCloseModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Close Ticket</CardTitle>
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setSelectedTicket(null);
                    setCloseData({ resolution: '', resolutionNotes: '' });
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Resolution
                  </label>
                  <select
                    value={closeData.resolution}
                    onChange={(e) => setCloseData({ ...closeData, resolution: e.target.value })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select resolution</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DUPLICATE">Duplicate</option>
                    <option value="NOT_AN_ISSUE">Not an Issue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={closeData.resolutionNotes}
                    onChange={(e) => setCloseData({ ...closeData, resolutionNotes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Add notes about the resolution..."
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCloseModal(false);
                      setSelectedTicket(null);
                      setCloseData({ resolution: '', resolutionNotes: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleClose}
                    disabled={processing === 'close' || !closeData.resolution}
                  >
                    {processing === 'close' ? 'Closing...' : 'Close Ticket'}
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

export default AdminTicketQueue;
