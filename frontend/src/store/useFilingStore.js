import { create } from 'zustand';

const useFilingStore = create((set) => ({
  // Zoom
  zoomedSection: null,
  zoomIn: (id) => set({ zoomedSection: id }),
  zoomOut: () => set({ zoomedSection: null }),

  // Income sources
  activeSources: ['salary'],
  toggleSource: (id) => set((s) => {
    const has = s.activeSources.includes(id);
    if (has && s.activeSources.length === 1) return s;
    return {
      activeSources: has ? s.activeSources.filter((x) => x !== id) : [...s.activeSources, id],
      zoomedSection: has ? (s.zoomedSection === id ? null : s.zoomedSection) : id,
    };
  }),
  setActiveSources: (sources) => set({ activeSources: sources }),

  // Regime
  selectedRegime: 'new',
  setSelectedRegime: (r) => set({ selectedRegime: r }),

  // Computation
  computation: null,
  setComputation: (c) => set({ computation: c }),

  // Dirty
  isDirty: false,
  setDirty: (d) => set({ isDirty: d }),
}));

export default useFilingStore;
