import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt, Plus, Pencil, Trash2, ChevronDown, AlertTriangle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import useFinanceFilterStore from '../../store/useFinanceFilterStore';
import { getExpenses, getExpensesSummary, createExpense, updateExpense, deleteExpense, getTaxTips, dismissTaxTip } from '../../services/financeService';
import { formatCurrency } from '../../utils/formatCurrency';
import BottomSheet from '../../components/Shared/BottomSheet';
import TaxWhisper from '../../components/Shared/TaxWhisper';
import SkeletonLoader from '../../components/Shared/SkeletonLoader';

// ── Constants ──

/* eslint-disable camelcase */
const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'medical', label: 'Medical' },
  { value: 'donations', label: 'Donations' },
  { value: 'education_loan', label: 'Education Loan Interest' },
  { value: 'insurance', label: 'Insurance Premium' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  rent: 'var(--color-rent, #7C3AED)',
  medical: 'var(--color-medical, #DC2626)',
  donations: 'var(--color-donations, #16A34A)',
  education_loan: 'var(--color-education, #3B82F6)',
  insurance: 'var(--color-insurance, #F59E0B)',
  other: '#999999',
};

const EXPENSE_TO_DEDUCTION = {
  rent: 'HRA',
  medical: '80D',
  donations: '80G',
  education_loan: '80E',
  insurance: '80C',
  other: null,
};

const DEDUCTION_LIMITS = {
  '80C': 150000,
  '80CCD(1B)': 50000,
  '80D': 75000,
  '80G': null,
  '80E': null,
  HRA: null,
};

// ── Zod Schema ──

const expenseSchema = z.object({
  category: z.enum(['rent', 'medical', 'donations', 'education_loan', 'insurance', 'other'], {
    required_error: 'Category is required',
  }),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  datePaid: z.string().min(1, 'Date is required'),
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

export default function ExpenseTracker() {
  const { selectedFY, setFY } = useFinanceFilterStore();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // ── Queries ──

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['expenses', selectedFY],
    queryFn: () => getExpenses(selectedFY),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary', selectedFY],
    queryFn: () => getExpensesSummary(selectedFY),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tax-tips', 'expenses'],
    queryFn: () => getTaxTips('expenses'),
  });

  const tip = tips?.[0] || null;

  // ── Mutations ──

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['expenses', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['expenses-summary', selectedFY] });
    queryClient.invalidateQueries({ queryKey: ['readiness-score'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }, [queryClient, selectedFY]);

  const createMutation = useMutation({
    mutationFn: createExpense,
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', selectedFY] });
      const prev = queryClient.getQueryData(['expenses', selectedFY]);
      queryClient.setQueryData(['expenses', selectedFY], (old = []) => [
        { id: 'optimistic-' + Date.now(), ...newEntry, createdAt: new Date().toISOString() },
        ...old,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['expenses', selectedFY], ctx.prev);
      toast.error('Failed to save expense entry');
    },
    onSuccess: () => {
      toast.success('Expense entry saved');
      invalidate();
    },
    onSettled: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      toast.success('Expense entry updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update expense entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', selectedFY] });
      const prev = queryClient.getQueryData(['expenses', selectedFY]);
      queryClient.setQueryData(['expenses', selectedFY], (old = []) => old.filter((e) => e.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['expenses', selectedFY], ctx.prev);
      toast.error('Failed to delete expense entry');
    },
    onSuccess: () => {
      toast.success('Expense entry deleted');
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
    if (window.confirm('Delete this expense entry?')) deleteMutation.mutate(id);
  };

  const handleDismissTip = (tipId) => {
    dismissTaxTip(tipId);
    queryClient.invalidateQueries({ queryKey: ['tax-tips', 'expenses'] });
  };

  // ── Sorted entries ──

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.datePaid || b.date_paid) - new Date(a.datePaid || a.date_paid)),
    [entries],
  );

  const totalExpenses = summary?.totalExpenses ?? sortedEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const byCategory = summary?.byCategory || [];

  const fyOptions = useMemo(() => getFYOptions(), []);

  // ── Render ──

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-0">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt size={22} className="text-[var(--brand-primary)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Expense Tracker</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: 12 }}
            >
              <Calendar size={14} />
              Year-Round Tracking
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Record tax-relevant expenses as they happen</p>
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
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Tax Whisper */}
      {tip && (
        <TaxWhisper tipId={tip.id} title={tip.title} message={tip.message} learnMore={tip.learnMore} onDismiss={handleDismissTip} />
      )}

      {/* Summary Bar */}
      {!entriesLoading && sortedEntries.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
          <div className="text-sm font-medium text-[var(--text-secondary)]">Total Expenses YTD</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            {formatCurrency(totalExpenses)}
          </div>
          {byCategory.length > 0 && (
            <div className="mt-3 space-y-2">
              {byCategory.map((c) => {
                const cat = c.category;
                const section = EXPENSE_TO_DEDUCTION[cat];
                const limit = section ? DEDUCTION_LIMITS[section] : null;
                const total = parseFloat(c.total || c.totalAmount || 0);
                const nearLimit = limit && total >= limit * 0.9;
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#999' }} />
                    <span className="font-medium">{CATEGORIES.find((t) => t.value === cat)?.label || cat}</span>
                    {section && <span className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-[10px]">{section}</span>}
                    <span>{formatCurrency(total)}</span>
                    {limit && <span className="text-[var(--text-light)]">/ {formatCurrency(limit)}</span>}
                    {nearLimit && (
                      <span className="flex items-center gap-0.5 rounded bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-warning)]">
                        <AlertTriangle size={10} />
                        {total >= limit ? 'Limit reached' : '≥90% of limit'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {entriesLoading && <SkeletonLoader variant="list-row" count={5} />}

      {/* Empty State */}
      {!entriesLoading && sortedEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-medium)] py-16 text-center">
          <Receipt size={40} className="mb-3 text-[var(--text-light)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Track expenses, unlock deductions</h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
            Record rent, medical bills, and donations as they happen. We'll map them to the right deduction sections automatically.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
          >
            <Plus size={16} />
            Add First Expense
          </button>
        </div>
      )}

      {/* Entry List */}
      {!entriesLoading && sortedEntries.length > 0 && (
        <div className="space-y-2">
          {sortedEntries.map((entry) => {
            const date = entry.datePaid || entry.date_paid;
            const cat = entry.category;
            const section = entry.deductionSection || entry.deduction_section || EXPENSE_TO_DEDUCTION[cat];
            const isLocked = !!entry.usedInFilingId || !!entry.used_in_filing_id;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#999' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {CATEGORIES.find((t) => t.value === cat)?.label || cat}
                    </span>
                    {section && (
                      <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{section}</span>
                    )}
                    {isLocked && (
                      <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">Used in filing</span>
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
      )}

      {/* Add/Edit BottomSheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => { setSheetOpen(false); setEditingEntry(null); }} title={editingEntry ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm
          defaultValues={editingEntry}
          onSubmit={handleSubmit}
          onCancel={() => { setSheetOpen(false); setEditingEntry(null); }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </BottomSheet>
    </div>
  );
}

// ── Expense Form ──

function ExpenseForm({ defaultValues, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: defaultValues?.category || '',
      amount: defaultValues ? parseFloat(defaultValues.amount) : undefined,
      datePaid: defaultValues?.datePaid || defaultValues?.date_paid || '',
      description: defaultValues?.description || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category */}
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Category</label>
        <select
          id="category"
          {...register('category')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.category.message}</p>}
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

      {/* Date Paid */}
      <div>
        <label htmlFor="datePaid" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Date Paid</label>
        <input
          id="datePaid"
          type="date"
          {...register('datePaid')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.datePaid && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.datePaid.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Description (optional)</label>
        <input
          id="description"
          type="text"
          maxLength={500}
          placeholder="e.g. Monthly rent payment"
          {...register('description')}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        />
        {errors.description && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.description.message}</p>}
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
