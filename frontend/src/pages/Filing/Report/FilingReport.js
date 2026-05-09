import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../services/api';
import IdentityBand from './IdentityBand';
import IncomeBand from './IncomeBand';
import DeductionsBand from './DeductionsBand';
import ComputationBand from './ComputationBand';
import TaxPaidBand from './TaxPaidBand';
import BankBand from './BankBand';
import FilingFooter from './FilingFooter';
import ReportSidebar from './ReportSidebar';
import MobileBar from './MobileBar';
import './filing-report.css';

export default function FilingReport() {
  const { filingId } = useParams();
  const [regime, setRegime] = useState('new');

  const { data: filing, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: () => api.get(`/filings/${filingId}`).then((r) => r.data),
    enabled: !!filingId,
  });

  const { data: computation, mutate: computeTax } = useMutation({
    mutationFn: (selectedRegime) =>
      api.post(`/filings/${filingId}/itr1/compute`, { regime: selectedRegime }).then((r) => r.data),
  });

  const recompute = useCallback(() => computeTax(regime), [computeTax, regime]);

  const handleBandSave = useCallback(async (section, updates) => {
    const data = filing?.data || filing || {};
    const payload = data.jsonPayload || {};
    const merged = { ...payload, [section]: { ...(payload[section] || {}), ...updates } };
    await api.put(`/filings/${filingId}`, { jsonPayload: merged, version: data.version });
    await refetch();
    recompute();
  }, [filing, filingId, refetch, recompute]);

  const handleRegimeChange = useCallback((r) => {
    setRegime(r);
    computeTax(r);
  }, [computeTax]);

  useEffect(() => { computeTax(regime); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="filing-report" style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading…</div>;
  }

  if (isError) {
    return (
      <div className="filing-report" style={{ padding: 48, textAlign: 'center', color: '#c0392b' }}>
        Failed to load filing{error?.message ? `: ${error.message}` : ''}
      </div>
    );
  }

  const data = filing?.data || filing || {};
  const jp = data.jsonPayload || {};

  if (!data.id && !data.taxpayerPan) {
    return (
      <div className="filing-report" style={{ padding: 48, textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: 16, marginBottom: 8 }}>No filing data yet</p>
        <p style={{ fontSize: 13 }}>Start by adding your income sources to generate your tax report.</p>
      </div>
    );
  }

  // Map filing data to band component shapes
  const identity = {
    name: jp.personalInfo?.firstName ? `${jp.personalInfo.firstName} ${jp.personalInfo.lastName || ''}`.trim() : (data.taxpayerPan || ''),
    pan: data.taxpayerPan,
    panVerified: true,
    assessmentYear: data.assessmentYear,
  };

  const incomes = [];
  if (jp.income?.salary?.employers?.length) {
    for (const emp of jp.income.salary.employers) {
      incomes.push({ label: `Salary — ${emp.name || 'Employer'}`, type: 'salary', amount: emp.grossSalary || 0 });
    }
  }
  if (jp.income?.houseProperty?.type && jp.income.houseProperty.type !== 'NONE') {
    incomes.push({ label: 'House Property', type: 'houseProperty', amount: jp.income.houseProperty.annualRentReceived || -(jp.income.houseProperty.interestOnHomeLoan || 0) });
  }
  if (jp.income?.otherSources) {
    const os = jp.income.otherSources;
    const osTotal = (os.savingsInterest || 0) + (os.fdInterest || 0) + (os.dividendIncome || 0) + (os.otherIncome || 0) + (os.familyPension || 0);
    if (osTotal > 0) incomes.push({ label: 'Other Sources', type: 'otherSources', amount: osTotal });
  }
  if (jp.income?.capitalGains?.transactions?.length) {
    const cgTotal = jp.income.capitalGains.transactions.reduce((s, t) => s + (t.gain || t.saleValue - t.purchaseValue || 0), 0);
    incomes.push({ label: 'Capital Gains', type: 'capitalGains', amount: cgTotal });
  }

  const deductions = [];
  const d = jp.deductions || {};
  if (d.ppf || d.elss || d.lic || d.epf || d.tuitionFees) deductions.push({ section: '80C', label: 'PPF, ELSS, LIC, EPF', amount: Math.min((d.ppf||0)+(d.elss||0)+(d.lic||0)+(d.epf||0)+(d.tuitionFees||0)+(d.homeLoanPrincipal||0), 150000), limit: 150000 });
  if (d.nps) deductions.push({ section: '80CCD(1B)', label: 'NPS', amount: Math.min(d.nps, 50000), limit: 50000 });
  if (d.section80D) deductions.push({ section: '80D', label: 'Health Insurance', amount: (d.section80D.selfPremium||0)+(d.section80D.parentsPremium||0), limit: 100000 });
  if (d.eduLoan) deductions.push({ section: '80E', label: 'Education Loan', amount: d.eduLoan, limit: null });

  const tdsEntries = [];
  if (jp.income?.salary?.employers?.length) {
    for (const emp of jp.income.salary.employers) {
      if (emp.tdsDeducted) tdsEntries.push({ label: `TDS — ${emp.name || 'Employer'}`, amount: emp.tdsDeducted });
    }
  }

  const bankAccount = jp.bankDetails || jp.bankAccount || null;

  const comp = computation?.data || computation || {};
  const oldTax = comp.oldRegime?.totalTax || 0;
  const newTax = comp.newRegime?.totalTax || 0;
  const recommended = comp.recommended || (oldTax <= newTax ? 'old' : 'new');
  const selectedComp = regime === 'old' ? comp.oldRegime : comp.newRegime;
  const tdsTotal = tdsEntries.reduce((s, t) => s + (t.amount || 0), 0);
  const taxResult = selectedComp ? (tdsTotal - (selectedComp.totalTax || 0)) : 0;
  const isRefund = taxResult > 0;
  const completeness = incomes.length > 0 ? (identity.name !== data.taxpayerPan ? 50 : 30) + (deductions.length > 0 ? 25 : 0) + (bankAccount ? 25 : 0) : 0;

  const sections = [
    { id: 'identity', label: 'Identity', complete: !!identity.name },
    { id: 'income', label: 'Income', complete: incomes.length > 0 },
    { id: 'deductions', label: 'Deductions', complete: deductions.length > 0 },
    { id: 'computation', label: 'Computation', complete: !!selectedComp?.totalTax },
    { id: 'tax-paid', label: 'Tax Paid', complete: tdsEntries.length > 0 },
    { id: 'bank', label: 'Bank Account', complete: !!bankAccount },
  ];

  return (
    <div className="filing-report">
      <div className="fr-ribbon">
        <div
          className={`fr-ribbon__fill ${completeness >= 100 ? 'fr-ribbon__fill--complete' : 'fr-ribbon__fill--partial'}`}
          style={{ width: `${completeness}%` }}
        />
      </div>
      <div style={{ display: 'flex' }}>
        <main className="fr-main">
          <div className="fr-document">
            <header style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fr-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>BurnBlack</div>
                  <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Tax Filing Report</h1>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--fr-muted)' }}>
                    <span>AY {data.assessmentYear || '2025-26'}</span>
                    <span>•</span>
                    <span>{data.itrType || 'ITR-1'}</span>
                    <span>•</span>
                    <span>{regime === 'new' ? 'New' : 'Old'} Regime</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/filing/${filingId}/edit?import=true`} style={{ padding: '8px 16px', background: 'var(--fr-secondary)', color: 'var(--fr-fg)', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', border: '1px solid var(--fr-border)' }}>
                    Import Data
                  </a>
                  <a href={`/filing/${filingId}/edit`} style={{ padding: '8px 16px', background: 'var(--fr-gold)', color: 'var(--fr-bg)', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    Edit Filing
                  </a>
                </div>
              </div>
            </header>
            <IdentityBand data={identity} onSave={(updates) => handleBandSave('personalInfo', updates)} />
            <IncomeBand incomes={incomes} onSave={(updates) => handleBandSave('income', updates)} filingId={filingId} />
            <DeductionsBand deductions={deductions} regime={regime} onSave={(updates) => handleBandSave('deductions', updates)} filingId={filingId} />
            <ComputationBand computation={selectedComp || {}} regime={regime} onRegimeChange={handleRegimeChange} />
            <TaxPaidBand tdsEntries={tdsEntries} onSave={(updates) => handleBandSave('taxes', updates)} />
            <BankBand bankAccount={bankAccount} onSave={(updates) => handleBandSave('bankDetails', updates)} filingId={filingId} />
            <FilingFooter completeness={completeness} filingId={filingId} />
          </div>
        </main>
        <ReportSidebar
          taxResult={taxResult}
          isRefund={isRefund}
          regime={regime}
          onRegimeChange={handleRegimeChange}
          completeness={completeness}
          sections={sections}
          filingId={filingId}
        />
      </div>
      <MobileBar taxResult={taxResult} isRefund={isRefund} completeness={completeness} />
    </div>
  );
}
