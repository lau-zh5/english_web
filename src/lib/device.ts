import { useEffect, useState } from 'react';

/** 用户可覆盖的布局偏好；auto = 跟随屏幕宽度自动判断设备类型 */
export type LayoutMode = 'auto' | 'phone' | 'tablet' | 'desktop';
export type EffectiveLayout = Exclude<LayoutMode, 'auto'>;

const STORAGE_KEY = 'english_layout_mode';
const CHANGE_EVENT = 'english:layoutmodechange';

const VALID: LayoutMode[] = ['auto', 'phone', 'tablet', 'desktop'];

export function getLayoutMode(): LayoutMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as LayoutMode | null;
    return v && VALID.includes(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function setLayoutMode(mode: LayoutMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* 隐私模式下 localStorage 不可写，忽略即可 */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function detectLayout(width: number): EffectiveLayout {
  if (width < 768) return 'phone';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * 当前生效的布局。
 * 自动模式：iPhone < 768 → phone；iPad 竖屏 768~1023 → tablet；
 * iPad 横屏 / Windows ≥ 1024 → desktop。
 * 手动模式：忽略屏幕宽度，返回用户选择的版式。
 */
export function useEffectiveLayout(): { layout: EffectiveLayout; mode: LayoutMode; width: number } {
  const [mode, setMode] = useState<LayoutMode>(getLayoutMode);
  const [width, setWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    const onModeChange = () => setMode(getLayoutMode());
    window.addEventListener('resize', onResize);
    window.addEventListener(CHANGE_EVENT, onModeChange);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener(CHANGE_EVENT, onModeChange);
    };
  }, []);

  const layout: EffectiveLayout = mode === 'auto' ? detectLayout(width) : mode;

  useEffect(() => {
    // layoutMode = 用户选择（含 auto），layout = 实际生效版式
    // CSS 的「强制手机版」收窄规则只认 layoutMode，避免误伤自动模式下的真实手机
    document.body.dataset.layoutMode = mode;
    document.body.dataset.layout = layout;
  }, [mode, layout]);

  return { layout, mode, width };
}

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  auto: '自动',
  phone: '手机',
  tablet: '平板',
  desktop: '电脑',
};
