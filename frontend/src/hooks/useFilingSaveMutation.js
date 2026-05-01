import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useFilingStore from '../store/useFilingStore';
import toast from 'react-hot-toast';

const EP_MAP = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  if (!target || typeof target !== 'object' || Array.isArray(target)) return { ...source };
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    const s = source[key]; const t = result[key];
    result[key] = (s && typeof s === 'object' && !Array.isArray(s) && t && typeof t === 'object' && !Array.isArray(t))
      ? deepMerge(t, s) : s;
  }
  return result;
}

export function getITRType(active, payload) {
  if (active.includes('business')) {
    const hasPresumptive = (payload?.income?.presumptive?.entries || []).length > 0;
    const hasFullBusiness = (payload?.income?.business?.businesses || []).length > 0;
    if (hasPresumptive && !hasFullBusiness) return 'ITR-4';
    return 'ITR-3';
  }
  if (active.includes('capital_gains') || active.includes('foreign')) return 'ITR-2';
  return 'ITR-1';
}

export default function useFilingSaveMutation(filingId) {
  const qc = useQueryClient();
  const { activeSources, setComputation, setDirty, setSelectedRegime } = useFilingStore();

  return useMutation({
    mutationFn: async (updates) => {
      const filing = qc.getQueryData(['filing', filingId])?.data || qc.getQueryData(['filing', filingId]);
      const body = { jsonPayload: deepMerge(filing?.jsonPayload || {}, updates), version: filing?.version };
      if (updates.selectedRegime) { body.selectedRegime = updates.selectedRegime; setSelectedRegime(updates.selectedRegime); }

      try {
        const res = await api.put(`/filings/${filingId}`, body);
        if (res.data?.itrTypeChanged) toast.success(`Form updated to ${res.data.newItrType}`, { id: 'itr-switch' });
      } catch (err) {
        if (err.response?.status === 409 && err.response?.data?.code === 'VERSION_CONFLICT') {
          const { data: fresh } = await api.get(`/filings/${filingId}`);
          const f = fresh.data;
          await api.put(`/filings/${filingId}`, { jsonPayload: deepMerge(f?.jsonPayload || {}, updates), version: f?.version });
        } else { throw err; }
      }

      try {
        const itr = getITRType(activeSources, filing?.jsonPayload);
        const r = await api.post(`/filings/${filingId}/${EP_MAP[itr] || 'itr1'}/compute`);
        setComputation(r.data.data);
      } catch { /* computation failure is non-blocking */ }
    },
    onMutate: () => setDirty(true),
    onSuccess: () => { setDirty(false); qc.invalidateQueries({ queryKey: ['filing', filingId] }); },
    onError: (e) => {
      setDirty(false);
      toast.error(e.response?.status === 409 ? 'Save conflict — please refresh' : (e.response?.data?.error || 'Save failed'));
    },
  });
}
