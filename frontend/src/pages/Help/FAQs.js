// =====================================================
// FAQs PAGE
// Browse FAQs by category
// =====================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import HelpSearch from '../../components/Help/HelpSearch';
import toast from 'react-hot-toast';

const FAQs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feedbackGiven, setFeedbackGiven] = useState(new Set());

  const categories = [
    { id: 'all', name: 'All FAQs', count: 88 },
    { id: 'getting-started', name: 'Getting Started', count: 12 },
    { id: 'filing', name: 'ITR Filing', count: 25 },
    { id: 'tax-deductions', name: 'Tax & Deductions', count: 18 },
    { id: 'documents', name: 'Documents', count: 15 },
    { id: 'account', name: 'Account & Settings', count: 10 },
    { id: 'troubleshooting', name: 'Troubleshooting', count: 8 },
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create an account on BurnBlack?',
      answer: 'You can create an account by clicking the "Sign up" button on the login page. You can sign up using your email address, mobile number, or Google account. During signup, you\'ll need to verify your PAN and accept our terms and conditions.',
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'Is BurnBlack free to use?',
      answer: 'Yes, BurnBlack offers a free tier for basic ITR filing. However, we also offer premium plans with additional features like CA assistance, advanced tax optimization, and priority support.',
    },
    {
      id: 3,
      category: 'filing',
      question: 'Which ITR form should I file?',
      answer: 'The ITR form you need to file depends on your income sources. Use our ITR Form Recommender tool which will ask you a few questions about your income sources and recommend the appropriate ITR form (ITR-1, ITR-2, ITR-3, or ITR-4).',
    },
    {
      id: 4,
      category: 'filing',
      question: 'Can I file ITR for previous years?',
      answer: 'Yes, you can file ITR for previous assessment years. Select the assessment year when starting a new filing. Note that belated returns may attract interest and penalties.',
    },
    {
      id: 5,
      category: 'tax-deductions',
      question: 'What is the difference between Old and New tax regime?',
      answer: 'The Old regime allows you to claim various deductions (like 80C, 80D, HRA, etc.) but has higher tax rates. The New regime has lower tax rates but very limited deductions. Use our regime comparison tool to see which one saves you more tax.',
    },
    {
      id: 6,
      category: 'tax-deductions',
      question: 'How much can I claim under Section 80C?',
      answer: 'You can claim up to ₹1.5 lakh under Section 80C. This includes investments in ELSS, PPF, NSC, life insurance premiums, home loan principal repayment, tuition fees, and more.',
    },
    {
      id: 7,
      category: 'documents',
      question: 'What documents do I need to file my ITR?',
      answer: 'You\'ll need Form 16 (if salaried), AIS, Form 26AS, bank statements, investment proofs, rent receipts (if claiming HRA), and other relevant documents based on your income sources.',
    },
    {
      id: 8,
      category: 'documents',
      question: 'How do I upload Form 16?',
      answer: 'Go to the Documents section or start a new filing. Click "Upload Form 16" and select your Form 16 Part A and Part B PDF files. Our system will automatically extract the data from your Form 16.',
    },
    {
      id: 9,
      category: 'account',
      question: 'How do I change my password?',
      answer: 'Go to Settings > Security, and click "Change Password". Enter your current password and new password. Make sure your new password is at least 8 characters long and includes a mix of uppercase, lowercase, numbers, and special characters.',
    },
    {
      id: 10,
      category: 'troubleshooting',
      question: 'I\'m seeing discrepancies in my data. What should I do?',
      answer: 'Discrepancies occur when data from AIS/26AS/Form 16 doesn\'t match what you\'ve entered. Review each discrepancy in the Discrepancy Panel, and either accept the source value, keep your value, or enter a different value with an explanation.',
    },
  ];

  const toggleItem = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleFeedback = (faqId, helpful) => {
    setFeedbackGiven((prev) => new Set([...prev, faqId]));
    // TODO: Send feedback to backend
    if (helpful) {
      toast.success('Thank you for your feedback!');
    } else {
      toast.info('We\'ll work on improving this answer.');
    }
  };

  const getRelatedFAQs = (faq) => {
    return faqs
      .filter((f) => f.id !== faq.id && f.category === faq.category)
      .slice(0, 3);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <h1 className="text-heading-2xl text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-body-md text-gray-600">
            Find quick answers to common questions
          </p>
        </div>

        {/* Enhanced Search */}
        <div className="mb-6">
          <HelpSearch
            onResultClick={(query) => setSearchQuery(query)}
            placeholder="Search FAQs..."
          />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {filteredFAQs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-body-md text-gray-600">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id} id={`faq-${faq.id}`} className="p-6">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-start justify-between text-left"
                >
                  <h3 className="text-heading-sm text-gray-900 flex-1 pr-4">
                    {faq.question}
                  </h3>
                  {expandedItems.has(faq.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedItems.has(faq.id) && (
                  <div className="mt-4">
                    <div className="text-body-md text-gray-600 mb-4">
                      {faq.answer}
                    </div>

                    {/* Feedback Section */}
                    {!feedbackGiven.has(faq.id) ? (
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <span className="text-body-sm text-gray-600">Was this helpful?</span>
                        <button
                          onClick={() => handleFeedback(faq.id, true)}
                          className="flex items-center gap-2 px-3 py-1.5 text-body-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Yes
                        </button>
                        <button
                          onClick={() => handleFeedback(faq.id, false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-body-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-body-sm text-green-600 flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Thank you for your feedback!
                        </p>
                      </div>
                    )}

                    {/* Related FAQs */}
                    {getRelatedFAQs(faq).length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-body-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Related Questions
                        </h4>
                        <div className="space-y-2">
                          {getRelatedFAQs(faq).map((relatedFaq) => (
                            <button
                              key={relatedFaq.id}
                              onClick={() => {
                                toggleItem(relatedFaq.id);
                                // Scroll to the FAQ
                                const element = document.getElementById(`faq-${relatedFaq.id}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="text-left text-body-sm text-gold-600 hover:text-gold-700 hover:underline"
                            >
                              {relatedFaq.question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Still need help */}
        <div className="mt-8 bg-gold-50 border border-gold-200 rounded-lg p-6">
          <h3 className="text-heading-md text-gray-900 mb-2">Still need help?</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            to="/help/contact"
            className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQs;

