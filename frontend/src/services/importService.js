import api from './api';

export const parseDocument = (filingId, { documentType, fileContent, fileName }) =>
  api.post(`/filings/${filingId}/import`, { documentType, fileContent, fileName });

export const confirmImport = (filingId, { resolvedData, documentType, fileName, fileContent }) =>
  api.put(`/filings/${filingId}/import/confirm`, {
    resolvedData,
    documentType,
    fileName,
    fileContent,
  });

export const undoImport = (filingId, importId) =>
  api.delete(`/filings/${filingId}/import/${importId}`);

export const getImportHistory = (filingId) =>
  api.get(`/filings/${filingId}/import/history`);
