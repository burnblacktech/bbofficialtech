import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        document.documentElement.setAttribute('data-theme', resolved);
        set({ theme, resolvedTheme: resolved });
      },

      /** Apply the current theme to the DOM (call on mount) */
      applyTheme: () => {
        set((state) => {
          const resolved = resolveTheme(state.theme);
          document.documentElement.setAttribute('data-theme', resolved);
          return { resolvedTheme: resolved };
        });
      },
    }),
    { name: 'bb-theme' },
  ),
);

export default useThemeStore;
