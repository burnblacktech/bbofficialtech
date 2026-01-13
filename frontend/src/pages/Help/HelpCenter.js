// =====================================================
// HELP CENTER PAGE
// Main help page with search and categories
// =====================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageCircle, FileText, Video, HelpCircle, Bug, Lightbulb } from 'lucide-react';
import HelpSearch from '../../components/Help/HelpSearch';
import CategoryGrid from '../../components/Help/CategoryGrid';
import ArticleCard from '../../components/Help/ArticleCard';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn how to file your ITR',
      icon: BookOpen,
      color: 'bg-gold-100 text-gold-600',
      articles: 12 },
    {
      id: 'filing',
      title: 'ITR Filing',
      description: 'Step-by-step filing guides',
      icon: FileText,
      color: 'bg-primary-100 text-primary-600',
      articles: 25 },
    {
      id: 'tax-deductions',
      title: 'Tax & Deductions',
      description: 'Understand tax calculations',
      icon: HelpCircle,
      color: 'bg-success-100 text-success-600',
      articles: 18 },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload and manage documents',
      icon: FileText,
      color: 'bg-primary-100 text-primary-600',
      articles: 15 },
    {
      id: 'account',
      title: 'Account & Settings',
      description: 'Manage your account',
      icon: HelpCircle,
      color: 'bg-slate-100 text-slate-600',
      articles: 10 },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: HelpCircle,
      color: 'bg-error-100 text-error-600',
      articles: 8 },
  ];

  const quickLinks = [
    { title: 'Browse FAQs', path: '/help/faqs', icon: FileText },
    { title: 'Tax Glossary', path: '/help/glossary', icon: BookOpen },
    { title: 'Video Tutorials', path: '/help/tutorials', icon: Video },
    { title: 'Contact Support', path: '/help/contact', icon: MessageCircle },
  ];

  const popularArticles = [
    { id: 1, title: 'How to file ITR-1 for salaried employees', category: 'filing', views: 1250 },
    { id: 2, title: 'Understanding HRA exemption calculation', category: 'tax-deductions', views: 980 },
    { id: 3, title: 'How to upload Form 16', category: 'documents', views: 850 },
    { id: 4, title: 'Old vs New tax regime comparison', category: 'tax-deductions', views: 720 },
    { id: 5, title: 'How to claim Section 80C deductions', category: 'tax-deductions', views: 650 },
  ];

  const handleSearch = (query) => {
    if (query && query.trim().length >= 2) {
      navigate(`/help/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
      <div>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-heading-2 sm:text-heading-1 font-bold text-slate-900 mb-4">How can we help you?</h1>
          <p className="text-body-regular sm:text-body-large text-slate-600 max-w-2xl mx-auto">
            Find answers to common questions, learn how to use BurnBlack, and get support when you need it.
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <HelpSearch onResultClick={handleSearch} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 hover:shadow-elevation-2 transition-shadow"
              >
                <Icon className="h-8 w-8 text-gold-600 mb-3" />
                <h3 className="text-heading-sm text-slate-900">{link.title}</h3>
              </Link>
            );
          })}
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-heading-xl text-black mb-6">Browse by Category</h2>
          <CategoryGrid categories={categories} onCategoryClick={handleSearch} />
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-heading-xl text-black mb-6">Popular Articles</h2>
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 divide-y divide-gray-200">
            {popularArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={{
                  ...article,
                  category: categories.find(c => c.id === article.category)?.title }}
                showCategory={true}
                showStats={true}
              />
            ))}
          </div>
        </div>

        {/* Support Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/help/report-bug"
            className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 hover:shadow-elevation-2 transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-error-100 rounded-xl">
                  <Bug className="h-6 w-6 text-error-600" />
                </div>
              </div>
              <div>
                <h3 className="text-heading-md text-black mb-2">Report a Bug</h3>
                <p className="text-body-sm text-slate-600">
                  Found an issue? Let us know and we'll fix it.
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/help/feature-request"
            className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 hover:shadow-elevation-2 transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-warning-100 rounded-xl">
                  <Lightbulb className="h-6 w-6 text-warning-600" />
                </div>
              </div>
              <div>
                <h3 className="text-heading-md text-black mb-2">Request a Feature</h3>
                <p className="text-body-sm text-slate-600">
                  Have an idea? We'd love to hear it.
                </p>
              </div>
            </div>
          </Link>
        </div>
    </div>
  );
};

export default HelpCenter;

