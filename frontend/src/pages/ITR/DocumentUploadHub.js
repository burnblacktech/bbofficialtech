// =====================================================
// DOCUMENT UPLOAD HUB PAGE
// Unified document upload with auto-categorization
// =====================================================

import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  FileSpreadsheet,
  Image,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Eye,
  RefreshCw,
  Sparkles,
  Users,
  Building,
  Home,
  TrendingUp,
  CreditCard,
  Shield,
  Briefcase,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs, variants } from '../../lib/motion';
import toast from 'react-hot-toast';

// Document categories with their icons and detection patterns
const DOCUMENT_CATEGORIES = [
  {
    id: 'form16',
    label: 'Form 16',
    description: 'TDS certificate from employer',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    patterns: ['form16', 'form 16', 'tds certificate', 'part a', 'part b', 'salary'],
    extractsTo: ['salary', 'tds'],
  },
  {
    id: 'form26as',
    label: 'Form 26AS',
    description: 'Tax credit statement',
    icon: FileSpreadsheet,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    patterns: ['26as', '26 as', 'tax credit', 'annual tax statement'],
    extractsTo: ['tds', 'advanceTax', 'selfAssessmentTax'],
  },
  {
    id: 'ais',
    label: 'AIS (Annual Information Statement)',
    description: 'Comprehensive financial information',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    patterns: ['ais', 'annual information statement', 'sft'],
    extractsTo: ['salary', 'interest', 'dividend', 'capitalGains'],
  },
  {
    id: 'bankStatement',
    label: 'Bank Statement',
    description: 'Interest income and transactions',
    icon: Building,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    patterns: ['bank statement', 'account statement', 'passbook'],
    extractsTo: ['interest', 'transactions'],
  },
  {
    id: 'rentReceipt',
    label: 'Rent Receipt',
    description: 'HRA claim documents',
    icon: Home,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    patterns: ['rent receipt', 'house rent', 'landlord'],
    extractsTo: ['hra', 'rentPaid'],
  },
  {
    id: 'capitalGains',
    label: 'Capital Gains Statement',
    description: 'Broker statement, MF statement',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    patterns: ['cg statement', 'capital gain', 'broker', 'contract note', 'mutual fund'],
    extractsTo: ['capitalGains'],
  },
  {
    id: 'investmentProof',
    label: 'Investment Proofs',
    description: '80C, 80D, insurance, etc.',
    icon: CreditCard,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    patterns: ['lic', 'insurance', 'ppf', 'elss', 'mediclaim', '80c', '80d'],
    extractsTo: ['deductions'],
  },
  {
    id: 'other',
    label: 'Other Document',
    description: 'Any other tax-related document',
    icon: FileText,
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    patterns: [],
    extractsTo: [],
  },
];

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': { ext: 'pdf', icon: FileText },
  'image/jpeg': { ext: 'jpg', icon: Image },
  'image/png': { ext: 'png', icon: Image },
  'application/vnd.ms-excel': { ext: 'xls', icon: FileSpreadsheet },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', icon: FileSpreadsheet },
};

const DocumentUploadHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPerson = location.state?.selectedPerson;
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Auto-detect document category based on filename
  const detectCategory = useCallback((filename) => {
    const lowerName = filename.toLowerCase();

    for (const category of DOCUMENT_CATEGORIES) {
      for (const pattern of category.patterns) {
        if (lowerName.includes(pattern)) {
          return category;
        }
      }
    }

    return DOCUMENT_CATEGORIES.find((c) => c.id === 'other');
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const isValid = Object.keys(SUPPORTED_TYPES).includes(file.type);
      if (!isValid) {
        toast.error(`${file.name} is not a supported file type`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Process each file
    const newDocs = await Promise.all(
      validFiles.map(async (file) => {
        const category = detectCategory(file.name);
        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

        return {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          category: category.id,
          categoryLabel: category.label,
          status: 'uploaded', // 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error'
          confidence: Math.round(70 + Math.random() * 25), // Detection confidence
          extractedData: null,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        };
      }),
    );

    setDocuments((prev) => [...prev, ...newDocs]);
    setIsUploading(false);

    toast.success(`${newDocs.length} document${newDocs.length > 1 ? 's' : ''} uploaded`);
  }, [detectCategory]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Handle file input change
  const handleFileInput = useCallback((e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Change document category
  const handleCategoryChange = useCallback((docId, categoryId) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          const category = DOCUMENT_CATEGORIES.find((c) => c.id === categoryId);
          return {
            ...doc,
            category: categoryId,
            categoryLabel: category?.label || 'Unknown',
            confidence: 100, // Manual selection = 100% confidence
          };
        }
        return doc;
      }),
    );
  }, []);

  // Remove document
  const handleRemoveDoc = useCallback((docId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  }, []);

  // Process documents (extract data)
  const handleProcessDocuments = useCallback(async () => {
    if (documents.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsUploading(true);

    // Simulate processing
    for (let i = 0; i < documents.length; i++) {
      setDocuments((prev) =>
        prev.map((doc, idx) =>
          idx === i ? { ...doc, status: 'processing' } : doc,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

      setDocuments((prev) =>
        prev.map((doc, idx) =>
          idx === i
            ? {
                ...doc,
                status: 'processed',
                extractedData: {
                  // Simulated extracted data
                  fields: Math.round(5 + Math.random() * 10),
                  accuracy: Math.round(85 + Math.random() * 15),
                },
              }
            : doc,
        ),
      );
    }

    setIsUploading(false);
    toast.success('All documents processed successfully!');
  }, [documents]);

  // Proceed to filing
  const handleProceed = useCallback(() => {
    navigate('/itr/computation', {
      state: {
        selectedPerson,
        documents: documents.map((doc) => ({
          id: doc.id,
          category: doc.category,
          name: doc.name,
          extractedData: doc.extractedData,
        })),
        dataSource: 'documents',
      },
    });
  }, [navigate, selectedPerson, documents]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const processedCount = documents.filter((d) => d.status === 'processed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Document Upload Hub</h1>
              <p className="text-sm text-slate-500">Upload and analyze your tax documents</p>
            </div>
          </div>
          {selectedPerson && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">{selectedPerson.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer',
              'p-8 flex flex-col items-center justify-center text-center',
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 hover:border-primary-400 hover:bg-primary-50/50',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {isDragging ? 'Drop files here' : 'Upload Your Documents'}
            </h2>
            <p className="text-slate-500 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Supported: PDF, JPG, PNG, XLS, XLSX • Max 10MB per file
            </p>

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Loader className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Uploaded Documents */}
        <AnimatePresence>
          {documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Uploaded Documents ({documents.length})
                </h3>
                {processedCount < documents.length && (
                  <button
                    onClick={handleProcessDocuments}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Process All ({documents.length - processedCount} pending)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, index) => {
                  const category = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category);
                  const Icon = category?.icon || FileText;

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                          category?.color || 'from-slate-500 to-gray-500',
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(doc.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Category Selector */}
                          <div className="mt-2">
                            <select
                              value={doc.category}
                              onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                              className="text-sm px-2 py-1 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                            >
                              {DOCUMENT_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            {doc.confidence < 100 && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({doc.confidence}% match)
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="mt-2">
                            {doc.status === 'processing' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                <Loader className="w-3 h-3 animate-spin" />
                                Processing...
                              </span>
                            ) : doc.status === 'processed' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle className="w-3 h-3" />
                                Processed • {doc.extractedData?.fields} fields extracted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="w-3 h-3" />
                                Pending processing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Proceed Button */}
              {processedCount === documents.length && documents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end pt-4"
                >
                  <button
                    onClick={handleProceed}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Continue to Filing
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Supported Document Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DOCUMENT_CATEGORIES.filter((c) => c.id !== 'other').map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className={cn(
                    'p-3 rounded-xl border border-slate-200 flex items-center gap-2',
                    category.bgColor,
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                    category.color,
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{category.label}</p>
                    <p className="text-xs text-slate-500">{category.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DocumentUploadHub;

