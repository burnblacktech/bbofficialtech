// =====================================================
// CLIENT LIST PAGE
// Displays list of clients for a firm with assignment status
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  CheckCircle,
  XCircle,
  Edit,
  Loader,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/DesignSystem/components/Button';
import ClientAssignmentModal from '../../components/Firm/ClientAssignmentModal';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';
import { enterpriseLogger } from '../../utils/logger';

const ClientList = () => {
  const navigate = useNavigate();
  const { firmId } = useParams();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [firmId]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/firms/${firmId}/clients`);
      if (response.data.success) {
        setClients(response.data.data || []);
      } else {
        toast.error('Failed to load clients.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load clients.');
      enterpriseLogger.error('Client list fetch error:', { error });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((item) => {
    const client = item.client || item;
    const name = `${client.name || ''} ${client.panNumber || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
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
                <h1 className="text-heading-4 font-semibold text-slate-900">Clients</h1>
                <p className="text-body-small text-slate-500">Manage your firm's clients</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/firm/${firmId}/clients/new`)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name or PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Client List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card className="p-12 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No Clients Found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery ? 'No clients match your search.' : 'Get started by adding your first client.'}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/firm/${firmId}/clients/new`)}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Client</span>
                </Button>
              )}
            </Card>
          ) : (
            filteredClients.map((item) => {
              const client = item.client || item;
              const assignments = item.assignments || [];
              const hasPreparer = item.hasPreparer || assignments.some((a) => a.role === 'preparer');
              const hasReviewer = item.hasReviewer || assignments.some((a) => a.role === 'reviewer');

              return (
                <Card key={client.id} className="p-6 hover:shadow-elevation-2 transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="w-5 h-5 text-slate-600" />
                        <h3 className="text-heading-4 font-semibold text-slate-900">
                          {client.name || `${client.firstName} ${client.lastName}`}
                        </h3>
                        {client.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <p className="text-body-regular text-slate-600 mb-2">PAN: {client.panNumber}</p>
                      <div className="flex items-center space-x-4 text-body-small text-slate-500">
                        <span className={`px-2 py-1 rounded ${hasPreparer ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {hasPreparer ? 'Has Preparer' : 'No Preparer'}
                        </span>
                        <span className={`px-2 py-1 rounded ${hasReviewer ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {hasReviewer ? 'Has Reviewer' : 'No Reviewer'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client.id);
                          setShowAssignmentModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <ClientAssignmentModal
            isOpen={showAssignmentModal}
            onClose={() => {
              setShowAssignmentModal(false);
              setSelectedClient(null);
            }}
            clientId={selectedClient}
            firmId={firmId}
            onAssignmentComplete={() => {
              fetchClients();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default ClientList;

