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
          className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
        >
          ← Back to topics
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h3>
          <p className="text-gray-600 mb-4">{topic.summary}</p>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{topic.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Tax Topics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => onTopicSelect(topic.id)}
            className="border border-gray-200 rounded-lg p-4 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-gold-600" />
                  <h4 className="font-semibold text-gray-900">{topic.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{topic.summary}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded">
                  {topic.category}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicGuide;

