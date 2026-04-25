import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentAY, ayToFY } from '../utils/assessmentYear';

const useFinanceFilterStore = create(
  persist(
    (set) => ({
      selectedFY: ayToFY(getCurrentAY()),
      setFY: (fy) => set({ selectedFY: fy }),
    }),
    {
      name: 'bb-finance-filter',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default useFinanceFilterStore;
