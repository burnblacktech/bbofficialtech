/**
 * ImportDocumentModal — Full-screen modal for uploading Form 16 / 26AS / AIS
 *
 * Triggered from Filing HUD. Handles:
 * - Document type selection (3 cards)
 * - File upload with drag-and-drop
 * - Client-side format + size validation
 * - Base64 encoding + POST to /api/filings/:filingId/import
 * - Progress spinner while parsing
 * - Error display for backend failures
 * - On success: passes parsed data to onImportParsed callback
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, FileJson, AlertCircle, Loader2, CheckCircle, Globe, Lock, RefreshCw,
} from 'lucide-react';
import api from '../../../../services/api';
import P from '../../../../styles/palette';

// ── Document types that support ITD portal fetch ──
const ITD_FETCH_TYPES = ['26as', 'ais'];

// ── Document type configs ──
const DOC_TYPES = [
  {
    id: 'form16',
    label: 'Form 16',
    desc: 'Salary certificate from employer (PDF)',
    format: 'PDF',
    accept: '.pdf',
    mimeTypes: ['application/pdf'],
    maxSizeMB: 10,
    icon: FileText,
    color: '#059669',
    bg: '#f0fdf4',
  },
  {
    id: '26as',
    label: 'Form 26AS',
    desc: 'Tax credit statement · JSON or PDF from ITD portal',
    format: 'JSON/PDF',
    accept: '.json,.pdf',
    mimeTypes: ['application/json', 'application/pdf'],
    maxSizeMB: 10,
    icon: FileJson,
    color: '#0D9488',
    bg: '#F0FDFA',
  },
  {
    id: 'ais',
    label: 'AIS',
    desc: 'Annual Information Statement · JSON or PDF from ITD portal',
    format: 'JSON/PDF',
    accept: '.json,.pdf',
    mimeTypes: ['application/json', 'application/pdf'],
    maxSizeMB: 10,
    icon: FileJson,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    id: 'form16a',
    label: 'Form 16A',
    desc: 'Non-salary TDS certificate (PDF)',
    format: 'PDF',
    accept: '.pdf',
    mimeTypes: ['application/pdf'],
    maxSizeMB: 10,
    icon: FileText,
    color: '#0891b2',
    bg: '#f0f9ff',
  },
  {
    id: 'form16b',
    label: 'Form 16B',
    desc: 'TDS on property sale (PDF)',
    format: 'PDF',
    accept: '.pdf',
    mimeTypes: ['application/pdf'],
    maxSizeMB: 10,
    icon: FileText,
    color: '#CA8A04',
    bg: '#FEFCE8',
  },
  {
    id: 'form16c',
    label: 'Form 16C',
    desc: 'TDS on rent (PDF)',
    format: 'PDF',
    accept: '.pdf',
    mimeTypes: ['application/pdf'],
    maxSizeMB: 10,
    icon: FileText,
    color: '#6b7280',
    bg: '#f9fafb',
  },
];

// ── Animation variants ──
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.15 } },
};

/**
 * Validates file extension and MIME type against the selected document type.
 * Returns { valid, error }.
 */
function validateFileFormat(file, docType) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const pdfOnlyTypes = ['form16', 'form16a', 'form16b', 'form16c'];
  const dualTypes = ['26as', 'ais']; // Accept both JSON and PDF

  if (pdfOnlyTypes.includes(docType.id)) {
    if (ext !== 'pdf') {
      return { valid: false, error: `Expected a .pdf file but got .${ext}` };
    }
  } else if (dualTypes.includes(docType.id)) {
    if (ext !== 'json' && ext !== 'pdf') {
      return { valid: false, error: `Expected a .json or .pdf file but got .${ext}` };
    }
  } else if (ext !== 'json') {
    return { valid: false, error: `Expected a .json file but got .${ext}` };
  }

  // MIME check — browsers may report empty or generic types, so also accept empty
  if (file.type && !docType.mimeTypes.includes(file.type) && file.type !== 'application/octet-stream') {
    return { valid: false, error: `Invalid file type "${file.type}". Expected ${docType.format} format.` };
  }

  return { valid: true };
}

/**
 * Validates file size against the document type limit.
 * Returns { valid, error }.
 */
function validateFileSize(file, docType) {
  const maxBytes = docType.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File is ${sizeMB}MB — exceeds the ${docType.maxSizeMB}MB limit for ${docType.label}.` };
  }
  return { valid: true };
}

/**
 * Reads a File as base64 string (data portion only, no prefix).
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:<mime>;base64,<data>" — extract the data part
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ImportDocumentModal({ filingId, onClose, onImportParsed, preselectedType }) {
  const [selectedType, setSelectedType] = useState(preselectedType || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  // ── ITD Portal fetch state (Tasks 9.1–9.3) ──
  const [itdMode, setItdMode] = useState(false); // true = showing ITD fetch flow
  const [itdState, setItdState] = useState('idle'); // idle | authenticating | authenticated | fetching | fetched
  const [itdPan, setItdPan] = useState('');
  const [itdPassword, setItdPassword] = useState('');
  const [itdError, setItdError] = useState(null);
  const [itdErrorCode, setItdErrorCode] = useState(null);

  const docType = DOC_TYPES.find((d) => d.id === selectedType);
  const supportsItdFetch = ITD_FETCH_TYPES.includes(selectedType);

  // ── File handling ──
  const handleFile = useCallback(
    async (file, pwd) => {
      if (!docType) return;
      setError(null);
      setFileName(file.name);

      // Client-side validation
      const fmtCheck = validateFileFormat(file, docType);
      if (!fmtCheck.valid) { setError(fmtCheck.error); setFileName(null); return; }

      const sizeCheck = validateFileSize(file, docType);
      if (!sizeCheck.valid) { setError(sizeCheck.error); setFileName(null); return; }

      // Read + upload
      setUploading(true);
      try {
        const fileContent = await readFileAsBase64(file);
        const body = { documentType: docType.id, fileContent, fileName: file.name };
        if (pwd) body.password = pwd;
        const res = await api.post(`/filings/${filingId}/import`, body);

        const { extractedData, conflicts, fieldMapping, documentMeta, warnings } = res.data;
        setNeedsPassword(false);
        setPendingFile(null);
        setPassword('');
        onImportParsed({ extractedData, conflicts, fieldMapping, documentMeta, documentType: docType.id, fileName: file.name, fileContent, warnings: warnings || [] });
      } catch (err) {
        const code = err.response?.data?.code;
        const msg = err.response?.data?.error || err.response?.data?.message || 'Upload failed. Please try again.';
        if (code === 'IMPORT_PASSWORD_REQUIRED' || code === 'IMPORT_PASSWORD_INCORRECT') {
          setNeedsPassword(true);
          setPendingFile(file);
          setError(msg);
        } else {
          setError(msg);
          setFileName(null);
        }
      } finally {
        setUploading(false);
      }
    },
    [docType, filingId, onImportParsed],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile],
  );

  const goBack = () => {
    setSelectedType(null);
    setError(null);
    setFileName(null);
    // Reset ITD state
    setItdMode(false);
    setItdState('idle');
    setItdPan('');
    setItdPassword('');
    setItdError(null);
    setItdErrorCode(null);
  };

  // ── ITD Portal: switch to fetch mode ──
  const startItdFetch = () => {
    setItdMode(true);
    setItdError(null);
    setItdErrorCode(null);
    setItdState('idle');
    // Pre-fill PAN from preselectedType context (if available)
    if (!itdPan) setItdPan('');
  };

  // ── ITD Portal: switch back to file upload ──
  const switchToUpload = () => {
    setItdMode(false);
    setItdError(null);
    setItdErrorCode(null);
    setItdState('idle');
    setItdPassword('');
  };

  // ── Task 9.1: ITD Portal authentication ──
  const handleItdAuth = useCallback(async () => {
    if (!itdPan || !itdPassword) return;
    setItdError(null);
    setItdErrorCode(null);
    setItdState('authenticating');
    try {
      await api.post(`/filings/${filingId}/import/surepass/auth`, {
        pan: itdPan,
        itdPassword,
      });
      setItdState('authenticated');
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please try again.';
      setItdError(msg);
      setItdErrorCode(code || null);
      setItdState('idle');
    } finally {
      // Req 9.5: Clear password from React state immediately
      setItdPassword('');
    }
  }, [filingId, itdPan, itdPassword]);

  // ── Task 9.2: Fetch document after auth ──
  const handleItdFetchDoc = useCallback(async (fetchType) => {
    setItdError(null);
    setItdErrorCode(null);
    setItdState('fetching');
    try {
      const res = await api.post(`/filings/${filingId}/import/surepass/fetch`, {
        documentType: fetchType,
      });
      setItdState('fetched');
      const { extractedData, conflicts, fieldMapping, documentMeta, warnings } = res.data;
      onImportParsed({ extractedData, conflicts, fieldMapping, documentMeta, documentType: fetchType, fileName: `ITD Portal (${fetchType.toUpperCase()})`, warnings: warnings || [] });
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch data. Please try again.';
      setItdError(msg);
      setItdErrorCode(code || null);
      // Session expired → need re-auth; otherwise stay authenticated for retry
      if (code === 'ITR_SESSION_EXPIRED') {
        setItdState('idle');
      } else {
        setItdState('authenticated');
      }
    }
  }, [filingId, onImportParsed]);

  // ── Task 9.3: Retry handler ──
  const handleItdRetry = () => {
    setItdError(null);
    setItdErrorCode(null);
    if (itdState === 'idle') {
      // Re-auth scenario — just clear error, user can re-submit
    } else if (itdState === 'authenticated') {
      // Fetch failed — user can pick document type again
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="import-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          key="import-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>Import Documents</h2>
              <p style={styles.subtitle}>
                {selectedType
                  ? (itdMode ? `Fetch ${docType?.label} from ITD portal` : `Upload your ${docType?.label} file`)
                  : 'Select a document type to import'}
              </p>
            </div>
            <button style={styles.closeBtn} onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={styles.body}>
            {!selectedType ? (
              /* ── Step 1: Document type selection ── */
              <div style={styles.cardGrid}>
                {DOC_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  return (
                    <motion.button
                      key={dt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.typeCard}
                      onClick={() => { setSelectedType(dt.id); setError(null); }}
                    >
                      <div style={{ ...styles.typeIcon, background: dt.bg }}>
                        <Icon size={24} style={{ color: dt.color }} />
                      </div>
                      <div style={styles.typeLabel}>{dt.label}</div>
                      <div style={styles.typeDesc}>{dt.desc}</div>
                      <span style={{ ...styles.typeBadge, color: dt.color, background: dt.bg }}>
                        {dt.format} · max {dt.maxSizeMB}MB
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ) : itdMode ? (
              /* ── Step 2b: ITD Portal fetch flow (Tasks 9.1–9.3) ── */
              <div>
                <button style={styles.backBtn} onClick={goBack}>← Change document type</button>

                {/* ── Task 9.1: Auth form (idle state) ── */}
                {itdState === 'idle' && (
                  <div style={styles.itdAuthBox}>
                    <div style={styles.itdAuthHeader}>
                      <div style={{ ...styles.typeIcon, background: '#F0FDFA' }}>
                        <Globe size={24} style={{ color: P.secondary }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: P.textPrimary }}>
                          Connect to ITD Portal
                        </div>
                        <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
                          Enter your e-filing credentials to fetch {docType?.label} data
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={styles.itdLabel}>PAN</label>
                      <input
                        type="text"
                        value={itdPan}
                        onChange={(e) => setItdPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        style={styles.itdInput}
                      />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={styles.itdLabel}>ITD e-Filing Password</label>
                      <input
                        type="password"
                        value={itdPassword}
                        onChange={(e) => setItdPassword(e.target.value)}
                        placeholder="Your incometax.gov.in password"
                        style={styles.itdInput}
                        autoFocus
                      />
                    </div>

                    <button
                      onClick={handleItdAuth}
                      disabled={!itdPan || !itdPassword}
                      style={{
                        ...styles.itdPrimaryBtn,
                        opacity: (!itdPan || !itdPassword) ? 0.5 : 1,
                        cursor: (!itdPan || !itdPassword) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Lock size={14} />
                      Connect to ITD Portal
                    </button>

                    <div style={{ fontSize: 11, color: P.textLight, marginTop: 10, textAlign: 'center' }}>
                      Your password is sent securely and never stored
                    </div>
                  </div>
                )}

                {/* ── Task 9.1: Authenticating state ── */}
                {itdState === 'authenticating' && (
                  <div style={styles.itdLoadingBox}>
                    <Loader2 size={32} style={{ color: P.secondary, animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginTop: 12 }}>
                      Connecting to ITD portal...
                    </div>
                    <div style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                      Verifying your credentials with incometax.gov.in
                    </div>
                  </div>
                )}

                {/* ── Task 9.2: Document selection (authenticated state) ── */}
                {itdState === 'authenticated' && (
                  <div style={styles.itdAuthBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <CheckCircle size={18} style={{ color: P.success }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: P.success }}>Connected to ITD Portal</span>
                    </div>
                    <div style={{ fontSize: 13, color: P.textSecondary, marginBottom: 16 }}>
                      Select which document to fetch:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => handleItdFetchDoc('26as')}
                        style={styles.itdDocBtn}
                      >
                        <FileJson size={16} style={{ color: '#0D9488' }} />
                        Fetch Form 26AS
                      </button>
                      <button
                        onClick={() => handleItdFetchDoc('ais')}
                        style={styles.itdDocBtn}
                      >
                        <FileJson size={16} style={{ color: '#7c3aed' }} />
                        Fetch AIS
                      </button>
                      <button
                        onClick={() => handleItdFetchDoc('both')}
                        style={{ ...styles.itdDocBtn, background: P.brandLight, borderColor: P.brand }}
                      >
                        <FileJson size={16} style={{ color: P.brandDark }} />
                        Fetch Both (26AS + AIS)
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Task 9.2: Fetching state ── */}
                {itdState === 'fetching' && (
                  <div style={styles.itdLoadingBox}>
                    <Loader2 size={32} style={{ color: P.secondary, animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginTop: 12 }}>
                      Fetching your data...
                    </div>
                    <div style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                      Downloading from ITD portal — this may take a moment
                    </div>
                  </div>
                )}

                {/* ── Task 9.3: Error display with retry + fallback ── */}
                {itdError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ ...styles.errorBox, flexDirection: 'column', gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <AlertCircle size={16} style={{ color: P.error, flexShrink: 0, marginTop: 1 }} />
                      <span>{itdError}</span>
                    </div>

                    {/* Rate limit: show wait message only */}
                    {(itdErrorCode === 'SUREPASS_RATE_LIMITED' || itdErrorCode === 'ITR_AUTH_RATE_LIMITED') && (
                      <div style={{ fontSize: 12, color: P.textMuted, paddingLeft: 24 }}>
                        Please wait a few minutes before trying again.
                      </div>
                    )}

                    {/* Session expired: re-auth prompt */}
                    {itdErrorCode === 'ITR_SESSION_EXPIRED' && (
                      <div style={{ fontSize: 12, color: P.textMuted, paddingLeft: 24 }}>
                        Your session has expired. Please enter your credentials again.
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, paddingLeft: 24 }}>
                      {itdErrorCode !== 'SUREPASS_RATE_LIMITED' && itdErrorCode !== 'ITR_AUTH_RATE_LIMITED' && (
                        <button onClick={handleItdRetry} style={styles.itdRetryBtn}>
                          <RefreshCw size={12} />
                          Retry
                        </button>
                      )}
                      <button onClick={switchToUpload} style={styles.itdFallbackBtn}>
                        <Upload size={12} />
                        Upload PDF instead
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* ── Step 2a: File upload ── */
              <div>
                <button style={styles.backBtn} onClick={goBack}>← Change document type</button>

                {/* ITD Portal fetch option for 26AS/AIS (Task 9.1) */}
                {supportsItdFetch && (
                  <button onClick={startItdFetch} style={styles.itdFetchBanner}>
                    <Globe size={16} style={{ color: P.secondary }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ fontWeight: 600, color: P.textPrimary }}>Fetch from ITD Portal</span>
                      <span style={{ display: 'block', fontSize: 11, color: P.textMuted, marginTop: 1 }}>
                        Auto-import using your e-filing credentials
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: P.secondary, fontWeight: 600 }}>→</span>
                  </button>
                )}

                {/* Dropzone */}
                <div
                  style={{
                    ...styles.dropzone,
                    borderColor: dragOver ? P.brand : uploading ? P.borderLight : P.borderMedium,
                    background: dragOver ? P.brandLight : uploading ? P.bgMuted : P.bgCard,
                  }}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={docType.accept}
                    onChange={onFileInput}
                    style={{ display: 'none' }}
                  />

                  {uploading ? (
                    <div style={styles.uploadingState}>
                      <Loader2 size={32} style={{ color: P.brand, animation: 'spin 0.8s linear infinite' }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginTop: 12 }}>
                        Parsing {fileName}...
                      </div>
                      <div style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                        Extracting data from your {docType.label}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.dropzoneContent}>
                      <div style={{ ...styles.dropzoneIcon, background: docType.bg }}>
                        <Upload size={24} style={{ color: docType.color }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginTop: 12 }}>
                        Drop your {docType.label} file here
                      </div>
                      <div style={{ fontSize: 13, color: P.textMuted, marginTop: 4 }}>
                        or <span style={{ color: P.brand, cursor: 'pointer' }}>browse files</span>
                      </div>
                      <div style={{ fontSize: 11, color: P.textLight, marginTop: 8 }}>
                        {docType.format} format · max {docType.maxSizeMB}MB
                      </div>
                    </div>
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={styles.errorBox}
                  >
                    <AlertCircle size={16} style={{ color: P.error, flexShrink: 0 }} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Password input for protected PDFs */}
                {needsPassword && (
                  <div style={{ marginTop: 12, padding: 14, background: P.bgMuted, borderRadius: 8, border: `1px solid ${P.borderLight}` }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: P.textSecondary, display: 'block', marginBottom: 6 }}>
                      PDF Password
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="e.g., abcde1234f01011990"
                        style={{ flex: 1, padding: '8px 12px', border: `1px solid ${P.borderMedium}`, borderRadius: 6, fontSize: 13, outline: 'none' }}
                        autoFocus
                      />
                      <button
                        onClick={() => { if (pendingFile && password) handleFile(pendingFile, password); }}
                        disabled={!password || uploading}
                        style={{ padding: '8px 16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !password ? 0.5 : 1 }}
                      >
                        {uploading ? 'Trying...' : 'Unlock'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: P.textLight, marginTop: 6 }}>
                      ITD password format: PAN (lowercase) + DOB (DDMMYYYY)
                    </div>
                  </div>
                )}

                {/* Success hint */}
                {!uploading && !error && fileName && (
                  <div style={styles.successHint}>
                    <CheckCircle size={14} style={{ color: P.success }} />
                    <span>{fileName} selected</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Styles ──
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: P.bgCard,
    borderRadius: 16,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 0',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: P.textPrimary,
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: P.textMuted,
    margin: '4px 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: P.textMuted,
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  body: {
    padding: 24,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 12,
    background: P.bgCard,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    minHeight: 'auto',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: P.textPrimary,
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 11,
    color: P.textMuted,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: P.textMuted,
    padding: '0 0 12px',
    minHeight: 'auto',
  },
  dropzone: {
    border: '2px dashed',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dropzoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: '10px 14px',
    background: P.errorBg,
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13,
    color: P.errorDark,
    lineHeight: 1.4,
  },
  successHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    fontSize: 12,
    color: P.success,
    fontWeight: 500,
  },
  // ── ITD Portal fetch styles (Tasks 9.1–9.3) ──
  itdFetchBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 14px',
    marginBottom: 12,
    background: P.secondaryLight,
    border: `1px solid ${P.infoBorder}`,
    borderRadius: 10,
    cursor: 'pointer',
    minHeight: 'auto',
  },
  itdAuthBox: {
    padding: 20,
    background: P.bgCard,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 12,
  },
  itdAuthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  itdLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: P.textSecondary,
    display: 'block',
    marginBottom: 4,
  },
  itdInput: {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${P.borderMedium}`,
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  itdPrimaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 16,
    padding: '10px 16px',
    background: P.secondary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    minHeight: 'auto',
  },
  itdLoadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    background: P.bgCard,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 12,
    textAlign: 'center',
  },
  itdDocBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    background: P.bgCard,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: P.textPrimary,
    cursor: 'pointer',
    minHeight: 'auto',
    transition: 'border-color 0.15s',
  },
  itdRetryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: P.bgCard,
    border: `1px solid ${P.borderMedium}`,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    color: P.textSecondary,
    cursor: 'pointer',
    minHeight: 'auto',
  },
  itdFallbackBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: 'none',
    border: `1px solid ${P.borderLight}`,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    color: P.textMuted,
    cursor: 'pointer',
    minHeight: 'auto',
  },
};
