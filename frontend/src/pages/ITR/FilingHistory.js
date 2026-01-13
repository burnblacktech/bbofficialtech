import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Eye,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SectionCard from '../../components/common/SectionCard';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import PauseResumeButton from '../../components/ITR/PauseResumeButton';
import itrService from '../../services/api/itrService';
import { motion, AnimatePresence } from 'framer-motion';

const FilingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [assessmentYearFilter, setAssessmentYearFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(null); // filingId to delete
  const [isDeleting, setIsDeleting] = useState(false);

  const userRole = user?.role || 'END_USER';
  const isCA = ['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole);

  useEffect(() => {
    loadFilings();
  }, []);

  const loadFilings = async () => {
    try {
      setLoading(true);
      const response = await itrService.getUserITRs();
      setFilings(response.filings || response.data?.filings || []);
    } catch (error) {
      console.error('Error loading filings:', error);
      toast.error('Failed to load filing history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFiling = async () => {
    if (!showDeleteModal) return;

    setIsDeleting(true);
    try {
      await itrService.deleteITR(showDeleteModal);
      setFilings(prev => prev.filter(f => f.id !== showDeleteModal));
      toast.success('Filing deleted successfully');
      setShowDeleteModal(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete filing');
    } finally {
      setIsDeleting(false);
    }
  };

  const ongoingStatuses = ['draft', 'paused'];
  const completedStatuses = ['submitted', 'acknowledged', 'processed', 'rejected'];

  const filteredFilings = filings.filter(filing => {
    if (activeTab === 'ongoing' && !ongoingStatuses.includes(filing.status)) return false;
    if (activeTab === 'completed' && !completedStatuses.includes(filing.status)) return false;

    const matchesYear = assessmentYearFilter === 'all' || filing.assessmentYear === assessmentYearFilter;
    const matchesSearch =
      filing.itrType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.assessmentYear?.toString().includes(searchTerm) ||
      filing.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isCA && filing.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesYear && matchesSearch;
  });

  const stats = {
    total: filings.length,
    ongoing: filings.filter(f => ongoingStatuses.includes(f.status)).length,
    completed: filings.filter(f => completedStatuses.includes(f.status)).length,
  };

  const availableYears = [...new Set(filings.map(f => f.assessmentYear))].sort().reverse();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--s29-bg-main)] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-[var(--s29-primary)] animate-spin mb-4" />
        <div className="text-[var(--s29-text-muted)] font-medium">Securing your financial history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--s29-bg-main)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 mb-4 text-sm text-[var(--s29-text-muted)] font-medium">
                <span className="hover:text-[var(--s29-primary)] cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
                <span>/</span>
                <span className="text-[var(--s29-text-main)]">My Filings</span>
              </nav>
              <h1 className="text-4xl font-extrabold text-[var(--s29-text-main)] tracking-tight mb-3">
                My Filing Vault
              </h1>
              <p className="text-lg text-[var(--s29-text-muted)] font-medium max-w-2xl leading-relaxed">
                Access every ITR from your financial journey. Manage drafts, view processed returns, and stay compliant effortlessly.
              </p>
            </div>
            <button
              onClick={() => navigate('/itr/start')}
              className="bg-[var(--s29-primary)] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-glow-gold active:scale-[0.98] flex items-center gap-2 h-fit"
            >
              Start New Filing <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Stats Pulse */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Filings', value: stats.total, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Ongoing', value: stats.ongoing, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-8 -mt-8 opacity-50 transition-all duration-500 group-hover:scale-125`} />
              <stat.icon className={`w-10 h-10 ${stat.color} mb-4 relative z-10`} />
              <div className="relative z-10">
                <span className="block text-4xl font-black text-slate-900 mb-1">{stat.value}</span>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-4 sm:p-6 border border-slate-200/50 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by ITR type, year, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--s29-primary)]/10 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
              {['all', 'ongoing', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab
                    ? 'bg-white text-[var(--s29-primary)] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={assessmentYearFilter}
                onChange={(e) => setAssessmentYearFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-[var(--s29-primary)]/10"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>AY {year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List Content */}
        <AnimatePresence mode="popLayout">
          {filteredFilings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] py-24 text-center border border-slate-100 shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                {searchTerm || assessmentYearFilter !== 'all' ? 'No matches found' : 'Your vault is empty'}
              </h3>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                {searchTerm || assessmentYearFilter !== 'all'
                  ? 'Try broadening your search or adjusting the filters to find the filing you’re looking for.'
                  : "You haven't started any ITR filings yet. Begin your financial record-keeping today."}
              </p>
              {!searchTerm && assessmentYearFilter === 'all' && (
                <button
                  onClick={() => navigate('/itr/start')}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] inline-flex items-center gap-2"
                >
                  Start First Filing <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredFilings.map((filing, index) => (
                <motion.div
                  key={filing.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-[2rem] border border-slate-100 p-2 hover:border-[var(--s29-primary)]/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all"
                >
                  <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Visual Marker */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${ongoingStatuses.includes(filing.status) ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                      {ongoingStatuses.includes(filing.status) ? <Clock className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest">
                          AY {filing.assessmentYear}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 truncate">
                          {filing.itrType || 'Income Tax Return'}
                        </h3>
                        <FilingStatusBadge filing={filing} showInvoice={false} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Started {new Date(filing.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Updated {new Date(filing.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {isCA && filing.user && (
                          <div className="flex items-center gap-1.5 text-[var(--s29-primary)]">
                            <User className="w-4 h-4" />
                            <span className="truncate">Client: {filing.user.fullName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => navigate(`/filing/${filing.id}/overview`)}
                        className="px-5 py-2.5 bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>

                      {ongoingStatuses.includes(filing.status) && (
                        <>
                          <PauseResumeButton
                            filing={filing}
                            onPaused={(updated) => setFilings(prev => prev.map(f => f.id === updated.id ? updated : f))}
                            onResumed={(updated) => navigate(`/filing/${updated.id}/overview`)}
                            className="!shadow-none"
                          />
                          <button
                            onClick={() => setShowDeleteModal(filing.id)}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteModal(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-12 -mt-12 opacity-50" />
                <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 underline decoration-red-200 underline-offset-8">
                  Burn this filing?
                </h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed relative z-10">
                  You are about to permanently delete this ITR draft. All uploaded documents and progress will be lost forever. This action is irreversible.
                </p>
                <div className="flex gap-4 relative z-10">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    Keep it
                  </button>
                  <button
                    onClick={handleDeleteFiling}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilingHistory;
