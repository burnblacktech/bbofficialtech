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
import Button from '../../components/DesignSystem/components/Button';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';
import { enterpriseLogger } from '../../utils/logger';
import { ReviewPage } from '../../components/templates';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
      enterpriseLogger.error('Queue fetch error:', { error });
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
        return 'bg-error-100 text-error-700';
      case 'HIGH':
        return 'bg-gold-100 text-gold-700';
      case 'MEDIUM':
        return 'bg-warning-100 text-warning-700';
      case 'LOW':
        return 'bg-info-100 text-info-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-5 h-5 text-gold-600" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="w-5 h-5 text-info-600" />;
      case 'CLOSED':
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-elevation-1 border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/firm/${firmId}/dashboard`)}
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-slate-900">CA Review Queue</h1>
                <p className="text-body-small text-slate-500">Manage review requests</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <div className="flex space-x-2">
              {['all', 'pending', 'in_review', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No Review Items</h3>
              <p className="text-slate-600">No items match the selected filter.</p>
            </Card>
          ) : (
            queueItems.map((ticket) => (
              <Card key={ticket.id} className="p-6">
                <div className="flex items-start justify-between">
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
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CAReviewQueue;

