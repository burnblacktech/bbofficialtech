/**
 * DocumentPanel — Right-side document checklist for the filing HUD.
 * Shows personalised list of documents needed based on active income sources.
 * Each item links to the import modal.
 */

import { useMemo } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import P from '../../../styles/palette';

// Document definitions — what's needed for each income source
const DOC_DEFS = {
  identity: [
    { id: 'pan', label: 'PAN Card', desc: 'Identity verification', group: 'Identity', importType: null, section: 'personalInfo' },
    { id: 'aadhaar', label: 'Aadhaar Card', desc: 'For e-verification after filing', group: 'Identity', importType: null, section: 'personalInfo' },
  ],
  salary: [
    { id: 'form16', label: 'Form 16', desc: 'Salary, TDS, employer details', group: 'Salary & TDS', importType: 'form16', section: 'salary' },
  ],
  tds: [
    { id: '26as', label: 'Form 26AS', desc: 'Verifies all TDS credits', group: 'Salary & TDS', importType: '26as', section: 'bank' },
    { id: 'ais', label: 'AIS', desc: 'Cross-checks all reported income', group: 'Salary & TDS', importType: 'ais', section: null },
  ],
  other: [
    { id: 'bank_stmt', label: 'Bank Statement', desc: 'Interest income + account details', group: 'Other Income', importType: null, section: 'other' },
    { id: 'form16a', label: 'Form 16A', desc: 'TDS on non-salary income', group: 'Other Income', importType: 'form16a', section: 'bank' },
  ],
  // eslint-disable-next-line camelcase
  house_property: [
    { id: 'loan_cert', label: 'Home Loan Certificate', desc: 'Interest paid on housing loan', group: 'House Property', importType: null, section: 'house_property' },
    { id: 'rent_receipts', label: 'Rent Receipts / Agreement', desc: 'Proof of rent received (let-out)', group: 'House Property', importType: null, section: 'house_property' },
    { id: 'form16c', label: 'Form 16C', desc: 'TDS on rent (from tenant)', group: 'House Property', importType: 'form16c', section: 'bank' },
  ],
  // eslint-disable-next-line camelcase
  capital_gains: [
    { id: 'broker_cg', label: 'Broker CG Statement', desc: 'Capital gains from shares/MF', group: 'Capital Gains', importType: null, section: 'capital_gains' },
    { id: 'form16b', label: 'Form 16B', desc: 'TDS on property sale', group: 'Capital Gains', importType: 'form16b', section: 'bank' },
  ],
  deductions: [
    { id: 'invest_proofs', label: 'Investment Proofs', desc: 'PPF, ELSS, LIC for 80C', group: 'Deductions', importType: null, section: 'deductions' },
    { id: 'health_receipt', label: 'Health Insurance Receipt', desc: '80D premium proof', group: 'Deductions', importType: null, section: 'deductions' },
    { id: 'donation_receipt', label: 'Donation Receipts', desc: '80G donation proof with PAN', group: 'Deductions', importType: null, section: 'deductions' },
  ],
  bank: [
    { id: 'bank_passbook', label: 'Bank Passbook / Cheque', desc: 'Account number, IFSC for refund', group: 'Bank', importType: null, section: 'bank' },
  ],
};

/**
 * Generate personalised document checklist based on active income sources.
 */
function generateChecklist(activeSources, payload, panVerified) {
  const docs = [];

  // Identity — always needed
  docs.push({
    ...DOC_DEFS.identity[0],
    status: panVerified ? 'done' : 'pending',
    summary: panVerified ? 'Verified' : null,
  });
  docs.push({
    ...DOC_DEFS.identity[1],
    status: payload?.personalInfo?.aadhaar ? 'done' : 'pending',
    summary: payload?.personalInfo?.aadhaar ? 'Added' : null,
  });

  // Salary docs
  if (activeSources.includes('salary')) {
    const hasForm16 = (payload?._importMeta?.imports || []).some(i => i.documentType === 'form16' && i.status === 'confirmed');
    const employers = payload?.income?.salary?.employers || [];
    docs.push({
      ...DOC_DEFS.salary[0],
      status: hasForm16 || employers.length > 0 ? 'done' : 'pending',
      summary: employers.length > 0 ? `${employers[0]?.name || 'Employer'} · ${fmtShort(employers.reduce((s, e) => s + (Number(e.grossSalary) || 0), 0))}` : null,
    });
  }

  // 26AS + AIS — always useful
  const has26AS = (payload?._importMeta?.imports || []).some(i => i.documentType === '26as' && i.status === 'confirmed');
  const hasAIS = (payload?._importMeta?.imports || []).some(i => i.documentType === 'ais' && i.status === 'confirmed');
  docs.push({ ...DOC_DEFS.tds[0], status: has26AS ? 'done' : 'pending', summary: has26AS ? 'Imported' : null });
  docs.push({ ...DOC_DEFS.tds[1], status: hasAIS ? 'done' : 'pending', summary: hasAIS ? 'Imported' : null });

  // Other income docs
  if (activeSources.includes('other')) {
    docs.push({ ...DOC_DEFS.other[0], status: 'pending', summary: null });
    const has16A = (payload?._importMeta?.imports || []).some(i => i.documentType === 'form16a' && i.status === 'confirmed');
    docs.push({ ...DOC_DEFS.other[1], status: has16A ? 'done' : 'pending', summary: has16A ? 'Imported' : null });
  }

  // House property docs
  if (activeSources.includes('house_property')) {
    DOC_DEFS.house_property.forEach(d => {
      const hasImport = d.importType ? (payload?._importMeta?.imports || []).some(i => i.documentType === d.importType && i.status === 'confirmed') : false;
      docs.push({ ...d, status: hasImport ? 'done' : 'pending', summary: hasImport ? 'Imported' : null });
    });
  }

  // Capital gains docs
  if (activeSources.includes('capital_gains')) {
    DOC_DEFS.capital_gains.forEach(d => {
      const hasImport = d.importType ? (payload?._importMeta?.imports || []).some(i => i.documentType === d.importType && i.status === 'confirmed') : false;
      docs.push({ ...d, status: hasImport ? 'done' : 'pending', summary: hasImport ? 'Imported' : null });
    });
  }

  // Deduction docs
  const hasDeductions = Number(payload?.deductions?.ppf || 0) + Number(payload?.deductions?.elss || 0) + Number(payload?.deductions?.healthSelf || 0) > 0;
  docs.push({ ...DOC_DEFS.deductions[0], status: hasDeductions ? 'done' : 'pending', summary: hasDeductions ? 'Added' : null });
  docs.push({ ...DOC_DEFS.deductions[1], status: Number(payload?.deductions?.healthSelf || 0) > 0 ? 'done' : 'pending', summary: null });
  const hasDonations = (payload?.deductions?.donations80G || []).length > 0;
  docs.push({ ...DOC_DEFS.deductions[2], status: hasDonations ? 'done' : 'pending', summary: hasDonations ? `${payload.deductions.donations80G.length} donation(s)` : null });

  // Bank docs — always needed
  const hasBank = !!(payload?.bankDetails?.bankName && payload?.bankDetails?.accountNumber);
  docs.push({ ...DOC_DEFS.bank[0], status: hasBank ? 'done' : 'pending', summary: hasBank ? `${payload.bankDetails.bankName} ****${(payload.bankDetails.accountNumber || '').slice(-4)}` : null });

  return docs;
}

function fmtShort(v) {
  const n = Number(v) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DocumentPanel({ activeSources, payload, panVerified, onImport, onNavigate }) {
  const docs = useMemo(
    () => generateChecklist(activeSources, payload, panVerified),
    [activeSources, payload, panVerified],
  );

  const doneCount = docs.filter(d => d.status === 'done').length;
  const totalCount = docs.length;

  // Group docs by group label
  const groups = [];
  let currentGroup = null;
  for (const doc of docs) {
    if (doc.group !== currentGroup) {
      groups.push({ label: doc.group, items: [] });
      currentGroup = doc.group;
    }
    groups[groups.length - 1].items.push(doc);
  }

  // Find the most important pending doc for the tip
  const nextImportant = docs.find(d => d.status === 'pending' && d.importType);

  return (
    <aside className="hud-docs">
      <div className="hud-docs-title">
        <FileText size={14} /> Documents
      </div>
      <div className="hud-docs-subtitle">
        Upload documents to auto-fill your filing
      </div>

      {groups.map(g => (
        <div key={g.label}>
          <div className="hud-docs-group">{g.label}</div>
          {g.items.map(doc => (
            <div key={doc.id} className="hud-doc-item">
              <div className={`hud-doc-icon ${doc.status === 'done' ? 'done' : 'pending'}`}>
                {doc.status === 'done' ? <CheckCircle size={14} /> : <FileText size={14} />}
              </div>
              <div className="hud-doc-info">
                <div className="hud-doc-name">{doc.label}</div>
                {doc.summary ? (
                  <div className="hud-doc-summary">{doc.summary}</div>
                ) : (
                  <div className="hud-doc-desc">{doc.desc}</div>
                )}
              </div>
              {doc.status === 'pending' && doc.importType && (
                <button className="hud-doc-action" onClick={() => onImport(doc.importType)}>
                  Upload
                </button>
              )}
              {doc.status === 'pending' && !doc.importType && doc.section && (
                <button className="hud-doc-action" onClick={() => onNavigate?.(doc.section)}>
                  Add
                </button>
              )}
              {doc.status === 'done' && (
                <CheckCircle size={14} style={{ color: P.success, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="hud-docs-progress">
        {doneCount} of {totalCount} ready
      </div>

      {nextImportant && (
        <div className="hud-docs-tip">
          💡 Upload {nextImportant.label} to auto-fill {nextImportant.desc.toLowerCase()}
        </div>
      )}
    </aside>
  );
}

/**
 * Floating button for mobile — shows doc count, opens bottom sheet.
 */
export function DocumentFloatButton({ count, total, onClick }) {
  return (
    <button className="hud-docs-float" onClick={onClick}>
      <FileText size={14} /> {count}/{total} docs
    </button>
  );
}
