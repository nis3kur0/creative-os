import { writable } from 'svelte/store';

const STORAGE_THEME_KEY = 'creative_os_theme';

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_THEME_KEY);
  if (stored !== null) return stored === 'dark';
  return true; // Default dark mode as requested
}

function createThemeStore() {
  const isDark = getInitialTheme();
  const { subscribe, set, update } = writable<boolean>(isDark);

  function apply(dark: boolean) {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_THEME_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_THEME_KEY, 'light');
      }
    }
  }

  // apply initial
  if (typeof window !== 'undefined') {
    apply(isDark);
  }

  return {
    subscribe,
    toggle: () => {
      update(current => {
        const next = !current;
        apply(next);
        return next;
      });
    },
    setDark: (dark: boolean) => {
      apply(dark);
      set(dark);
    }
  };
}

export const themeStore = createThemeStore();
