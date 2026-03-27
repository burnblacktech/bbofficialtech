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
  X, Upload, FileText, FileJson, AlertCircle, Loader2, CheckCircle,
} from 'lucide-react';
import api from '../../../../services/api';
import P from '../../../../styles/palette';

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
    desc: 'Tax credit statement from ITD (JSON)',
    format: 'JSON',
    accept: '.json',
    mimeTypes: ['application/json'],
    maxSizeMB: 5,
    icon: FileJson,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'ais',
    label: 'AIS',
    desc: 'Annual Information Statement (JSON)',
    format: 'JSON',
    accept: '.json',
    mimeTypes: ['application/json'],
    maxSizeMB: 10,
    icon: FileJson,
    color: '#7c3aed',
    bg: '#f5f3ff',
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
  const expectedExt = docType.id === 'form16' ? 'pdf' : 'json';

  if (ext !== expectedExt) {
    return { valid: false, error: `Expected a .${expectedExt} file but got .${ext}` };
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

export default function ImportDocumentModal({ filingId, onClose, onImportParsed }) {
  const [selectedType, setSelectedType] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const docType = DOC_TYPES.find((d) => d.id === selectedType);

  // ── File handling ──
  const handleFile = useCallback(
    async (file) => {
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
        const res = await api.post(`/filings/${filingId}/import`, {
          documentType: docType.id,
          fileContent,
          fileName: file.name,
        });

        const { extractedData, conflicts, fieldMapping, documentMeta } = res.data;
        onImportParsed({ extractedData, conflicts, fieldMapping, documentMeta, documentType: docType.id, fileName: file.name, fileContent });
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Upload failed. Please try again.';
        setError(msg);
        setFileName(null);
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
                {selectedType ? `Upload your ${docType?.label} file` : 'Select a document type to import'}
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
            ) : (
              /* ── Step 2: File upload ── */
              <div>
                <button style={styles.backBtn} onClick={goBack}>← Change document type</button>

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
    padding: 40,
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
};
