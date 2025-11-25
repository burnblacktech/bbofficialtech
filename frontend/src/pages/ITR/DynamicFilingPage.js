import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  Download,
  Eye,
  Plus,
} from 'lucide-react';

// Import mock data
import { mockPrefillData, mockTaxCalculation, mockAISuggestions } from '../../mocks/prefillData';

// Import components (will create these next)
import SectionCard from '../../components/ITR/SectionCard';
import LiveComputation from '../../components/ITR/LiveComputation';
import FilingHeader from '../../components/ITR/FilingHeader';
import FinalActions from '../../components/ITR/FinalActions';
import AISuggestionChip from '../../components/ITR/AISuggestionChip';

const DynamicFilingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [filingData, setFilingData] = useState(null);
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['personalInfo']));

  // Load initial data
  useEffect(() => {
    const loadFilingData = async () => {
      try {
        setIsLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load mock data
        setFilingData(mockPrefillData);
        setTaxCalculation(mockTaxCalculation);
        setAISuggestions(mockAISuggestions);
        setLastSaved(new Date(mockPrefillData.lastSaved));

      } catch (error) {
        console.error('Failed to load filing data:', error);
        // Handle error state
      } finally {
        setIsLoading(false);
      }
    };

    loadFilingData();
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    if (!filingData) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        setIsSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update last saved timestamp
        setLastSaved(new Date());

        console.log('Auto-saved filing data');
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [filingData]);

  // Handle section expansion/collapse
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Handle data updates from sections
  const updateFilingData = (section, data) => {
    setFilingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  // Handle manual save
  const handleManualSave = async () => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLastSaved(new Date());
      console.log('Manual save completed');
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!filingData) return 0;

    const sections = ['personalInfo', 'incomeDetails', 'deductions', 'taxesPaid'];
    let completedSections = 0;

    sections.forEach(section => {
      if (filingData[section] && Object.keys(filingData[section]).length > 0) {
        completedSections++;
      }
    });

    return Math.round((completedSections / sections.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading your filing...</h2>
          <p className="text-gray-600 mt-2">Fetching your pre-filled data from ITD</p>
        </div>
      </div>
    );
  }

  if (!filingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load filing</h2>
          <p className="text-gray-600 mt-2">Please try again or contact support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <FilingHeader
        filingData={filingData}
        completionPercentage={calculateCompletion()}
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={handleManualSave}
      />

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Filing Sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Suggestions Banner */}
            {aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-blue-900">AI Suggestions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.slice(0, 3).map((suggestion) => (
                    <AISuggestionChip
                      key={suggestion.id}
                      suggestion={suggestion}
                      onClick={() => {
                        // Scroll to relevant section
                        const element = document.getElementById(suggestion.section);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Personal Information Section */}
            <SectionCard
              id="personalInfo"
              title="Personal Information"
              status="complete"
              summary="John Doe, Mumbai, Maharashtra"
              isExpanded={expandedSections.has('personalInfo')}
              onToggle={() => toggleSection('personalInfo')}
              data={filingData.personalInfo}
              onUpdate={(data) => updateFilingData('personalInfo', data)}
            />

            {/* Income Details Section */}
            <SectionCard
              id="incomeDetails"
              title="Income Details"
              status="attention_needed"
              summary="₹12,35,000 from 3 sources"
              isExpanded={expandedSections.has('incomeDetails')}
              onToggle={() => toggleSection('incomeDetails')}
              data={filingData.incomeDetails}
              onUpdate={(data) => updateFilingData('incomeDetails', data)}
            />

            {/* Deductions Section */}
            <SectionCard
              id="deductions"
              title="Deductions"
              status="incomplete"
              summary="₹0 claimed (₹1,85,000 available)"
              isExpanded={expandedSections.has('deductions')}
              onToggle={() => toggleSection('deductions')}
              data={filingData.deductions}
              onUpdate={(data) => updateFilingData('deductions', data)}
            />

            {/* Taxes Paid Section */}
            <SectionCard
              id="taxesPaid"
              title="Taxes Paid"
              status="complete"
              summary="₹1,22,500 TDS from 2 sources"
              isExpanded={expandedSections.has('taxesPaid')}
              onToggle={() => toggleSection('taxesPaid')}
              data={filingData.taxesPaid}
              onUpdate={(data) => updateFilingData('taxesPaid', data)}
            />

            {/* Final Actions */}
            <FinalActions
              filingData={filingData}
              taxCalculation={taxCalculation}
              onFileITR={() => {
                // Navigate to filing submission
                navigate(`/itr-filing/${id}/submit`);
              }}
              onAIRefresh={() => {
                // Trigger AI review
                console.log('Running AI final review...');
              }}
            />

          </div>

          {/* Right Column: Live Computation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LiveComputation
                taxCalculation={taxCalculation}
                filingData={filingData}
                isLoading={isSaving}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DynamicFilingPage;
