// Service Ticket Management System
// Handles automatic ticket creation, CA assignment, and status tracking
// Visible to users, CAs, and admins based on filing type

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';
import {
  Ticket,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Send,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const ServiceTicketManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - will be replaced with API calls
  const mockTickets = [
    {
      id: '1',
      ticketNumber: 'TK-2024-001',
      title: 'ITR Filing Support - ITR-1',
      description: 'Need assistance with salary income entry and Form-16 processing',
      status: 'open',
      priority: 'medium',
      ticketType: 'filing_support',
      filingId: 'FIL-001',
      userId: 'user-1',
      caId: null,
      tenantId: 'tenant-1',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      resolvedAt: null,
      createdBy: 'user-1',
      comments: [
        {
          id: '1',
          ticketId: '1',
          userId: 'user-1',
          comment: 'Started ITR filing process, need help with income calculations',
          isInternal: false,
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
    {
      id: '2',
      ticketNumber: 'TK-2024-002',
      title: 'CA Assisted Filing - ITR-2',
      description: 'Complex filing with multiple income sources and capital gains',
      status: 'in_progress',
      priority: 'high',
      ticketType: 'ca_assistance',
      filingId: 'FIL-002',
      userId: 'user-2',
      caId: 'ca-1',
      tenantId: 'tenant-1',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      resolvedAt: null,
      createdBy: 'user-2',
      comments: [
        {
          id: '2',
          ticketId: '2',
          userId: 'user-2',
          comment: 'Submitted all documents, waiting for CA review',
          isInternal: false,
          createdAt: '2024-01-14T14:20:00Z',
        },
        {
          id: '3',
          ticketId: '2',
          userId: 'ca-1',
          comment: 'Reviewing documents, will complete by tomorrow',
          isInternal: false,
          createdAt: '2024-01-15T09:15:00Z',
        },
      ],
    },
    {
      id: '3',
      ticketNumber: 'TK-2024-003',
      title: 'Document Verification Issue',
      description: 'Form-16 mismatch with AIS data, need clarification',
      status: 'resolved',
      priority: 'low',
      ticketType: 'document_issue',
      filingId: 'FIL-003',
      userId: 'user-3',
      caId: 'ca-1',
      tenantId: 'tenant-1',
      createdAt: '2024-01-13T16:45:00Z',
      updatedAt: '2024-01-14T11:30:00Z',
      resolvedAt: '2024-01-14T11:30:00Z',
      createdBy: 'user-3',
      comments: [
        {
          id: '4',
          ticketId: '3',
          userId: 'user-3',
          comment: 'Form-16 shows different amount than AIS',
          isInternal: false,
          createdAt: '2024-01-13T16:45:00Z',
        },
        {
          id: '5',
          ticketId: '3',
          userId: 'ca-1',
          comment: 'Issue resolved, using AIS data as per ITD guidelines',
          isInternal: false,
          createdAt: '2024-01-14T11:30:00Z',
        },
      ],
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-slate-100 text-gray-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Ticket className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

    // Role-based filtering
    let matchesRole = true;
    if (user.role === 'user') {
      matchesRole = ticket.userId === user.user_id;
    } else if (user.role === 'CA') {
      matchesRole = ticket.caId === user.user_id || ticket.tenantId === user.tenant_id;
    }
    // super_admin and ca_firm_admin can see all tickets

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTicket) return;

    const comment = {
      id: Date.now().toString(),
      ticketId: selectedTicket.id,
      userId: user.user_id,
      comment: newComment,
      isInternal: false,
      createdAt: new Date().toISOString(),
    };

    setTickets(tickets.map(ticket =>
      ticket.id === selectedTicket.id
        ? { ...ticket, comments: [...ticket.comments, comment], updatedAt: new Date().toISOString() }
        : ticket,
    ));

    setSelectedTicket({
      ...selectedTicket,
      comments: [...selectedTicket.comments, comment],
      updatedAt: new Date().toISOString(),
    });

    setNewComment('');
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Ticket className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading service tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-heading-1 font-bold text-slate-900">Service Tickets</h1>
          <p className="text-slate-600 mt-1">
            Manage and track ITR filing support requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Total Tickets</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {tickets.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Open</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Resolved</p>
                <p className="text-heading-2 font-bold text-slate-900">
                  {tickets.filter(t => t.status === 'resolved').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-regular font-medium text-slate-600">Avg Response</p>
                <p className="text-heading-2 font-bold text-slate-900">2.5h</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </button>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 overflow-hidden">
        {
          filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-medium text-slate-900 mb-2">No tickets found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No service tickets available'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-body-small font-medium text-slate-500 uppercase tracking-wider">
                      Type
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
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="p-2 bg-blue-100 rounded-xl">
                            <Ticket className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-body-regular font-medium text-slate-900">{ticket.title}</div>
                            <div className="text-body-regular text-slate-500">{ticket.ticketNumber}</div>
                            <div className="text-body-small text-slate-400 mt-1 line-clamp-2">
                              {ticket.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                        {ticket.ticketType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body-regular text-slate-900">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-body-regular font-medium">
                        <button
                          onClick={() => handleTicketClick(ticket)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* Ticket Details Modal */}
      {
        showTicketDetails && selectedTicket && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-elevation-3 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-4 font-semibold text-slate-900">
                  {selectedTicket.title}
                </h3>
                <button
                  onClick={() => setShowTicketDetails(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-slate-700">Ticket Number</label>
                    <p className="text-body-regular text-slate-900">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-slate-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="ml-1 capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700">Description</label>
                  <p className="text-body-regular text-slate-900">{selectedTicket.description}</p>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">Comments</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-body-regular font-medium text-slate-900">
                            {comment.userId === user.user_id ? 'You' : 'Support'}
                          </span>
                          <span className="text-body-small text-slate-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-body-regular text-slate-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Comment */}
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">Add Comment</label>
                  <div className="flex space-x-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default ServiceTicketManagement;
