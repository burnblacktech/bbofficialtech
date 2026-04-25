/**
 * financeService — API methods for all finance endpoints.
 *
 * Income, Expense, Investment CRUD + summaries,
 * Readiness Score, Dashboard Summary, and Tax Tips.
 */
import api from './api';

// ── Income ──

export async function getIncome(fy) {
  const res = await api.get('/finance/income', { params: { fy } });
  return res.data.data;
}

export async function getIncomeSummary(fy) {
  const res = await api.get('/finance/income/summary', { params: { fy } });
  return res.data.data;
}

export async function createIncome(data) {
  const res = await api.post('/finance/income', data);
  return res.data.data;
}

export async function updateIncome(id, data) {
  const res = await api.put(`/finance/income/${id}`, data);
  return res.data.data;
}

export async function deleteIncome(id) {
  await api.delete(`/finance/income/${id}`);
}

// ── Expenses ──

export async function getExpenses(fy) {
  const res = await api.get('/finance/expenses', { params: { fy } });
  return res.data.data;
}

export async function getExpensesSummary(fy) {
  const res = await api.get('/finance/expenses/summary', { params: { fy } });
  return res.data.data;
}

export async function createExpense(data) {
  const res = await api.post('/finance/expenses', data);
  return res.data.data;
}

export async function updateExpense(id, data) {
  const res = await api.put(`/finance/expenses/${id}`, data);
  return res.data.data;
}

export async function deleteExpense(id) {
  await api.delete(`/finance/expenses/${id}`);
}

// ── Investments ──

export async function getInvestments(fy) {
  const res = await api.get('/finance/investments', { params: { fy } });
  return res.data.data;
}

export async function getInvestmentsSummary(fy) {
  const res = await api.get('/finance/investments/summary', { params: { fy } });
  return res.data.data;
}

export async function createInvestment(data) {
  const res = await api.post('/finance/investments', data);
  return res.data.data;
}

export async function updateInvestment(id, data) {
  const res = await api.put(`/finance/investments/${id}`, data);
  return res.data.data;
}

export async function deleteInvestment(id) {
  await api.delete(`/finance/investments/${id}`);
}

// ── Readiness Score ──

export async function getReadinessScore(fy) {
  const res = await api.get('/finance/readiness', { params: { fy } });
  return res.data.data;
}

// ── Dashboard Summary ──

export async function getDashboardSummary(fy) {
  const res = await api.get('/finance/dashboard-summary', { params: { fy } });
  return res.data.data;
}

// ── Tax Tips ──

export async function getTaxTips(context) {
  const res = await api.get('/finance/tax-tips', { params: { context } });
  return res.data.data;
}

export async function dismissTaxTip(tipId) {
  const res = await api.post(`/finance/tax-tips/${tipId}/dismiss`);
  return res.data;
}
