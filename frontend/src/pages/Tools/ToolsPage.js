// =====================================================
// TOOLS PAGE
// Main page for all additional tools
// =====================================================

import React, { useState } from 'react';
import { Calculator, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';
import {
  InvestmentPlanner,
  TaxCalendar,
  DeadlineList,
  KnowledgeBase } from '../../features/tools';

const ToolsPage = () => {
  const [activeTool, setActiveTool] = useState('investment-planning');

  const tools = [
    {
      id: 'investment-planning',
      label: 'Investment Planning',
      icon: TrendingUp,
      component: InvestmentPlanner },
    {
      id: 'deadlines',
      label: 'Deadlines & Calendar',
      icon: Calendar,
      component: TaxCalendar },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: BookOpen,
      component: KnowledgeBase },
  ];

  const ActiveComponent = tools.find((tool) => tool.id === activeTool)?.component;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-heading-1 font-bold text-slate-900">Additional Tools</h1>
          <p className="mt-2 text-slate-600">
            Access investment planning, tax deadlines, and comprehensive tax knowledge
          </p>
        </div>

        {/* Tool Navigation */}
        <Card>
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTool === tool.id
                          ? 'border-gold-500 text-gold-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tool.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tool Content */}
          <div className="p-6">
            {ActiveComponent && (
              <ActiveComponent
                userId={null} // Will be passed from auth context
                currentDeductions={{}}
                availableAmount={null}
              />
            )}
          </div>
                </Card>
      </div>
    </div>
  );
};

export default ToolsPage;

