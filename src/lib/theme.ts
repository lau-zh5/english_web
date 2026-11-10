import { useSyncExternalStore } from 'react';

/**
 * 全站主题：浅色 / 深色 / 跟随系统。
 * 状态存在 localStorage，并在 <html> 上挂 .dark 与 data-theme，
 * 保证登录页、内页、以及不同端口/域名打开时是同一套外观。
 */

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'english_theme';
const VALID: ThemeMode[] = ['light', 'dark', 'system'];

const listeners = new Set<() => void>();
let current: ThemeMode = readStored();
let mediaQuery: MediaQueryList | null = null;

function readStored(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (value && VALID.includes(value)) return value;
  } catch {
    // storage 可能被禁用（iOS 隐私模式），忽略即可
  }
  return 'system';
}

export function resolveTheme(mode: ThemeMode = current): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = resolved === 'dark' ? '#0b0b0f' : '#f5f5f7';
}

/** 在应用启动时调用一次，并监听系统主题变化。 */
export function initTheme(): void {
  current = readStored();
  apply(current);

  if (typeof window !== 'undefined' && window.matchMedia && !mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      apply(current);
      listeners.forEach((fn) => fn());
    };
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onChange);
    else mediaQuery.addListener(onChange);
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): ThemeMode {
  return current;
}

function getServerSnapshot(): ThemeMode {
  return 'system';
}

export function setTheme(mode: ThemeMode): void {
  current = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  apply(mode);
  listeners.forEach((fn) => fn());
}

export function toggleTheme(): void {
  const next: ThemeMode = resolveTheme(current) === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

export function useTheme() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    mode,
    resolved: resolveTheme(mode),
    setTheme,
    toggleTheme,
  };
}
