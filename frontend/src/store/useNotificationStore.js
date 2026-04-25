import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  isPanelOpen: false,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  closePanel: () => set({ isPanelOpen: false }),
}));

export default useNotificationStore;
