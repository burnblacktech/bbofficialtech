// =====================================================
// FILING HISTORY PAGE - VIEW ALL ITR FILINGS
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useITR } from '../../contexts/ITRContext';
import Card from '../../components/common/Card';
import SectionCard from '../../components/common/SectionCard';
import Button from '../../components/DesignSystem/components/Button';
import { LoadingState } from '../../components/DesignSystem';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import PauseResumeButton from '../../components/ITR/PauseResumeButton';
import { FileText, Eye, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import itrService from '../../services/api/itrService';

const FilingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ongoing', 'completed'
  const [assessmentYearFilter, setAssessmentYearFilter] = useState('all');

  const userRole = user?.role || 'END_USER';
  const isEndUser = userRole === 'END_USER';
  const isCA = ['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole);

  useEffect(() => {
    loadFilings();
  }, []);

  const loadFilings = async () => {
    try {
      setLoading(true);
      const response = await itrService.getUserITRs({ status: filter !== 'all' ? filter : undefined });
      setFilings(response.filings || []);
    } catch (error) {
      console.error('Error loading filings:', error);
      toast.error('Failed to load filing history');
    } finally {
      setLoading(false);
    }
  };

  const handlePaused = (updatedFiling) => {
    setFilings(prev => prev.map(f => f.id === updatedFiling.id ? updatedFiling : f));
    loadFilings();
  };

  const handleResumed = (updatedFiling) => {
    setFilings(prev => prev.map(f => f.id === updatedFiling.id ? updatedFiling : f));
    navigate(`/itr/computation?filingId=${updatedFiling.id}`, {
      state: { filing: updatedFiling },
    });
  };

  const ongoingStatuses = ['draft', 'paused'];
  const completedStatuses = ['submitted', 'acknowledged', 'processed', 'rejected'];

  const filteredFilings = filings.filter(filing => {
    if (activeTab === 'ongoing' && !ongoingStatuses.includes(filing.status)) return false;
    if (activeTab === 'completed' && !completedStatuses.includes(filing.status)) return false;

    const matchesFilter = filter === 'all' || filing.status === filter;
    const matchesYear = assessmentYearFilter === 'all' || filing.assessmentYear === assessmentYearFilter;
    const matchesSearch = filing.itrType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.assessmentYear?.toString().includes(searchTerm) ||
      (isCA && filing.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesYear && matchesSearch;
  });

  const handleViewFiling = (filing) => {
    navigate(`/itr/computation?filingId=${filing.id}`, {
      state: { filing, viewMode: 'readonly' },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--s29-bg-main)] flex items-center justify-center">
        <div className="text-[var(--s29-text-muted)] font-medium animate-pulse">Loading filing history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--s29-bg-main)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--s29-text-main)] mb-2">
            Filing History
          </h1>
          <p className="text-lg text-[var(--s29-text-muted)] font-medium">
            View and manage all your ITR filings
          </p>
        </div>

        {/* Filters and Search */}
        <SectionCard className="mb-8 border-none bg-white/50 backdrop-blur-sm shadow-sm">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--s29-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search filings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                  />
                </div>
              </div>

              {isEndUser && (
                <div className="flex bg-[var(--s29-bg-alt)] p-1 rounded-xl">
                  {['all', 'ongoing', 'completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                          ? 'bg-white text-[var(--s29-primary)] shadow-sm'
                          : 'text-[var(--s29-text-muted)] hover:text-[var(--s29-text-main)]'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Filings List */}
        {filteredFilings.length === 0 ? (
          <SectionCard className="py-20 text-center">
            <FileText className="w-16 h-16 text-[var(--s29-text-muted)]/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">
              No filings found
            </h3>
            <p className="text-[var(--s29-text-muted)] mb-8 max-w-md mx-auto">
              {searchTerm || filter !== 'all'
                ? 'No filings match your current filters'
                : "You haven't started any ITR filings yet. Start now to get your taxes done in minutes."}
            </p>
            <button
              onClick={() => navigate('/itr/start')}
              className="bg-[var(--s29-primary)] text-white px-8 py-3 rounded-[var(--s29-radius-main)] font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg active:scale-[0.98] inline-flex items-center gap-2"
            >
              Start New Filing <ArrowRight className="w-4 h-4" />
            </button>
          </SectionCard>
        ) : (
          <div className="space-y-4">
            {filteredFilings.map((filing) => (
              <SectionCard key={filing.id} className="p-0 overflow-hidden group hover:shadow-lg transition-all">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--s29-bg-alt)] rounded-lg text-[var(--s29-text-main)] font-bold">
                          <Calendar className="w-4 h-4 text-[var(--s29-primary)]" />
                          AY {filing.assessmentYear}
                        </div>
                        <h3 className="text-lg font-bold text-[var(--s29-text-main)]">
                          {filing.itrType}
                        </h3>
                        <FilingStatusBadge filing={filing} showInvoice={false} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm font-medium text-[var(--s29-text-muted)]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 opacity-70" />
                          <span>Created: {new Date(filing.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 opacity-70" />
                          <span>Updated: {new Date(filing.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {isCA && filing.client && (
                          <div className="flex items-center gap-2 text-[var(--s29-primary)]">
                            <User className="w-4 h-4" />
                            <span>Client: {filing.client.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[var(--s29-border-light)]">
                      <button
                        onClick={() => handleViewFiling(filing)}
                        className="px-4 py-2 bg-[var(--s29-bg-alt)] text-[var(--s29-text-main)] font-bold rounded-lg hover:bg-[var(--s29-primary)] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {isEndUser && (filing.status === 'draft' || filing.status === 'paused') && (
                        <PauseResumeButton
                          filing={filing}
                          onPaused={handlePaused}
                          onResumed={handleResumed}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilingHistory;
