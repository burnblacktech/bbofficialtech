// =====================================================
// FILING HISTORY PAGE - VIEW ALL ITR FILINGS
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useITR } from '../../contexts/ITRContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { FileText, Eye, Download, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const FilingHistory = () => {
  const { user } = useAuth();
  const { getUserFilings } = useITR();
  const navigate = useNavigate();
  
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFilings();
  }, []);

  const loadFilings = async () => {
    try {
      setLoading(true);
      const response = await getUserFilings();
      setFilings(response.data || []);
    } catch (error) {
      console.error('Error loading filings:', error);
      toast.error('Failed to load filing history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'success';
      case 'draft':
        return 'warning';
      case 'processing':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const filteredFilings = filings.filter(filing => {
    const matchesFilter = filter === 'all' || filing.status === filter;
    const matchesSearch = filing.itrType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         filing.assessmentYear?.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const handleViewFiling = (filing) => {
    navigate(`/filing/details/${filing.id}`);
  };

  const handleDownloadAcknowledgment = (filing) => {
    // TODO: Implement download functionality
    toast.success('Download started');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading filing history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Filing History
          </h1>
          <p className="text-neutral-600">
            View and manage all your ITR filings
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by ITR type or assessment year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Filter */}
              <div className="flex gap-2">
                {['all', 'draft', 'submitted', 'processing', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'primary' : 'secondary'}
                    onClick={() => setFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Filings List */}
        {filteredFilings.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No filings found
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'No filings match your current filters'
                  : 'You haven\'t filed any ITR yet'
                }
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/itr/start')}
              >
                Start New Filing
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFilings.map((filing) => (
              <Card key={filing.id}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filing Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {filing.itrType} - AY {filing.assessmentYear}
                        </h3>
                        <StatusBadge 
                          status={filing.status} 
                          variant={getStatusColor(filing.status)}
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Filed: {new Date(filing.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {filing.familyMember && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>For: {filing.familyMember.firstName} {filing.familyMember.lastName}</span>
                          </div>
                        )}
                        
                        {filing.acknowledgmentNumber && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>Ack: {filing.acknowledgmentNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleViewFiling(filing)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      
                      {filing.status === 'submitted' && filing.acknowledgmentNumber && (
                        <Button
                          variant="secondary"
                          onClick={() => handleDownloadAcknowledgment(filing)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilingHistory;