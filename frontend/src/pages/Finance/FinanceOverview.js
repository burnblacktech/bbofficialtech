import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Receipt, PiggyBank, ArrowRight, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import useFinanceFilterStore from '../../store/useFinanceFilterStore';
import {
  getIncomeSummary, getExpensesSummary, getInvestmentsSummary, getDashboardSummary,
} from '../../services/financeService';
import { formatCurrency, formatCompact } from '../../utils/formatCurrency';
import { getDeadlineInfo } from '../../utils/assessmentYear';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';

const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const DEDUCTION_LIMITS = [
  { key: '80C', label: 'Section 80C', limit: 150000 },
  { key: '80CCD', label: '80CCD(1B)', limit: 50000 },
  { key: '80D', label: 'Section 80D', limit: 25000 },
];

function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 shadow-md text-xs">
      <div className="font-semibold text-[var(--text-primary)] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[var(--text-muted)]">{p.dataKey === 'income' ? 'Income' : 'Expenses'}:</span>
          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

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

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-summary', selectedFY],
    queryFn: () => getDashboardSummary(selectedFY),
    staleTime: 30000,
  });

  const isLoading = incomeLoading || expenseLoading || investmentLoading;

  const totalIncome = parseFloat(incomeSummary?.totalIncome || 0);
  const totalExpenses = parseFloat(expenseSummary?.totalExpenses || 0);
  const totalInvestments = (investmentSummary?.sections || []).reduce(
    (sum, s) => sum + parseFloat(s.totalInvested || 0), 0,
  );
  const netTaxable = Math.max(0, totalIncome - totalExpenses - totalInvestments);
  const allZero = totalIncome === 0 && totalExpenses === 0 && totalInvestments === 0;

  // Monthly chart data
  const monthlyData = MONTH_LABELS.map((label, i) => {
    const mo = dashboardData?.monthlyOverview?.[i];
    return { name: label, income: mo?.income || 0, expense: mo?.expense || 0 };
  });

  // Deduction progress from investment summary sections
  const getDeductionAmount = (key) => {
    if (!investmentSummary?.sections) return 0;
    const section = investmentSummary.sections.find(s => s.section === key);
    return parseFloat(section?.totalInvested || 0);
  };

  const deadlineInfo = getDeadlineInfo();

  const cards = [
    { title: 'Income', subtitle: 'Track your earnings', icon: TrendingUp, color: 'var(--color-salary, #D4AF37)', bgColor: 'var(--sidebar-item-active-bg, #FBF5E4)', total: totalIncome, link: '/finance/income' },
    { title: 'Expenses', subtitle: 'Record deductible expenses', icon: Receipt, color: 'var(--color-rent, #7C3AED)', bgColor: '#F5F0FF', total: totalExpenses, link: '/finance/expenses' },
    { title: 'Investments', subtitle: 'Log tax-saving investments', icon: PiggyBank, color: 'var(--color-80ccd, #0D9488)', bgColor: '#F0FDFA', total: totalInvestments, link: '/finance/investments' },
  ];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Finance</h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: 12 }}
          >
            <Calendar size={14} />
            Year-Round Tracking
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your year-round financial tracking hub for FY {selectedFY}
        </p>
      </div>

      {isLoading ? (
        <SkeletonLoader variant="card" count={3} />
      ) : allZero ? (
        /* Empty state */
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5 text-center mb-6">
          <TrendingUp size={36} className="mx-auto mb-3 text-[var(--border-medium)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Start tracking your finances for FY {selectedFY}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-4">Log your income, expenses, and investments to see your financial overview here.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/finance/income" className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>Log Income</Link>
            <Link to="/finance/expenses" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-light)] text-[var(--text-secondary)]">Add Expense</Link>
            <Link to="/finance/investments" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-light)] text-[var(--text-secondary)]">Log Investment</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Income', value: totalIncome, color: '#D4AF37' },
              { label: 'Total Expenses', value: totalExpenses, color: '#7C3AED' },
              { label: 'Investments', value: totalInvestments, color: '#0D9488' },
              { label: 'Net Taxable', value: netTaxable, color: 'var(--text-primary)' },
            ].map((m) => (
              <div key={m.label} className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
                <div className="text-[10px] font-medium uppercase text-[var(--text-light)] mb-1">{m.label}</div>
                <div className="text-lg font-bold" style={{ color: m.color, fontFamily: 'var(--font-mono, monospace)' }}>
                  {formatCurrency(m.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Overview Chart */}
          {!dashboardLoading && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4 mb-6">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Monthly Overview</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="#D4AF37" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" fill="#1A1A1A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Deduction Progress */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Deduction Progress</h2>
            <div className="space-y-3">
              {DEDUCTION_LIMITS.map((d) => {
                const amount = getDeductionAmount(d.key);
                const pct = Math.min(100, Math.round((amount / d.limit) * 100));
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{d.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatCurrency(amount)} / {formatCurrency(d.limit)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : 'var(--brand-primary)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Upcoming Deadlines</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">ITR Filing Deadline</span>
                <span className={`text-xs font-semibold ${deadlineInfo.isPastDue ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                  {deadlineInfo.label} ({deadlineInfo.isPastDue ? 'Past due' : `${deadlineInfo.daysLeft} days left`})
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Existing tracker navigation cards */}
      {!isLoading && !allZero && (
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
