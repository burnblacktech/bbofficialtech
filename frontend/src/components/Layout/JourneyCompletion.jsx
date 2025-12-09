// Justification: Journey Completion Interface - Professional assistance completion
// Provides comprehensive interface for completing journeys on behalf of users
// Implements delegation-aware journey completion with proper audit trails
// Essential for enabling professional assistance workflows with complete UX
// Follows ultra-deep design principles with psychology-driven user experience

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  Send,
  AlertTriangle,
  Info,
  Clock,
  User,
  Shield,
  ArrowRight,
  Calendar,
  IndianRupee,
  FileCheck,
  MessageSquare,
  History,
  Lock,
  Unlock,
  XCircle,
} from 'lucide-react';

const JourneyCompletion = ({ journeyId, delegationId, isDelegated = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const queryClient = useQueryClient();

  // Fetch journey data
  const { data: journeyData, isLoading: journeyLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: async () => {
      const response = await fetch(`/api/journeys/${journeyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      return response.json();
    },
    enabled: !!journeyId,
  });

  // Fetch delegation status if delegated
  const { data: delegationStatus } = useQuery({
    queryKey: ['delegation-status', journeyId],
    queryFn: async () => {
      const response = await fetch(`/api/delegation/status/${journeyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      return response.json();
    },
    enabled: isDelegated && !!journeyId,
  });

  // Complete journey mutation
  const completeJourneyMutation = useMutation({
    mutationFn: async (completionData) => {
      const endpoint = isDelegated
        ? `/api/delegation/complete/${delegationId}`
        : `/api/journeys/${journeyId}/complete`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(completionData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journey', journeyId]);
      if (isDelegated) {
        queryClient.invalidateQueries(['delegation-status', journeyId]);
      }
    },
  });

  // Auto-save form data
  useEffect(() => {
    const autoSave = () => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem(`journey_${journeyId}_form`, JSON.stringify(formData));
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [formData, journeyId]);

  // Load saved form data
  useEffect(() => {
    const savedData = localStorage.getItem(`journey_${journeyId}_form`);
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, [journeyId]);

  const steps = [
    { id: 1, name: 'Personal Information', icon: User },
    { id: 2, name: 'Income Details', icon: IndianRupee },
    { id: 3, name: 'Deductions', icon: FileCheck },
    { id: 4, name: 'Documents', icon: FileText },
    { id: 5, name: 'Review & Submit', icon: Send },
  ];

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = (file) => {
    const newDocument = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      status: 'uploading',
    };

    setDocuments(prev => [...prev, newDocument]);

    // Simulate upload
    setTimeout(() => {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === newDocument.id
            ? { ...doc, status: 'uploaded', url: URL.createObjectURL(file) }
            : doc,
        ),
      );
    }, 2000);
  };

  const handleComplete = () => {
    const completionData = {
      finalFormData: formData,
      documents: documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        path: doc.url,
      })),
      submissionStatus: 'completed',
      completionNotes: completionNotes,
    };

    completeJourneyMutation.mutate(completionData);
  };

  if (journeyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const journey = journeyData?.data;
  const delegation = delegationStatus?.data?.currentDelegation;

  return (
    <div className="journey-completion bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isDelegated ? 'Complete Journey on Behalf' : 'Complete Journey'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {journey?.journey_type} • {journey?.status}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {isDelegated && (
                  <div className="flex items-center space-x-2 text-sm text-gold-600 bg-gold-50 px-3 py-2 rounded-lg">
                    <Shield className="w-4 h-4" />
                    <span>Delegated Completion</span>
                  </div>
                )}
                <button
                  onClick={() => setShowAuditTrail(true)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>Audit Trail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-success-500 border-success-500 text-white'
                      : isActive
                        ? 'bg-gold-500 border-gold-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-gold-600' : isCompleted ? 'text-success-500' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delegation Info */}
        {isDelegated && delegation && (
          <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-info-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-info-900">Delegation Information</h3>
                <div className="mt-2 text-sm text-info-800">
                  <p>You are completing this journey on behalf of <strong>{delegation.delegatee_name}</strong></p>
                  <p className="mt-1">Delegation type: <strong>{delegation.delegation_type}</strong></p>
                  <p className="mt-1">Reason: {delegation.delegation_reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 1 && (
            <PersonalInformationStep
              formData={formData}
              onChange={handleFormChange}
              isDelegated={isDelegated}
            />
          )}

          {currentStep === 2 && (
            <IncomeDetailsStep
              formData={formData}
              onChange={handleFormChange}
              isDelegated={isDelegated}
            />
          )}

          {currentStep === 3 && (
            <DeductionsStep
              formData={formData}
              onChange={handleFormChange}
              isDelegated={isDelegated}
            />
          )}

          {currentStep === 4 && (
            <DocumentsStep
              documents={documents}
              onUpload={handleDocumentUpload}
              isDelegated={isDelegated}
            />
          )}

          {currentStep === 5 && (
            <ReviewSubmitStep
              formData={formData}
              documents={documents}
              completionNotes={completionNotes}
              setCompletionNotes={setCompletionNotes}
              onComplete={handleComplete}
              isLoading={completeJourneyMutation.isPending}
              isDelegated={isDelegated}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                const savedData = { ...formData, documents, completionNotes };
                localStorage.setItem(`journey_${journeyId}_draft`, JSON.stringify(savedData));
              }}
              className="px-4 py-2 text-gold-600 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completeJourneyMutation.isPending}
                className="px-6 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {completeJourneyMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isDelegated ? 'Complete on Behalf' : 'Complete Journey'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <AuditTrailModal
          journeyId={journeyId}
          delegationId={delegationId}
          onClose={() => setShowAuditTrail(false)}
        />
      )}
    </div>
  );
};

// Personal Information Step Component
const PersonalInformationStep = ({ formData, onChange, isDelegated }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <User className="w-5 h-5 text-gold-600" />
      <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
      {isDelegated && (
        <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
          Completing on behalf
        </span>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          value={formData.fullName || ''}
          onChange={(e) => onChange('fullName', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
        <input
          type="text"
          value={formData.panNumber || ''}
          onChange={(e) => onChange('panNumber', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter PAN number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth || ''}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
        <input
          type="tel"
          value={formData.mobileNumber || ''}
          onChange={(e) => onChange('mobileNumber', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter mobile number"
        />
      </div>
    </div>
  </div>
);

// Income Details Step Component
const IncomeDetailsStep = ({ formData, onChange, isDelegated }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <IndianRupee className="w-5 h-5 text-gold-600" />
      <h2 className="text-lg font-semibold text-gray-900">Income Details</h2>
      {isDelegated && (
        <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
          Completing on behalf
        </span>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Income</label>
        <input
          type="number"
          value={formData.salaryIncome || ''}
          onChange={(e) => onChange('salaryIncome', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter salary income"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rental Income</label>
        <input
          type="number"
          value={formData.rentalIncome || ''}
          onChange={(e) => onChange('rentalIncome', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter rental income"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Capital Gains</label>
        <input
          type="number"
          value={formData.capitalGains || ''}
          onChange={(e) => onChange('capitalGains', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter capital gains"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Other Income</label>
        <input
          type="number"
          value={formData.otherIncome || ''}
          onChange={(e) => onChange('otherIncome', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter other income"
        />
      </div>
    </div>
  </div>
);

// Deductions Step Component
const DeductionsStep = ({ formData, onChange, isDelegated }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <FileCheck className="w-5 h-5 text-gold-500" />
      <h2 className="text-lg font-semibold text-gray-900">Deductions</h2>
      {isDelegated && (
        <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
          Completing on behalf
        </span>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Section 80C</label>
        <input
          type="number"
          value={formData.section80C || ''}
          onChange={(e) => onChange('section80C', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter Section 80C deduction"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Section 80D</label>
        <input
          type="number"
          value={formData.section80D || ''}
          onChange={(e) => onChange('section80D', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter Section 80D deduction"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Home Loan Interest</label>
        <input
          type="number"
          value={formData.homeLoanInterest || ''}
          onChange={(e) => onChange('homeLoanInterest', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter home loan interest"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Other Deductions</label>
        <input
          type="number"
          value={formData.otherDeductions || ''}
          onChange={(e) => onChange('otherDeductions', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Enter other deductions"
        />
      </div>
    </div>
  </div>
);

// Documents Step Component
const DocumentsStep = ({ documents, onUpload, isDelegated }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <FileText className="w-5 h-5 text-gold-500" />
      <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
      {isDelegated && (
        <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
          Completing on behalf
        </span>
      )}
    </div>

    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
      <p className="text-gray-600 mb-4">Drag and drop files here, or click to select</p>
      <input
        type="file"
        multiple
        onChange={(e) => {
          Array.from(e.target.files).forEach(file => onUpload(file));
        }}
        className="hidden"
        id="document-upload"
      />
      <label
        htmlFor="document-upload"
        className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors cursor-pointer"
      >
        <Upload className="w-4 h-4 mr-2" />
        Select Files
      </label>
    </div>

    {documents.length > 0 && (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Uploaded Documents</h3>
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{doc.name}</p>
                <p className="text-sm text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {doc.status === 'uploading' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              {doc.status === 'uploaded' && (
                <CheckCircle className="w-5 h-5 text-success-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Review & Submit Step Component
const ReviewSubmitStep = ({ formData, documents, completionNotes, setCompletionNotes, onComplete, isLoading, isDelegated }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <Send className="w-5 h-5 text-gold-500" />
      <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
      {isDelegated && (
        <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
          Completing on behalf
        </span>
      )}
    </div>

    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="font-medium text-gray-900 mb-4">Form Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Full Name:</span>
          <span className="ml-2 font-medium">{formData.fullName || 'Not provided'}</span>
        </div>
        <div>
          <span className="text-gray-600">PAN Number:</span>
          <span className="ml-2 font-medium">{formData.panNumber || 'Not provided'}</span>
        </div>
        <div>
          <span className="text-gray-600">Salary Income:</span>
          <span className="ml-2 font-medium">₹{formData.salaryIncome || '0'}</span>
        </div>
        <div>
          <span className="text-gray-600">Rental Income:</span>
          <span className="ml-2 font-medium">₹{formData.rentalIncome || '0'}</span>
        </div>
        <div>
          <span className="text-gray-600">Section 80C:</span>
          <span className="ml-2 font-medium">₹{formData.section80C || '0'}</span>
        </div>
        <div>
          <span className="text-gray-600">Documents:</span>
          <span className="ml-2 font-medium">{documents.length} files</span>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Completion Notes {isDelegated && '(Required for delegated completion)'}
      </label>
      <textarea
        value={completionNotes}
        onChange={(e) => setCompletionNotes(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        rows={4}
        placeholder="Add any notes about the completion..."
        required={isDelegated}
      />
    </div>

    {isDelegated && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900">Delegated Completion</h3>
            <p className="text-sm text-yellow-800 mt-1">
              You are completing this journey on behalf of another user. All actions will be logged in the audit trail.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Audit Trail Modal Component
const AuditTrailModal = ({ journeyId, delegationId, onClose }) => {
  const { data: auditData } = useQuery({
    queryKey: ['audit-trail', journeyId],
    queryFn: async () => {
      const response = await fetch(`/api/delegation/status/${journeyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      return response.json();
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {auditData?.data?.delegationHistory?.map((entry, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.original_owner_name} → {entry.current_owner_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {entry.delegation_type} • {new Date(entry.delegation_timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
                    Delegated
                  </span>
                </div>
                {entry.delegation_reason && (
                  <p className="text-sm text-gray-700 mt-1">{entry.delegation_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyCompletion;
