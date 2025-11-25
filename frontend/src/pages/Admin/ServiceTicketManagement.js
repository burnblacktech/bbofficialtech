// =====================================================
// SERVICE TICKET MANAGEMENT - ADMIN PANEL
// Comprehensive support ticket management for platform administrators
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  MessageSquare,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Send,
  Archive,
} from 'lucide-react';

const ServiceTicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Mock ticket data
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTickets = [
        {
          id: 'ST-2024-001',
          title: 'Unable to upload Form 16 PDF',
          description: 'I am trying to upload my Form 16 PDF but it keeps showing an error message. The file size is under 10MB and it is a valid PDF.',
          status: 'open',
          priority: 'high',
          category: 'technical',
          createdAt: new Date('2024-01-20T10:30:00'),
          updatedAt: new Date('2024-01-20T14:15:00'),
          user: {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'user',
          },
          assignedTo: {
            id: 1,
            name: 'Support Agent 1',
            email: 'support1@burnblack.com',
          },
          messages: [
            {
              id: 1,
              sender: 'user',
              message: 'I am trying to upload my Form 16 PDF but it keeps showing an error message. The file size is under 10MB and it is a valid PDF.',
              timestamp: new Date('2024-01-20T10:30:00'),
            },
            {
              id: 2,
              sender: 'admin',
              message: 'Thank you for contacting us. I can see the issue you are facing. Let me help you resolve this. Can you please try clearing your browser cache and try uploading again?',
              timestamp: new Date('2024-01-20T11:00:00'),
            },
            {
              id: 3,
              sender: 'user',
              message: 'I tried clearing the cache but the issue persists. The error message says "File format not supported" but it is definitely a PDF file.',
              timestamp: new Date('2024-01-20T14:15:00'),
            },
          ],
        },
        {
          id: 'ST-2024-002',
          title: 'Question about 80C deduction limits',
          description: 'I want to know the current limits for 80C deductions and what investments are eligible.',
          status: 'in_progress',
          priority: 'medium',
          category: 'tax_advice',
          createdAt: new Date('2024-01-19T15:45:00'),
          updatedAt: new Date('2024-01-20T09:30:00'),
          user: {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'user',
          },
          assignedTo: {
            id: 2,
            name: 'Tax Expert 1',
            email: 'taxexpert1@burnblack.com',
          },
          messages: [
            {
              id: 1,
              sender: 'user',
              message: 'I want to know the current limits for 80C deductions and what investments are eligible.',
              timestamp: new Date('2024-01-19T15:45:00'),
            },
            {
              id: 2,
              sender: 'admin',
              message: 'Hello! I would be happy to help you with 80C deduction information. The current limit for Section 80C is ₹1,50,000 per financial year. Eligible investments include PPF, ELSS, NSC, LIC premiums, and more.',
              timestamp: new Date('2024-01-20T09:30:00'),
            },
          ],
        },
        {
          id: 'ST-2024-003',
          title: 'CA Firm subscription billing issue',
          description: 'Our CA firm subscription was charged twice this month. Please refund the duplicate charge.',
          status: 'resolved',
          priority: 'high',
          category: 'billing',
          createdAt: new Date('2024-01-18T12:00:00'),
          updatedAt: new Date('2024-01-19T16:30:00'),
          user: {
            id: 3,
            name: 'CA Firm Alpha',
            email: 'admin@cafirmalpha.com',
            role: 'ca_firm_admin',
          },
          assignedTo: {
            id: 3,
            name: 'Billing Support',
            email: 'billing@burnblack.com',
          },
          messages: [
            {
              id: 1,
              sender: 'user',
              message: 'Our CA firm subscription was charged twice this month. Please refund the duplicate charge.',
              timestamp: new Date('2024-01-18T12:00:00'),
            },
            {
              id: 2,
              sender: 'admin',
              message: 'I apologize for the inconvenience. I can see the duplicate charge on your account. I have processed a refund for the duplicate amount. You should see the refund in your account within 3-5 business days.',
              timestamp: new Date('2024-01-19T16:30:00'),
            },
          ],
        },
        {
          id: 'ST-2024-004',
          title: 'Expert review service not working',
          description: 'I paid for expert review but the service is not showing up in my dashboard.',
          status: 'open',
          priority: 'medium',
          category: 'service',
          createdAt: new Date('2024-01-20T08:15:00'),
          updatedAt: new Date('2024-01-20T08:15:00'),
          user: {
            id: 4,
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            role: 'user',
          },
          assignedTo: null,
          messages: [
            {
              id: 1,
              sender: 'user',
              message: 'I paid for expert review but the service is not showing up in my dashboard.',
              timestamp: new Date('2024-01-20T08:15:00'),
            },
          ],
        },
      ];

      setTickets(mockTickets);
      setLoading(false);
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-error-600 bg-error-100';
      case 'in_progress': return 'text-warning-600 bg-warning-100';
      case 'resolved': return 'text-success-600 bg-success-100';
      case 'closed': return 'text-neutral-600 bg-neutral-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error-600 bg-error-100';
      case 'medium': return 'text-warning-600 bg-warning-100';
      case 'low': return 'text-success-600 bg-success-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technical': return 'text-primary-600 bg-primary-100';
      case 'tax_advice': return 'text-secondary-600 bg-secondary-100';
      case 'billing': return 'text-warning-600 bg-warning-100';
      case 'service': return 'text-success-600 bg-success-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
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

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleTicketAction = (action, ticket) => {
    switch (action) {
      case 'view':
        setSelectedTicket(ticket);
        setShowTicketModal(true);
        break;
      case 'assign':
        // Assign ticket to admin
        console.log('Assign ticket:', ticket.id);
        break;
      case 'resolve':
        // Resolve ticket
        console.log('Resolve ticket:', ticket.id);
        break;
      case 'close':
        // Close ticket
        console.log('Close ticket:', ticket.id);
        break;
      default:
        break;
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    // Add reply to ticket
    const newMessage = {
      id: Date.now(),
      sender: 'admin',
      message: replyText,
      timestamp: new Date(),
    };

    setSelectedTicket(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      updatedAt: new Date(),
    }));

    setReplyText('');
    // API call to send reply
    console.log('Sending reply:', replyText);
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Tickets...</Typography.H1>
            <Typography.Body>Please wait while we load support tickets.</Typography.Body>
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
            <Typography.H1 className="mb-2">Service Ticket Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage and resolve customer support tickets
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              Export Tickets
            </button>
          </div>
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
                    placeholder="Search tickets by ID, title, or description..."
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
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              <span>Support Tickets ({filteredTickets.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-neutral-200 rounded-lg p-6 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Typography.Small className="font-medium text-neutral-700">
                          {ticket.id}
                        </Typography.Small>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </div>
                      <Typography.H4 className="mb-2">{ticket.title}</Typography.H4>
                      <Typography.Small className="text-neutral-600 mb-3">
                        {ticket.description}
                      </Typography.Small>
                      <div className="flex items-center space-x-4 text-sm text-neutral-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{ticket.user.name} ({ticket.user.role})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatTimeAgo(ticket.createdAt)}</span>
                        </div>
                        {ticket.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <span>Assigned to {ticket.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTicketAction('view', ticket)}
                        className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
                        title="View Ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!ticket.assignedTo && (
                        <button
                          onClick={() => handleTicketAction('assign', ticket)}
                          className="p-2 text-neutral-500 hover:text-warning-600 transition-colors"
                          title="Assign Ticket"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      )}
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleTicketAction('resolve', ticket)}
                          className="p-2 text-neutral-500 hover:text-success-600 transition-colors"
                          title="Resolve Ticket"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details Modal */}
        {showTicketModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowTicketModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Typography.H3 className="mb-2">{selectedTicket.title}</Typography.H3>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedTicket.category)}`}>
                        {selectedTicket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Ticket Information */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Ticket Information
                    </Typography.Small>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography.Small className="text-neutral-500">Ticket ID</Typography.Small>
                        <Typography.Small className="font-medium">{selectedTicket.id}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Created</Typography.Small>
                        <Typography.Small className="font-medium">{formatDate(selectedTicket.createdAt)}</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">User</Typography.Small>
                        <Typography.Small className="font-medium">{selectedTicket.user.name} ({selectedTicket.user.email})</Typography.Small>
                      </div>
                      <div>
                        <Typography.Small className="text-neutral-500">Assigned To</Typography.Small>
                        <Typography.Small className="font-medium">
                          {selectedTicket.assignedTo ? selectedTicket.assignedTo.name : 'Unassigned'}
                        </Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Conversation
                    </Typography.Small>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {selectedTicket.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-neutral-100 text-neutral-800'
                                : 'bg-primary-500 text-white'
                            }`}
                          >
                            <Typography.Small>{message.message}</Typography.Small>
                            <Typography.Small className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-neutral-500' : 'text-primary-100'
                            }`}>
                              {formatDate(message.timestamp)}
                            </Typography.Small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Section */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Reply to Ticket
                    </Typography.Small>
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={4}
                        placeholder="Type your reply here..."
                      />
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => setShowTicketModal(false)}
                          className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleSendReply}
                          disabled={!replyText.trim()}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Send Reply</span>
                        </button>
                      </div>
                    </div>
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

export default ServiceTicketManagement;
