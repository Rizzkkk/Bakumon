import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'bakumon-theme';

// localStorage throws in a private window and in blocked-site-data contexts. A stored
// preference is a nice-to-have, not a page-render precondition, so every read and write
// is wrapped rather than allowed to blank the app.
function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Nothing to recover: the choice just does not persist this session.
  }
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ADR 0010: the theme follows prefers-color-scheme until an explicit choice is made, and
// that choice then wins and persists. index.html's inline script sets data-theme before
// first paint using the same storage key, so there is no flash on load.
export function useTheme() {
  const [theme, setTheme] = useState(() => readStoredTheme() ?? systemTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readStoredTheme() === null) setTheme(systemTheme());
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      writeStoredTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
