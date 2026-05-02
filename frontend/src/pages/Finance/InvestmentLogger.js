import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PiggyBank, Plus, Pencil, Trash2, ChevronDown, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import useFinanceFilterStore from '../../store/useFinanceFilterStore';
import {
  getInvestments,
  getInvestmentsSummary,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getTaxTips,
  dismissTaxTip,
} from '../../services/financeService';
import { formatCurrency } from '../../utils/formatCurrency';
import BottomSheet from '../../components/Shared/BottomSheet';
import TaxWhisper from '../../components/Shared/TaxWhisper';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';
import DocumentImport from '../../components/Shared/DocumentImport';

// ── Constants ──

const INVESTMENT_TYPES = [
  { value: 'ppf', label: 'PPF', section: '80C' },
  { value: 'elss', label: 'ELSS', section: '80C' },
  { value: 'nps', label: 'NPS', section: '80CCD(1B)' },
  { value: 'lic', label: 'LIC', section: '80C' },
  { value: 'sukanya', label: 'Sukanya Samriddhi', section: '80C' },
  { value: 'tax_fd', label: 'Tax-Saving FD', section: '80C' },
  { value: 'ulip', label: 'ULIP', section: '80C' },
  { value: 'other_80c', label: 'Other 80C', section: '80C' },
  { value: '80ccd_1b_nps', label: '80CCD(1B) NPS', section: '80CCD(1B)' },
];

const SECTION_COLORS = {
  '80C': 'var(--color-80c, #D4AF37)',
  '80CCD(1B)': 'var(--color-80ccd, #0D9488)',
};

const DEDUCTION_LIMITS = {
  '80C': 150000,
  '80CCD(1B)': 50000,
};

const TAX_RATE = 0.3; // Approximate highest slab rate for tax saved estimate

// ── Zod Schema ──

/* eslint-disable camelcase */
const investmentSchema = z.object({
  investmentType: z.enum(
    ['ppf', 'elss', 'nps', 'lic', 'sukanya', 'tax_fd', 'ulip', 'other_80c', '80ccd_1b_nps'],
    { required_error: 'Investment type is required' },
  ),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  dateOfInvestment: z.string().min(1, 'Date is required'),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
});
/* eslint-enable camelcase */

// ── FY Options ──

function getFYOptions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const options = [];
  for (let i = 0; i < 3; i++) {
    const sy = startYear - i;
    options.push(`${sy}-${String(sy + 1).slice(-2)}`);
  }
  return options;
}

// ── Component ──

export default function InvestmentLogger() {
  const { selectedFY, setFY } = useFinanceFilterStore();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // ── Queries ──

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['investments', selectedFY],
    queryFn: () => getInvestments(selectedFY),
  });

  const { data: summary } = useQuery({
    queryKey: ['investments-summary', selectedFY],
    queryFn: () => getInvestmentsSummary(selectedFY),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tax-tips', 'investments'],
    queryFn: () => getTaxTips('investments'),
  });

  const tip = tips?.[0] || null;

  // ── Mutations ──

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['investments', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['investments-summary', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['readiness-score'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }, [queryClient, selectedFY]);

  const createMutation = useMutation({
    mutationFn: createInvestment,
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ['investments', selectedFY] });
      const prev = queryClient.getQueryData(['investments', selectedFY]);
      queryClient.setQueryData(['investments', selectedFY], (old = []) => [
        { id: 'optimistic-' + Date.now(), ...newEntry, createdAt: new Date().toISOString() },
        ...old,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['investments', selectedFY], ctx.prev);
      toast.error('Failed to save investment entry');
    },
    onSuccess: () => {
      toast.success('Investment entry saved');
      invalidate();
    },
    onSettled: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateInvestment(id, data),
    onSuccess: () => {
      toast.success('Investment entry updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update investment entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvestment,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['investments', selectedFY] });
      const prev = queryClient.getQueryData(['investments', selectedFY]);
      queryClient.setQueryData(['investments', selectedFY], (old = []) => old.filter((e) => e.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['investments', selectedFY], ctx.prev);
      toast.error('Failed to delete investment entry');
    },
    onSuccess: () => {
      toast.success('Investment entry deleted');
      invalidate();
    },
    onSettled: () => invalidate(),
  });

  // ── Handlers ──

  const openAdd = () => { setEditingEntry(null); setSheetOpen(true); };
  const openEdit = (entry) => { setEditingEntry(entry); setSheetOpen(true); };

  const handleSubmit = (data) => {
    const payload = { ...data, financialYear: selectedFY };
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setSheetOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = (id) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this investment entry?')) deleteMutation.mutate(id);
  };

  const handleDismissTip = (tipId) => {
    dismissTaxTip(tipId);
    queryClient.invalidateQueries({ queryKey: ['tax-tips', 'investments'] });
  };

  // ── Group entries by deduction section ──

  const sections = summary?.sections || [];

  const groupedEntries = useMemo(() => {
    const groups = {};
    const allEntries = Array.isArray(entries) ? entries : [];
    allEntries.forEach((e) => {
      const section = e.deductionSection || e.deduction_section || '80C';
      if (!groups[section]) groups[section] = [];
      groups[section].push(e);
    });
    // Sort each group reverse chronological
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) =>
          new Date(b.dateOfInvestment || b.date_of_investment) - new Date(a.dateOfInvestment || a.date_of_investment),
      );
    });
    return groups;
  }, [entries]);

  // Compute tax saved estimate
  const totalTaxSaved = useMemo(() => {
    if (summary?.totalTaxSaved != null) return summary.totalTaxSaved;
    return sections.reduce((sum, s) => {
      const limit = DEDUCTION_LIMITS[s.section] || Infinity;
      return sum + Math.min(parseFloat(s.totalInvested || 0), limit) * TAX_RATE;
    }, 0);
  }, [summary, sections]);

  const fyOptions = useMemo(() => getFYOptions(), []);
  const allEntries = Array.isArray(entries) ? entries : [];

  // ── Render ──

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-0">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PiggyBank size={22} className="text-[var(--brand-primary)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Investments</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: 12 }}
            >
              <Calendar size={14} />
              Year-Round Tracking
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Log investments and track your deduction progress</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => setFY(e.target.value)}
              className="appearance-none rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 pr-8 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
              aria-label="Financial year"
            >
              {fyOptions.map((fy) => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2"
          >
            <Plus size={16} />
            <span>Log Investment</span>
          </button>
          <DocumentImport
            type="investment"
            buttonLabel="Import MF Statement"
            onImportComplete={(data) => {
              setEditingEntry(null);
              setSheetOpen(true);
            }}
          />
        </div>
      </div>

      {/* Tax Whisper */}
      {tip && (
        <TaxWhisper tipId={tip.id} title={tip.title} message={tip.message} learnMore={tip.learnMore} onDismiss={handleDismissTip} />
      )}

      {/* Loading */}
      {entriesLoading && <SkeletonLoader variant="list-row" count={5} />}

      {/* Empty State */}
      {!entriesLoading && allEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-medium)] py-16 text-center">
          <PiggyBank size={40} className="mb-3 text-[var(--text-light)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Investments = tax savings</h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
            Log your PPF, ELSS, NPS, and other investments. We'll show you exactly how much tax you're saving under 80C and 80CCD.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
          >
            <Plus size={16} />
            Log First Investment
          </button>
        </div>
      )}

      {/* Section Progress + Entries */}
      {!entriesLoading && allEntries.length > 0 && (
        <div className="space-y-4">
          {/* Tax Saved Estimate */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">Estimated Tax Saved</div>
                <div className="mt-1 text-2xl font-bold text-[var(--brand-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {formatCurrency(Math.round(totalTaxSaved))}
                </div>
              </div>
              <PiggyBank size={28} className="text-[var(--brand-primary)] opacity-40" />
            </div>
          </div>

          {/* Sections */}
          {Object.keys(DEDUCTION_LIMITS).map((sectionKey) => {
            const sectionData = sections.find((s) => s.section === sectionKey);
            const totalInvested = parseFloat(sectionData?.totalInvested || 0);
            const limit = DEDUCTION_LIMITS[sectionKey];
            const progress = Math.min(1, totalInvested / limit);
            const isLimitReached = totalInvested >= limit;
            const sectionEntries = groupedEntries[sectionKey] || [];

            if (sectionEntries.length === 0 && !sectionData) return null;

            return (
              <div key={sectionKey}>
                {/* Section Header + Progress */}
                <div className="mb-3 rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Section {sectionKey}</span>
                      {isLimitReached && (
                        <span className="flex items-center gap-1 rounded-full bg-[var(--color-success-bg,#ECFDF5)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success,#16A34A)]">
                          <CheckCircle size={10} />
                          Limit Reached
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatCurrency(totalInvested)} / {formatCurrency(limit)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: SECTION_COLORS[sectionKey] || 'var(--brand-primary)',
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {isLimitReached
                      ? `Tax saved: ${formatCurrency(Math.round(limit * TAX_RATE))}`
                      : `Remaining: ${formatCurrency(limit - totalInvested)}`}
                  </div>
                </div>

                {/* Entries in this section */}
                <div className="space-y-2">
                  {sectionEntries.map((entry) => {
                    const date = entry.dateOfInvestment || entry.date_of_investment;
                    const type = entry.investmentType || entry.investment_type;
                    const isLocked = !!entry.usedInFilingId || !!entry.used_in_filing_id;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: SECTION_COLORS[sectionKey] || '#999' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {INVESTMENT_TYPES.find((t) => t.value === type)?.label || type}
                            </span>
                            {isLocked && (
                              <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                Used in filing
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            {(entry.referenceNumber || entry.reference_number) ? ` · Ref: ${entry.referenceNumber || entry.reference_number}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                            {formatCurrency(parseFloat(entry.amount))}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button type="button" onClick={() => openEdit(entry)} disabled={isLocked}
                            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                            aria-label="Edit entry"><Pencil size={14} /></button>
                          <button type="button" onClick={() => handleDelete(entry.id)} disabled={isLocked}
                            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                            aria-label="Delete entry"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit BottomSheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => { setSheetOpen(false); setEditingEntry(null); }} title={editingEntry ? 'Edit Investment' : 'Log Investment'}>
        <InvestmentForm
          defaultValues={editingEntry}
          onSubmit={handleSubmit}
          onCancel={() => { setSheetOpen(false); setEditingEntry(null); }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </BottomSheet>
    </div>
  );
}

// ── Investment Form ──

function InvestmentForm({ defaultValues, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      investmentType: defaultValues?.investmentType || defaultValues?.investment_type || '',
      amount: defaultValues ? parseFloat(defaultValues.amount) : undefined,
      dateOfInvestment: defaultValues?.dateOfInvestment || defaultValues?.date_of_investment || '',
      referenceNumber: defaultValues?.referenceNumber || defaultValues?.reference_number || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Investment Type */}
      <div>
        <label htmlFor="investmentType" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Investment Type</label>
        <select
          id="investmentType"
          {...register('investmentType')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        >
          <option value="">Select investment type</option>
          {INVESTMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label} ({t.section})</option>
          ))}
        </select>
        {errors.investmentType && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.investmentType.message}</p>}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Amount (₹)</label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...field}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
            />
          )}
        />
        {errors.amount && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.amount.message}</p>}
      </div>

      {/* Date of Investment */}
      <div>
        <label htmlFor="dateOfInvestment" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Date of Investment</label>
        <input
          id="dateOfInvestment"
          type="date"
          {...register('dateOfInvestment')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.dateOfInvestment && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.dateOfInvestment.message}</p>}
      </div>

      {/* Reference Number */}
      <div>
        <label htmlFor="referenceNumber" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Reference / Folio Number (optional)</label>
        <input
          id="referenceNumber"
          type="text"
          maxLength={100}
          placeholder="e.g. FOLIO123456"
          {...register('referenceNumber')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.referenceNumber && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.referenceNumber.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-light)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2">
          {isSubmitting && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {defaultValues ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
