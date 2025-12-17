// =====================================================
// KNOWLEDGE BASE COMPONENT
// Main component for tax knowledge base
// =====================================================

import React, { useState } from 'react';
import { BookOpen, Search, FileText, Lightbulb } from 'lucide-react';
import { useSearchKnowledgeBase } from '../hooks/use-knowledge-base';
import SearchBar from './search-bar';
import TopicGuide from './topic-guide';
import SectionExplainer from './section-explainer';
import ITRFormGuide from './itr-form-guide';
import TaxTips from './tax-tips';

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedITR, setSelectedITR] = useState(null);

  const { data: searchResults, isLoading: isSearching } = useSearchKnowledgeBase(
    searchQuery,
    {},
  );

  const tabs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'sections', label: 'Sections', icon: FileText },
    { id: 'itr-guides', label: 'ITR Guides', icon: FileText },
    { id: 'tips', label: 'Tax Tips', icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-2 font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-gold-600" />
          Tax Knowledge Base
        </h2>
      </div>

      {/* Search Bar */}
      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults?.results}
        isLoading={isSearching}
      />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-gold-500 text-gold-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'search' && (
          <div className="space-y-4">
            {searchResults?.results && searchResults.results.length > 0 ? (
              <div className="space-y-3">
                {searchResults.results.map((result, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl p-4 hover:border-gold-300 transition-colors cursor-pointer"
                    onClick={() => {
                      if (result.type === 'topic') {
                        setSelectedTopic(result.id);
                        setActiveTab('topics');
                      } else if (result.type === 'section') {
                        setSelectedSection(result.id);
                        setActiveTab('sections');
                      } else if (result.type === 'itr-guide') {
                        setSelectedITR(result.id);
                        setActiveTab('itr-guides');
                      }
                    }}
                  >
                    <h4 className="font-semibold text-slate-900 mb-1">{result.title}</h4>
                    <p className="text-body-regular text-slate-600">{result.summary}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-body-small bg-gold-100 text-gold-800 rounded">
                      {result.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8 text-slate-500">
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p>Enter a search query to find tax information</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'topics' && (
          <TopicGuide selectedTopicId={selectedTopic} onTopicSelect={setSelectedTopic} />
        )}

        {activeTab === 'sections' && (
          <SectionExplainer selectedSectionId={selectedSection} onSectionSelect={setSelectedSection} />
        )}

        {activeTab === 'itr-guides' && (
          <ITRFormGuide selectedGuideId={selectedITR} onGuideSelect={setSelectedITR} />
        )}

        {activeTab === 'tips' && <TaxTips />}
      </div>
    </div>
  );
};

export default KnowledgeBase;

