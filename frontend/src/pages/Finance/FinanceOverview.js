import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Receipt, PiggyBank, ArrowRight } from 'lucide-react';

import useFinanceFilterStore from '../../store/useFinanceFilterStore';
import { getIncomeSummary, getExpensesSummary, getInvestmentsSummary } from '../../services/financeService';
import { formatCurrency } from '../../utils/formatCurrency';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';

export default function FinanceOverview() {
  const { selectedFY } = useFinanceFilterStore();

  const { data: incomeSummary, isLoading: incomeLoading } = useQuery({
    queryKey: ['income-summary', selectedFY],
    queryFn: () => getIncomeSummary(selectedFY),
  });

  const { data: expenseSummary, isLoading: expenseLoading } = useQuery({
    queryKey: ['expenses-summary', selectedFY],
    queryFn: () => getExpensesSummary(selectedFY),
  });

  const { data: investmentSummary, isLoading: investmentLoading } = useQuery({
    queryKey: ['investments-summary', selectedFY],
    queryFn: () => getInvestmentsSummary(selectedFY),
  });

  const isLoading = incomeLoading || expenseLoading || investmentLoading;

  const totalIncome = parseFloat(incomeSummary?.totalIncome || 0);
  const totalExpenses = parseFloat(expenseSummary?.totalExpenses || 0);
  const totalInvestments = (investmentSummary?.sections || []).reduce(
    (sum, s) => sum + parseFloat(s.totalInvested || 0),
    0,
  );

  const cards = [
    {
      title: 'Income',
      subtitle: 'Track your earnings',
      icon: TrendingUp,
      color: 'var(--color-salary, #D4AF37)',
      bgColor: 'var(--sidebar-item-active-bg, #FBF5E4)',
      total: totalIncome,
      link: '/finance/income',
    },
    {
      title: 'Expenses',
      subtitle: 'Record deductible expenses',
      icon: Receipt,
      color: 'var(--color-rent, #7C3AED)',
      bgColor: '#F5F0FF',
      total: totalExpenses,
      link: '/finance/expenses',
    },
    {
      title: 'Investments',
      subtitle: 'Log tax-saving investments',
      icon: PiggyBank,
      color: 'var(--color-80ccd, #0D9488)',
      bgColor: '#F0FDFA',
      total: totalInvestments,
      link: '/finance/investments',
    },
  ];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Finance</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your year-round financial tracking hub for FY {selectedFY}
        </p>
      </div>

      {isLoading ? (
        <SkeletonLoader variant="card" count={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--border-medium)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
                    style={{ backgroundColor: card.bgColor }}
                  >
                    <Icon size={20} style={{ color: card.color }} />
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[var(--text-light)] transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{card.title}</h2>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{card.subtitle}</p>
                <div
                  className="mt-3 text-lg font-bold"
                  style={{ color: card.color, fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {formatCurrency(card.total)}
                </div>
                <div className="mt-1 text-[10px] font-medium uppercase text-[var(--text-light)]">YTD Total</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
