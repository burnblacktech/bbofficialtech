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

  const { data: filing, isLoading } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: () => api.get(`/filings/${filingId}`).then((r) => r.data),
  });

  const { data: computation, mutate: computeTax } = useMutation({
    mutationFn: (selectedRegime) =>
      api.post(`/filings/${filingId}/itr1/compute`, { regime: selectedRegime }).then((r) => r.data),
  });

  const handleRegimeChange = useCallback((r) => {
    setRegime(r);
    computeTax(r);
  }, [computeTax]);

  useEffect(() => { computeTax(regime); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="filing-report" style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading…</div>;
  }

  const data = filing?.data || filing || {};
  const comp = computation?.data || computation || {};
  const completeness = comp.completeness || data.completeness || 0;
  const taxResult = comp.taxPayable ?? comp.refund ?? 0;
  const isRefund = (comp.refund && comp.refund > 0) || taxResult < 0;

  const sections = [
    { id: 'identity', label: 'Identity', complete: !!data.pan },
    { id: 'income', label: 'Income', complete: (data.incomes?.length || 0) > 0 },
    { id: 'deductions', label: 'Deductions', complete: true },
    { id: 'computation', label: 'Computation', complete: !!comp.totalTaxableIncome },
    { id: 'tax-paid', label: 'Tax Paid', complete: (data.tdsEntries?.length || 0) > 0 },
    { id: 'bank', label: 'Bank Account', complete: !!data.bankAccount },
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
              <div style={{ fontSize: 11, color: 'var(--fr-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>BurnBlack</div>
              <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Tax Filing Report</h1>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--fr-muted)' }}>
                <span>AY {data.assessmentYear || '2025-26'}</span>
                <span>•</span>
                <span>{data.itrType || 'ITR-1'}</span>
                <span>•</span>
                <span>{regime === 'new' ? 'New' : 'Old'} Regime</span>
              </div>
            </header>
            <IdentityBand data={data} />
            <IncomeBand incomes={data.incomes || []} />
            <DeductionsBand deductions={data.deductions || []} regime={regime} />
            <ComputationBand computation={comp} regime={regime} onRegimeChange={handleRegimeChange} />
            <TaxPaidBand tdsEntries={data.tdsEntries || []} />
            <BankBand bankAccount={data.bankAccount} />
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
