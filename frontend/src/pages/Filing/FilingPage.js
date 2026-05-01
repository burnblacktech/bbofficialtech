import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import useFilingStore from '../../store/useFilingStore';
import FilingShell from './FilingShell';

const EP_MAP = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };

export default function FilingPage() {
  const { filingId } = useParams();
  const setActiveSources = useFilingStore((s) => s.setActiveSources);
  const setSelectedRegime = useFilingStore((s) => s.setSelectedRegime);
  const setComputation = useFilingStore((s) => s.setComputation);

  const { data: filing, isLoading, isError, error } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: () => api.get(`/filings/${filingId}`).then((r) => r.data.data),
    enabled: !!filingId,
  });

  // Initialize store from filing — once
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!filing || initializedRef.current) return;
    initializedRef.current = true;

    const payload = filing.jsonPayload || {};
    const saved = payload._selectedSources;
    if (Array.isArray(saved) && saved.length > 0) {
      setActiveSources(saved);
    }
    setSelectedRegime(filing.selectedRegime || payload.selectedRegime || 'new');

    // Initial computation
    const itrType = filing.itrType || 'ITR-1';
    const ep = EP_MAP[itrType] || 'itr1';
    api
      .post(`/filings/${filingId}/${ep}/compute`)
      .then((r) => setComputation(r.data.data))
      .catch((err) => console.warn('Initial computation failed:', err.message));
  }, [filing, filingId, setActiveSources, setSelectedRegime, setComputation]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 8 }}>
        <p style={{ color: 'var(--color-error, #DC2626)', fontWeight: 500 }}>
          Failed to load filing
        </p>
        <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: 13 }}>
          {error?.response?.data?.error || error?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  return <FilingShell filingId={filingId} filing={filing} />;
}
