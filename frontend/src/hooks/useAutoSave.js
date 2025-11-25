import { useState, useCallback } from 'react';

const useAutoSave = (data, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveData = useCallback(async (dataToSave) => {
    setIsSaving(true);
    try {
      // Mock save operation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      console.log('Data auto-saved:', dataToSave);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    isSaving,
    lastSaved,
    saveData,
  };
};

export default useAutoSave;
