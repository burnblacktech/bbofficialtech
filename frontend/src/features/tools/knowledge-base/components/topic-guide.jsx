// =====================================================
// TOPIC GUIDE COMPONENT
// Displays tax topics and guides
// =====================================================

import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useTopic } from '../hooks/use-knowledge-base';

const TopicGuide = ({ selectedTopicId, onTopicSelect }) => {
  const { data: topicData, isLoading } = useTopic(selectedTopicId);

  const topics = [
    {
      id: 'income-tax-basics',
      title: 'Income Tax Basics',
      category: 'basics',
      summary: 'Understanding the fundamentals of income tax in India',
    },
    {
      id: 'deductions',
      title: 'Tax Deductions',
      category: 'deductions',
      summary: 'Learn about various tax deductions available under the Income Tax Act',
    },
    {
      id: 'itr-filing',
      title: 'ITR Filing Process',
      category: 'filing',
      summary: 'Step-by-step guide to filing your Income Tax Return',
    },
    {
      id: 'refunds',
      title: 'Tax Refunds',
      category: 'refunds',
      summary: 'Understanding tax refunds and how to track them',
    },
  ];

  if (selectedTopicId && topicData?.topic) {
    const topic = topicData.topic;
    return (
      <div className="space-y-4">
        <button
          onClick={() => onTopicSelect(null)}
          className="text-body-regular text-gold-600 hover:text-gold-700 flex items-center gap-1"
        >
          ← Back to topics
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-heading-2 font-bold text-slate-900 mb-2">{topic.title}</h3>
          <p className="text-slate-600 mb-4">{topic.summary}</p>
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-line">{topic.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Tax Topics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => onTopicSelect(topic.id)}
            className="border border-slate-200 rounded-xl p-4 hover:border-gold-300 hover:shadow-elevation-2 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-gold-600" />
                  <h4 className="font-semibold text-slate-900">{topic.title}</h4>
                </div>
                <p className="text-body-regular text-slate-600">{topic.summary}</p>
                <span className="inline-block mt-2 px-2 py-1 text-body-small bg-gold-100 text-gold-800 rounded">
                  {topic.category}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicGuide;

