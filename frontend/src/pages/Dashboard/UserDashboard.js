/**
 * Financial Command Center — Dashboard
 *
 * Replaces the old compact dashboard with a year-round financial overview.
 * Fetches all data from GET /api/finance/dashboard-summary?fy= via React Query.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Receipt,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { useAuth } from '../../contexts/AuthContext';
import { getDashboardSummary } from '../../services/financeService';
import { itrService } from '../../services';
import { getCurrentAY, ayToFY, getDeadlineInfo } from '../../utils/assessmentYear';
import { formatCurrency, formatCompact } from '../../utils/formatCurrency';
import { getGreeting } from '../../utils/greetingCopy';
import useOnboardingStore from '../../store/useOnboardingStore';

import MetricCard from '../../components/Shared/MetricCard';
import ActionCard from '../../components/Shared/ActionCard';
import ProgressRing from '../../components/Shared/ProgressRing';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';
import OnboardingChecklist from '../../components/Shared/OnboardingChecklist';
import AchievementBadges from '../../components/Shared/AchievementBadges';
import useReadinessMilestones from '../../hooks/useReadinessMilestones';
import useStreakTracking from '../../hooks/useStreakTracking';
import useChartColors from '../../hooks/useChartColors';

/* ── Constants ── */
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const CHART_COLORS = {
  income: '#D4AF37',
  expense: '#1A1A1A',
  unfilled: '#E8E8E4',
  section80C: '#D4AF37',
  section80CCD: '#0D9488',
};

/* eslint-disable camelcase */
const STATE_MAP = {
  draft: { label: 'Draft', color: 'var(--text-muted)', bgClass: 'bg-gray-100 text-gray-600' },
  ready_for_submission: { label: 'Ready', color: 'var(--brand-primary)', bgClass: 'bg-amber-50 text-amber-700' },
  submitted_to_eri: { label: 'Submitted', color: 'var(--brand-primary)', bgClass: 'bg-amber-50 text-amber-700' },
  eri_in_progress: { label: 'Processing', color: 'var(--color-warning)', bgClass: 'bg-yellow-50 text-yellow-700' },
  eri_success: { label: 'Accepted', color: 'var(--color-success)', bgClass: 'bg-green-50 text-green-700' },
  eri_failed: { label: 'Failed', color: 'var(--color-error)', bgClass: 'bg-red-50 text-red-700' },
};

const STATE_ICONS = {
  draft: Clock,
  ready_for_submission: CheckCircle,
  submitted_to_eri: ArrowRight,
  eri_in_progress: Clock,
  eri_success: CheckCircle,
  eri_failed: AlertCircle,
};
/* eslint-enable camelcase */

/* ── Compact screen detection ── */
function useIsCompact() {
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 480);
  useEffect(() => {
    const handler = () => setIsCompact(window.innerWidth < 480);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isCompact;
}

/* ── Custom chart tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === 'income');
  const expense = payload.find((p) => p.dataKey === 'expense');
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 shadow-md text-xs">
      <div className="font-semibold text-[var(--text-primary)] mb-1">{label}</div>
      {income && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.income }} />
          <span className="text-[var(--text-muted)]">Income:</span>
          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(income.value)}</span>
        </div>
      )}
      {expense && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.expense }} />
          <span className="text-[var(--text-muted)]">Expenses:</span>
          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(expense.value)}</span>
        </div>
      )}
    </div>
  );
}

/* ── Investment donut tooltip ── */
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 shadow-md text-xs">
      <div className="font-semibold text-[var(--text-primary)]">{d.name}</div>
      <div className="text-[var(--text-muted)]">{formatCurrency(d.value)}</div>
    </div>
  );
}

/* ── Main Component ── */
export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isCompact = useIsCompact();
  const { steps, dismissedAt } = useOnboardingStore();
  const [readinessExpanded, setReadinessExpanded] = useState(false);

  const currentAY = getCurrentAY();
  const currentFY = ayToFY(currentAY);
  const dl = getDeadlineInfo();
  const firstName = (user?.fullName || 'User').split(' ')[0];

  // Dashboard summary data
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['dashboard-summary', currentFY],
    queryFn: () => getDashboardSummary(currentFY),
    staleTime: 30000,
  });

  // Filings list
  const { data: filings = [], isLoading: filingsLoading } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => (await itrService.getUserITRs()).filings || [],
    staleTime: 30000,
  });

  // Greeting
  const { greeting, subtitle } = getGreeting({
    firstName,
    ay: currentAY,
    daysToDeadline: dl.daysLeft,
    isFirstVisit: !summary?.financialSummary?.totalIncome && !filings.length,
  });

  // Derived data
  const fin = summary?.financialSummary || {};
  const readiness = summary?.readinessScore || { percentage: 0, components: [] };
  const monthlyData = summary?.monthlyOverview || [];
  const investmentProgress = summary?.investmentProgress || [];
  const recentActivity = summary?.recentActivity || [];
  const hasFinancialData = fin.totalIncome > 0 || fin.totalDeductions > 0 || filings.length > 0;

  // Chart colors (dark mode aware)
  const chartColors = useChartColors();

  // Gamification: milestones + streak + badges
  useReadinessMilestones(readiness.percentage, currentFY);
  const entryDates = summary?.entryDates || [];
  const { currentStreak } = useStreakTracking(entryDates);
  const badgeData = {
    hasFilings: filings.length > 0,
    documentCount: summary?.documentCount || 0,
    investmentTotal: investmentProgress.reduce((s, p) => s + (p.totalInvested || 0), 0),
    streak: currentStreak,
    filedBeforeDeadline: filings.some((f) => f.lifecycleState === 'eri_success'),
    readiness: readiness.percentage,
  };

  // Determine if onboarding should show
  const allStepsComplete = Object.values(steps).every(Boolean);
  const showOnboarding = !hasFinancialData && !dismissedAt && !allStepsComplete;

  // Monthly chart data — ensure 12 months
  const chartData = MONTH_LABELS.map((month, i) => {
    const entry = monthlyData[i] || {};
    return { month, income: entry.income || 0, expense: entry.expense || 0 };
  });

  // Investment donut data
  const donutData = investmentProgress.map((s) => ({
    name: s.section,
    value: s.totalInvested || 0,
    limit: s.limit || 0,
    remaining: Math.max(0, (s.limit || 0) - (s.totalInvested || 0)),
  }));
  const hasInvestmentData = donutData.some((d) => d.value > 0);

  // Donut with unfilled segments
  const donutChartData = [];
  donutData.forEach((d) => {
    donutChartData.push({ name: d.name, value: Math.min(d.value, d.limit || d.value) });
    if (d.remaining > 0) {
      donutChartData.push({ name: `${d.name} remaining`, value: d.remaining, isUnfilled: true });
    }
  });

  const donutColors = donutChartData.map((d) => {
    if (d.isUnfilled) return CHART_COLORS.unfilled;
    if (d.name.includes('80CCD')) return CHART_COLORS.section80CCD;
    return CHART_COLORS.section80C;
  });

  const hasMonthlyData = chartData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="space-y-6">
      {/* Deadline Banner */}
      <DeadlineBanner dl={dl} />

      {/* Greeting + Readiness */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{greeting}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
          <p className="text-xs text-[var(--text-light)] mt-1">
            AY {currentAY} · FY {currentFY}
          </p>
        </div>

        {summaryLoading ? (
          <div className="w-[120px]"><SkeletonLoader variant="card" /></div>
        ) : (
          <ReadinessSection
            readiness={readiness}
            expanded={readinessExpanded}
            onToggle={() => setReadinessExpanded((v) => !v)}
          />
        )}
      </div>

      {/* Onboarding Checklist */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingChecklist
            onDismiss={() => useOnboardingStore.getState().dismiss()}
            onStepClick={(path) => navigate(path)}
          />
        )}
      </AnimatePresence>

      {/* Readiness 100% celebration */}
      {readiness.percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4 text-center"
        >
          <Sparkles size={20} className="inline text-[var(--color-success)] mr-2" />
          <span className="text-sm font-semibold text-[var(--color-success)]">
            You're all set! Filing should take just minutes.
          </span>
        </motion.div>
      )}

      {/* Streak + Achievement Badges */}
      {hasFinancialData && (
        <div className="space-y-3">
          {currentStreak > 0 && (
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              🔥 {currentStreak}-month streak
            </p>
          )}
          <AchievementBadges userData={badgeData} />
        </div>
      )}

      {/* Quick Actions — Adaptive based on user state */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Contextual first action */}
        {filings.some((f) => f.lifecycleState === 'draft') ? (
          <ActionCard
            label="Continue Filing"
            description="Resume your draft"
            icon={FileText}
            iconColor="#D4AF37"
            bgColor="#FBF5E4"
            onClick={() => {
              const draft = filings.find((f) => f.lifecycleState === 'draft');
              const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[draft?.itrType] || 'itr1';
              navigate(draft ? `/filing/${draft.id}/${route}` : '/filing/start');
            }}
          />
        ) : dl.daysLeft <= 30 && !dl.isPastDue ? (
          <ActionCard
            label={`File Before ${dl.label}`}
            description={`${dl.daysLeft} days left`}
            icon={FileText}
            iconColor="#DC2626"
            bgColor="#FEF2F2"
            onClick={() => navigate('/filing/start')}
          />
        ) : readiness.percentage < 50 ? (
          <ActionCard
            label="Complete Setup"
            description="Boost your readiness"
            icon={Sparkles}
            iconColor="#D4AF37"
            bgColor="#FBF5E4"
            onClick={() => navigate('/finance/income')}
          />
        ) : (
          <ActionCard
            label="File ITR"
            description="Start a new filing"
            icon={FileText}
            iconColor="#D4AF37"
            bgColor="#FBF5E4"
            onClick={() => navigate('/filing/start')}
          />
        )}
        <ActionCard
          label="Log Income"
          description="Add salary or earnings"
          icon={TrendingUp}
          iconColor="#0D9488"
          bgColor="#F0FDFA"
          onClick={() => navigate('/finance/income')}
        />
        <ActionCard
          label="Add Expense"
          description="Record a deductible expense"
          icon={Receipt}
          iconColor="#7C3AED"
          bgColor="#F5F3FF"
          onClick={() => navigate('/finance/expenses')}
        />
        <ActionCard
          label="Upload Document"
          description="Add Form 16 or receipts"
          icon={Upload}
          iconColor="#CA8A04"
          bgColor="#FEFCE8"
          onClick={() => navigate('/vault')}
        />
      </div>

      {/* Financial Summary Metrics — Adaptive based on userProfile */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonLoader variant="metric" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label={summary?.userProfile === 'freelancer' ? 'Gross Receipts' : 'Total Income'}
            value={fin.totalIncome || 0}
            icon={TrendingUp}
          />
          <MetricCard
            label={summary?.userProfile === 'freelancer' ? 'Business Expenses' : 'Total Deductions'}
            value={fin.totalDeductions || 0}
            icon={Receipt}
          />
          <MetricCard label="Estimated Tax" value={fin.estimatedTax || 0} icon={FileText} />
          <MetricCard
            label={summary?.userProfile === 'freelancer' ? 'Advance Tax Paid' : 'TDS Paid'}
            value={fin.tdsPaid || 0}
            icon={CheckCircle}
          />
        </div>
      )}

      {/* Charts Row — 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Overview */}
        <MonthlyOverviewSection
          chartData={chartData}
          hasData={hasMonthlyData}
          isCompact={isCompact}
          isLoading={summaryLoading}
        />

        {/* Investment Progress */}
        <InvestmentProgressSection
          donutChartData={donutChartData}
          donutColors={donutColors}
          donutData={donutData}
          hasData={hasInvestmentData}
          isCompact={isCompact}
          isLoading={summaryLoading}
        />
      </div>

      {/* Filings + Recent Activity — 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FilingsSection filings={filings} isLoading={filingsLoading} navigate={navigate} />
        <RecentActivitySection activity={recentActivity} isLoading={summaryLoading} />
      </div>

      {/* Empty state CTA when no data at all */}
      {!summaryLoading && !hasFinancialData && !showOnboarding && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-8 text-center">
          <FileText size={40} className="mx-auto text-[var(--border-medium)] mb-3" />
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Ready to take control of your finances? Start by logging your first income or filing your return.
          </p>
          <button
            onClick={() => navigate('/filing/start')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            Get Started
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Deadline Banner ── */
function DeadlineBanner({ dl }) {
  if (!dl.isPastDue && dl.daysLeft > 120) return null;

  if (dl.isPastDue) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-4 py-2.5 text-sm text-[var(--color-error)]">
        <AlertCircle size={16} className="shrink-0" />
        <span>
          Deadline passed ({dl.label}). You can still file a belated return, but interest under Section 234A may apply.
        </span>
      </div>
    );
  }

  const isUrgent = dl.daysLeft <= 30;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${
        isUrgent
          ? 'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error)]'
          : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
      }`}
    >
      <Clock size={16} className="shrink-0" />
      <span>
        Filing deadline: {dl.label} · {dl.daysLeft} days left
        {isUrgent ? ' — file now to avoid late fees' : ''}
      </span>
    </div>
  );
}

/* ── Readiness Section ── */
function ReadinessSection({ readiness, expanded, onToggle }) {
  return (
    <div className="flex flex-col items-center lg:items-end gap-2">
      <ProgressRing percentage={readiness.percentage} size={100} strokeWidth={7} />
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        {expanded ? 'Hide' : 'Show'} breakdown
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full lg:w-72 overflow-hidden"
          >
            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-3 space-y-2">
              {readiness.components?.map((c) => (
                <div key={c.key} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-light)]">{c.weight}%</span>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        c.status === 'complete'
                          ? 'bg-[var(--color-success)]'
                          : c.status === 'partial'
                            ? 'bg-[var(--color-warning)]'
                            : 'bg-[var(--border-medium)]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top missing suggestions */}
            {readiness.percentage < 50 && readiness.topMissing?.length > 0 && (
              <div className="mt-2 space-y-1">
                {readiness.topMissing.map((m) => (
                  <div key={m.key} className="text-xs text-[var(--brand-primary)] font-medium">
                    → {m.label}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Monthly Overview Section ── */
function MonthlyOverviewSection({ chartData, hasData, isCompact, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5">
        <SkeletonLoader variant="chart" />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-[var(--text-light)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Monthly Overview</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 size={32} className="text-[var(--border-medium)] mb-2" />
          <p className="text-xs text-[var(--text-muted)]">
            Start logging income and expenses to see your monthly overview
          </p>
        </div>
      ) : isCompact ? (
        <MonthlyCompactSummary chartData={chartData} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #E8E8E4)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-light, #999)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-light, #999)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              width={40}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="income" fill={CHART_COLORS.income} radius={[3, 3, 0, 0]} name="Income" />
            <Bar dataKey="expense" fill={CHART_COLORS.expense} radius={[3, 3, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {hasData && !isCompact && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.income }} />
            Income
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.expense }} />
            Expenses
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Monthly compact summary for < 480px ── */
function MonthlyCompactSummary({ chartData }) {
  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] p-3">
        <span className="text-xs text-[var(--text-muted)]">Total Income</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCompact(totalIncome)}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] p-3">
        <span className="text-xs text-[var(--text-muted)]">Total Expenses</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCompact(totalExpense)}</span>
      </div>
    </div>
  );
}

/* ── Investment Progress Section ── */
function InvestmentProgressSection({ donutChartData, donutColors, donutData, hasData, isCompact, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5">
        <SkeletonLoader variant="chart" />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={16} className="text-[var(--text-light)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Investment Progress</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <PieChartIcon size={32} className="text-[var(--border-medium)] mb-2" />
          <p className="text-xs text-[var(--text-muted)]">
            Your deduction progress at a glance
          </p>
        </div>
      ) : isCompact ? (
        <InvestmentCompactSummary donutData={donutData} />
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={donutChartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {donutChartData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {donutData.map((d) => (
              <div key={d.name} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[var(--text-secondary)] font-medium">{d.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {formatCompact(d.value)} / {formatCompact(d.limit)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--bg-muted)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, d.limit > 0 ? (d.value / d.limit) * 100 : 0)}%`,
                      background: d.name.includes('80CCD') ? CHART_COLORS.section80CCD : CHART_COLORS.section80C,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Investment compact summary for < 480px ── */
function InvestmentCompactSummary({ donutData }) {
  return (
    <div className="space-y-2">
      {donutData.map((d) => (
        <div key={d.name} className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] p-3">
          <span className="text-xs text-[var(--text-muted)]">{d.name}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {formatCompact(d.value)} / {formatCompact(d.limit)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Filings Section ── */
function FilingsSection({ filings, isLoading, navigate }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Your Filings</h3>
        <span className="text-xs text-[var(--text-light)]">{filings.length}</span>
      </div>

      {isLoading ? (
        <div className="p-4"><SkeletonLoader variant="list-row" count={2} /></div>
      ) : filings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText size={32} className="text-[var(--border-medium)] mb-2" />
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Ready to file? It takes about 15 minutes for most salaried individuals.
          </p>
          <button
            onClick={() => navigate('/filing/start')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            Start Filing
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--bg-muted)]">
          {filings.map((f) => {
            const st = STATE_MAP[f.lifecycleState] || STATE_MAP.draft;
            const StIcon = STATE_ICONS[f.lifecycleState] || Clock;
            const isSubmitted = f.lifecycleState === 'eri_success' || f.lifecycleState === 'submitted_to_eri';
            const isRevised = f.filingType === 'revised';
            const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[f.itrType] || 'itr1';

            return (
              <div
                key={f.id}
                onClick={() => navigate(`/filing/${f.id}/${route}`)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} className="text-[var(--text-light)] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">AY {f.assessmentYear}</span>
                      {isRevised && (
                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">REVISED</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-light)]">
                      {f.taxpayerPan} · {f.itrType || 'ITR-1'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSubmitted && !isRevised && (
                    <button
                      className="text-[11px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-purple-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/filing/start', { state: { revised: true, assessmentYear: f.assessmentYear, taxpayerPan: f.taxpayerPan } });
                      }}
                    >
                      <RefreshCw size={10} /> Revise
                    </button>
                  )}
                  {f.lifecycleState === 'draft' && (
                    <button
                      className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]30 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/filing/${f.id}/${route}`);
                      }}
                    >
                      Continue Filing
                    </button>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.bgClass}`}>
                    <StIcon size={11} /> {st.label}
                  </span>
                  <ArrowRight size={14} className="text-[var(--border-medium)]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Recent Activity Section ── */
function RecentActivitySection({ activity, isLoading }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-light)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h3>
      </div>

      {isLoading ? (
        <div className="p-4"><SkeletonLoader variant="list-row" count={3} /></div>
      ) : activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Clock size={28} className="text-[var(--border-medium)] mb-2" />
          <p className="text-xs text-[var(--text-muted)]">No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--bg-muted)]">
          {activity.slice(0, 5).map((event, i) => (
            <div key={event.id || i} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--brand-primary)] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--text-secondary)]">{event.description || event.message}</p>
                <p className="text-[10px] text-[var(--text-light)] mt-0.5">
                  {event.createdAt
                    ? new Date(event.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
