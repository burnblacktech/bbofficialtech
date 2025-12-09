// =====================================================
// CATEGORY GRID COMPONENT
// Grid component for browsing help categories
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, HelpCircle, MessageCircle, Video, Bug, Lightbulb } from 'lucide-react';

const categoryIcons = {
  'getting-started': BookOpen,
  'filing': FileText,
  'tax-deductions': HelpCircle,
  'documents': FileText,
  'account': HelpCircle,
  'troubleshooting': Bug,
  'feature-request': Lightbulb,
  'video-tutorials': Video,
  'contact': MessageCircle,
};

const categoryColors = {
  'getting-started': 'bg-gold-100 text-gold-600',
  'filing': 'bg-royal-100 text-royal-600',
  'tax-deductions': 'bg-green-100 text-green-600',
  'documents': 'bg-purple-100 text-purple-600',
  'account': 'bg-gray-100 text-gray-600',
  'troubleshooting': 'bg-red-100 text-red-600',
  'feature-request': 'bg-blue-100 text-blue-600',
  'video-tutorials': 'bg-indigo-100 text-indigo-600',
  'contact': 'bg-pink-100 text-pink-600',
};

const CategoryGrid = ({ categories, onCategoryClick }) => {
  const handleCategoryClick = (category) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => {
        const Icon = categoryIcons[category.id] || FileText;
        const colorClass = categoryColors[category.id] || 'bg-gray-100 text-gray-600';

        return (
          <Link
            key={category.id}
            to={`/help/category/${category.id}`}
            onClick={() => handleCategoryClick(category)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow hover:border-gold-300"
          >
            <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-heading-sm font-semibold text-gray-900 mb-2">{category.title}</h3>
            <p className="text-body-sm text-gray-600 mb-3">{category.description}</p>
            {category.articles !== undefined && (
              <div className="flex items-center text-body-xs text-gray-500">
                <span>{category.articles} articles</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default CategoryGrid;

