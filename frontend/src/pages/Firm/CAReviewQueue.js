// =====================================================
// CA REVIEW QUEUE PAGE
// Displays and manages CA review queue for a firm
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Loader,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';

const CAReviewQueue = () => {
  const navigate = useNavigate();
  const { firmId } = useParams();
  const [loading, setLoading] = useState(true);
  const [queueItems, setQueueItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, in_review, completed

  useEffect(() => {
    fetchQueue();
  }, [firmId, filter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const filters = filter !== 'all' ? { status: filter.toUpperCase() } : {};
      const response = await apiClient.get(`/firms/${firmId}/review-queue`, { params: filters });
      if (response.data.success) {
        setQueueItems(response.data.data || []);
      } else {
        toast.error('Failed to load review queue.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load review queue.');
      console.error('Queue fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReviewer = async (ticketId, reviewerId) => {
    try {
      const response = await apiClient.post(`/review-queue/${ticketId}/assign`, { reviewerId });
      if (response.data.success) {
        toast.success('Reviewer assigned successfully.');
        fetchQueue();
      } else {
        toast.error('Failed to assign reviewer.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign reviewer.');
    }
  };

  const handleCompleteReview = async (ticketId, decision, comments) => {
    try {
      const response = await apiClient.post(`/review-queue/${ticketId}/complete`, {
        decision,
        comments,
      });
      if (response.data.success) {
        toast.success(`Review ${decision} successfully.`);
        fetchQueue();
      } else {
        toast.error('Failed to complete review.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete review.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700';
      case 'HIGH':
        return 'bg-gold-100 text-gold-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-5 h-5 text-gold-600" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'CLOSED':
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/firm/${firmId}/dashboard`)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">CA Review Queue</h1>
                <p className="text-xs text-gray-500">Manage review requests</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex space-x-2">
              {['all', 'pending', 'in_review', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Queue Items */}
        <div className="space-y-4">
          {queueItems.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Review Items</h3>
              <p className="text-gray-600">No items match the selected filter.</p>
            </Card>
          ) : (
            queueItems.map((ticket) => (
              <Card key={ticket.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    {ticket.filing && (
                      <div className="text-xs text-gray-500">
                        <span>ITR: {ticket.filing.itrType}</span>
                        <span className="mx-2">•</span>
                        <span>AY: {ticket.filing.assessmentYear}</span>
                      </div>
                    )}
                    {ticket.assignedTo && (
                      <p className="text-xs text-gray-500 mt-2">Assigned to: {ticket.assignedUser?.fullName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {ticket.status === 'OPEN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/firm/${firmId}/review-queue/${ticket.id}/assign`)}
                      >
                        Assign Reviewer
                      </Button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCompleteReview(ticket.id, 'approved', '')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCompleteReview(ticket.id, 'rejected', '')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CAReviewQueue;

