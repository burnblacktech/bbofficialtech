import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, Plus, Pencil, Trash2, ChevronDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import useFinanceFilterStore from '../../store/useFinanceFilterStore';
import { getIncome, getIncomeSummary, createIncome, updateIncome, deleteIncome, getTaxTips, dismissTaxTip } from '../../services/financeService';
import { formatCurrency } from '../../utils/formatCurrency';
import BottomSheet from '../../components/Shared/BottomSheet';
import TaxWhisper from '../../components/Shared/TaxWhisper';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';
import DocumentImport from '../../components/Shared/DocumentImport';

// ── Constants ──

// eslint-disable-next-line camelcase
const SOURCE_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'rental', label: 'Rental' },
  { value: 'interest', label: 'Interest' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'capital_gain', label: 'Capital Gain' },
  { value: 'other', label: 'Other' },
];

/* eslint-disable camelcase */
const SOURCE_COLORS = {
  salary: 'var(--color-salary, #D4AF37)',
  freelance: 'var(--color-freelance, #0D9488)',
  rental: 'var(--color-rental, #7C3AED)',
  interest: 'var(--color-interest, #3B82F6)',
  dividend: 'var(--color-dividend, #F59E0B)',
  capital_gain: 'var(--color-capital-gain, #EC4899)',
  other: '#999999',
};
/* eslint-enable camelcase */

// ── Zod Schema ──

/* eslint-disable camelcase */
const incomeSchema = z.object({
  sourceType: z.enum(['salary', 'freelance', 'rental', 'interest', 'dividend', 'capital_gain', 'other'], {
    required_error: 'Source type is required',
  }),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  dateReceived: z.string().min(1, 'Date is required'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
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

export default function IncomeTracker() {
  const { selectedFY, setFY } = useFinanceFilterStore();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // ── Queries ──

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['income', selectedFY],
    queryFn: () => getIncome(selectedFY),
  });

  const { data: summary } = useQuery({
    queryKey: ['income-summary', selectedFY],
    queryFn: () => getIncomeSummary(selectedFY),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tax-tips', 'income'],
    queryFn: () => getTaxTips('income'),
  });

  const tip = tips?.[0] || null;

  // ── Mutations ──

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['income', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['income-summary', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['readiness-score'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }, [queryClient, selectedFY]);

  const createMutation = useMutation({
    mutationFn: createIncome,
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ['income', selectedFY] });
      const prev = queryClient.getQueryData(['income', selectedFY]);
      queryClient.setQueryData(['income', selectedFY], (old = []) => [
        { id: 'optimistic-' + Date.now(), ...newEntry, createdAt: new Date().toISOString() },
        ...old,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['income', selectedFY], ctx.prev);
      toast.error('Failed to save income entry');
    },
    onSuccess: () => {
      toast.success('Income entry saved');
      invalidate();
    },
    onSettled: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateIncome(id, data),
    onSuccess: () => {
      toast.success('Income entry updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update income entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['income', selectedFY] });
      const prev = queryClient.getQueryData(['income', selectedFY]);
      queryClient.setQueryData(['income', selectedFY], (old = []) => old.filter((e) => e.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['income', selectedFY], ctx.prev);
      toast.error('Failed to delete income entry');
    },
    onSuccess: () => {
      toast.success('Income entry deleted');
      invalidate();
    },
    onSettled: () => invalidate(),
  });

  // ── Handlers ──

  const openAdd = () => {
    setEditingEntry(null);
    setSheetOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setSheetOpen(true);
  };

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
    if (window.confirm('Delete this income entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDismissTip = (tipId) => {
    dismissTaxTip(tipId);
    queryClient.invalidateQueries({ queryKey: ['tax-tips', 'income'] });
  };

  // ── Sorted entries ──

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.dateReceived || b.date_received) - new Date(a.dateReceived || a.date_received)),
    [entries],
  );

  const totalIncome = summary?.totalIncome ?? sortedEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const bySource = summary?.bySource || [];

  const fyOptions = useMemo(() => getFYOptions(), []);

  // ── Render ──

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-0">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={22} className="text-[var(--brand-primary)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Income Tracker</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: 12 }}
            >
              <Calendar size={14} />
              Year-Round Tracking
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Track your earnings throughout the year</p>
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
            <span>Add Income</span>
          </button>
          <DocumentImport
            type="salary"
            buttonLabel="Import Salary Slip"
            onImportComplete={(data) => {
              setEditingEntry(null);
              setSheetOpen(true);
              // Pre-fill will be handled by the form's defaultValues
            }}
          />
        </div>
      </div>

      {/* Tax Whisper */}
      {tip && (
        <TaxWhisper
          tipId={tip.id}
          title={tip.title}
          message={tip.message}
          learnMore={tip.learnMore}
          onDismiss={handleDismissTip}
        />
      )}

      {/* Summary Bar */}
      {!entriesLoading && sortedEntries.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
          <div className="text-sm font-medium text-[var(--text-secondary)]">Total Income YTD</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            {formatCurrency(totalIncome)}
          </div>
          {bySource.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {bySource.map((s) => (
                <span key={s.sourceType || s.source_type} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SOURCE_COLORS[s.sourceType || s.source_type] || '#999' }}
                  />
                  {SOURCE_TYPES.find((t) => t.value === (s.sourceType || s.source_type))?.label || s.sourceType || s.source_type}:{' '}
                  {formatCurrency(parseFloat(s.total || s.totalAmount || 0))}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {entriesLoading && <SkeletonLoader variant="list-row" count={5} />}

      {/* Empty State */}
      {!entriesLoading && sortedEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-medium)] py-16 text-center">
          <TrendingUp size={40} className="mb-3 text-[var(--text-light)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your income story starts here</h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
            Log your first salary credit or freelance payment. BurnBlack will track it all year so filing is effortless.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
          >
            <Plus size={16} />
            Log First Income
          </button>
        </div>
      )}

      {/* Entry List */}
      {!entriesLoading && sortedEntries.length > 0 && (
        <div className="space-y-2">
          {sortedEntries.map((entry) => {
            const date = entry.dateReceived || entry.date_received;
            const source = entry.sourceType || entry.source_type;
            const isLocked = !!entry.usedInFilingId || !!entry.used_in_filing_id;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[source] || '#999' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {SOURCE_TYPES.find((t) => t.value === source)?.label || source}
                    </span>
                    {isLocked && (
                      <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                        Used in filing
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    {entry.description ? ` · ${entry.description}` : ''}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                    {formatCurrency(parseFloat(entry.amount))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    disabled={isLocked}
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                    aria-label="Edit entry"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={isLocked}
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit BottomSheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => { setSheetOpen(false); setEditingEntry(null); }} title={editingEntry ? 'Edit Income' : 'Add Income'}>
        <IncomeForm
          defaultValues={editingEntry}
          onSubmit={handleSubmit}
          onCancel={() => { setSheetOpen(false); setEditingEntry(null); }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          selectedFY={selectedFY}
        />
      </BottomSheet>
    </div>
  );
}

// ── Income Form ──

function IncomeForm({ defaultValues, onSubmit, onCancel, isSubmitting, selectedFY }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      sourceType: defaultValues?.sourceType || defaultValues?.source_type || '',
      amount: defaultValues ? parseFloat(defaultValues.amount) : undefined,
      dateReceived: defaultValues?.dateReceived || defaultValues?.date_received || '',
      description: defaultValues?.description || '',
    },
  });

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Source Type */}
      <div>
        <label htmlFor="sourceType" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          Source Type
        </label>
        <select
          id="sourceType"
          {...register('sourceType')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        >
          <option value="">Select source type</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.sourceType && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.sourceType.message}</p>}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          Amount (₹)
        </label>
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

      {/* Date Received */}
      <div>
        <label htmlFor="dateReceived" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          Date Received
        </label>
        <input
          id="dateReceived"
          type="date"
          {...register('dateReceived')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.dateReceived && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.dateReceived.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          maxLength={500}
          placeholder="e.g. June salary"
          {...register('description')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.description && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.description.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-light)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2"
        >
          {isSubmitting && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {defaultValues ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
