// =====================================================
// MOBILE-FIRST DOCUMENTS PAGE
// Touch-friendly document management for all devices
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Image,
  File,
  Search,
  Filter,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Settings,
} from 'lucide-react';
import api from '../../services/api';

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/documents/user-documents');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const documents = documentsData?.documents || [];

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', user?.user_id]);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', user?.user_id]);
    },
  });

  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Reset progress and errors
    setUploadProgress({});
    setUploadErrors({});

    // Upload files individually to track progress
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${file.name}-${Date.now()}-${i}`;

      setUploadProgress(prev => ({ ...prev, [fileId]: { file: file.name, progress: 0, status: 'uploading' } }));

      const formData = new FormData();
      formData.append('file', file);

      // Determine category based on file name or let user select
      // For now, auto-detect from filename
      let category = 'OTHER';
      const fileName = file.name.toLowerCase();
      if (fileName.includes('form16') || fileName.includes('form_16')) {
        category = fileName.includes('part_a') || fileName.includes('parta') ? 'FORM_16_PART_A' :
                   fileName.includes('part_b') || fileName.includes('partb') ? 'FORM_16_PART_B' : 'FORM_16';
      } else if (fileName.includes('ais') || fileName.includes('annual information')) {
        category = 'AIS';
      } else if (fileName.includes('26as') || fileName.includes('26_as')) {
        category = 'FORM_26AS';
      } else if (fileName.includes('bank') || fileName.includes('statement')) {
        category = 'BANK_STATEMENT';
      } else if (fileName.includes('rent') || fileName.includes('receipt')) {
        category = 'RENT_RECEIPT';
      } else if (fileName.includes('investment') || fileName.includes('80c') || fileName.includes('80d')) {
        category = 'INVESTMENT_PROOF';
      } else if (fileName.includes('broker') || fileName.includes('zerodha') || fileName.includes('groww') || fileName.includes('upstox')) {
        category = 'BROKER_STATEMENT';
      } else if (fileName.includes('salary') || fileName.includes('payslip')) {
        category = 'SALARY_SLIP';
      }

      formData.append('category', category);

      try {
        // Simulate progress (in real implementation, use XMLHttpRequest for progress tracking)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId]?.progress || 0;
            if (current < 90) {
              return { ...prev, [fileId]: { ...prev[fileId], progress: current + 10 } };
            }
            return prev;
          });
        }, 200);

        await uploadDocumentMutation.mutateAsync(formData);

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress: 100, status: 'completed' } }));
        toast.success(`${file.name} uploaded successfully`);

        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);
      } catch (error) {
        setUploadProgress(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'error' } }));
        setUploadErrors(prev => ({ ...prev, [fileId]: error.message || 'Upload failed' }));
        toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteDocument = (documentId) => {
    setDocumentToDelete(documentId);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDocumentToDelete(null);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-info-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-error-600" />;
    } else {
      return <File className="h-4 w-4 text-slate-600" />;
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case 'date':
      default:
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Group documents by category
  const groupedDocuments = sortedDocuments.reduce((groups, doc) => {
    const category = doc.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(doc);
    return groups;
  }, {});

  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-body-regular text-neutral-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burnblack-white">
      {/* Mobile Header */}
      <header className="header-burnblack sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-burnblack-black">Documents</h1>
                <p className="text-body-small text-neutral-500">{sortedDocuments.length} files</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                {viewMode === 'list' ? <Grid className="h-5 w-5 text-burnblack-black" /> : <List className="h-5 w-5 text-burnblack-black" />}
              </button>
              <label className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform cursor-pointer">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center space-x-2 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-body-regular font-medium text-slate-900">Filters</span>
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center space-x-2 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 text-slate-600" /> : <SortDesc className="h-4 w-4 text-slate-600" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              {/* Type Filter */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-2 block">File Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-2 block">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="FORM_16">Form 16</option>
                  <option value="FORM_16_PART_A">Form 16 Part A</option>
                  <option value="FORM_16_PART_B">Form 16 Part B</option>
                  <option value="AIS">AIS (Annual Information Statement)</option>
                  <option value="FORM_26AS">Form 26AS</option>
                  <option value="BANK_STATEMENT">Bank Statement</option>
                  <option value="RENT_RECEIPT">Rent Receipt</option>
                  <option value="INVESTMENT_PROOF">Investment Proof (80C, 80D, etc.)</option>
                  <option value="BROKER_STATEMENT">Broker Statement</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {sortedDocuments.length === 0 ? (
            <div className="dashboard-card-burnblack p-8 text-center">
              <Folder className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-burnblack-black mb-2">No documents</h3>
              <p className="text-body-regular text-neutral-500 mb-4">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                  ? 'No documents match your filters'
                  : 'Upload your first document to get started'}
              </p>
              <label className="btn-burnblack px-4 py-2 rounded-xl active:scale-95 transition-transform cursor-pointer">
                <Plus className="h-4 w-4 inline mr-2" />
                Upload Document
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
              </label>
            </div>
          ) : (
            Object.entries(groupedDocuments).map(([category, docs]) => (
              <div key={category} className="dashboard-card-burnblack">
                {/* Category Header */}
                <button
                  onClick={() => toggleFolder(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:scale-95 transition-transform"
                >
                  <div className="flex items-center space-x-3">
                    {expandedFolders.has(category) ? (
                      <FolderOpen className="h-5 w-5 text-gold-500" />
                    ) : (
                      <Folder className="h-5 w-5 text-slate-600" />
                    )}
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
                      <p className="text-body-small text-slate-500">{docs.length} files</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${
                    expandedFolders.has(category) ? 'rotate-90' : ''
                  }`} />
                </button>

                {/* Documents in Category */}
                {expandedFolders.has(category) && (
                  <div className="px-4 pb-4 space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(doc.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-body-regular font-medium text-slate-900 truncate">{doc.name}</p>
                            <div className="flex items-center space-x-3 text-body-small text-slate-500">
                              <span>{getFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              if (doc.extractedData) {
                                // Show extracted data preview modal
                                toast.info('Extracted data preview coming soon');
                              } else {
                                window.open(doc.url, '_blank');
                              }
                            }}
                            className="p-1 rounded hover:bg-info-50 active:scale-95 transition-transform"
                            title={doc.extractedData ? 'View extracted data' : 'View'}
                          >
                            <Eye className="h-4 w-4 text-info-500" />
                          </button>
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1 rounded hover:bg-success-50 active:scale-95 transition-transform"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-success-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 rounded hover:bg-error-100 active:scale-95 transition-transform"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-error-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-body-small">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gold-600">
            <Folder className="h-5 w-5 mb-1" />
            <span className="text-body-small font-medium">Documents</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-gold-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-body-small">Settings</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-elevation-4 max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-error-600 mr-3" />
              <h3 className="text-heading-4 font-semibold text-slate-900">Delete Document</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
