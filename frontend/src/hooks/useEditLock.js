/**
 * useEditLock — Reads field source metadata from jsonPayload._importMeta.fieldSources
 * and returns the edit lock state for a given field path.
 */

/**
 * @param {object} jsonPayload - The filing's jsonPayload
 * @param {string} fieldPath - Dot-notation path to the field
 * @returns {{ editLock: 'locked'|'warn'|'free', source: string|null, importedAt: string|null }}
 */
export default function useEditLock(jsonPayload, fieldPath) {
  const fieldSources = jsonPayload?._importMeta?.fieldSources;
  const meta = fieldSources?.[fieldPath];

  if (!meta) {
    return { editLock: 'free', source: null, importedAt: null };
  }

  return {
    editLock: meta.editLock || 'free',
    source: meta.source || null,
    importedAt: meta.importedAt || null,
  };
}
