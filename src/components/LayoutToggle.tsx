import { Check, Monitor } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  getLayoutMode,
  LAYOUT_LABELS,
  setLayoutMode,
  type LayoutMode,
  useEffectiveLayout,
} from '../lib/device';

const OPTIONS: LayoutMode[] = ['auto', 'phone', 'tablet', 'desktop'];

/**
 * 全站唯一的「界面版式」切换入口，固定在右上角（主题按钮左侧）。
 * 默认「自动」按屏幕宽度切换手机版 / 平板版 / 电脑版；
 * 也可手动指定，偏好写入 localStorage，三端各自记忆。
 */
export function LayoutToggle() {
  const { layout, mode } = useEffectiveLayout();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LayoutMode>(getLayoutMode);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const title = `界面版式：${mode === 'auto' ? `自动（${LAYOUT_LABELS[layout]}）` : LAYOUT_LABELS[layout]}`;

  return (
    <div className="fixed right-14 top-2.5 z-[60]" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="lq-theme-toggle flex h-9 w-9 items-center justify-center rounded-xl glass text-secondary shadow-md hover:text-primary hover:shadow-lg transition-all"
        title={title}
        aria-label="切换界面版式"
        aria-expanded={open}
      >
        <Monitor size={18} />
      </button>

      {open && (
        <div className="lq-menu lq-layout-menu" role="menu">
          <p className="lq-layout-menu-title">界面版式</p>
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              role="menuitemradio"
              aria-checked={selected === opt}
              onClick={() => {
                setSelected(opt);
                setLayoutMode(opt);
                setOpen(false);
              }}
              className="lq-menu-item"
            >
              <span>{LAYOUT_LABELS[opt]}</span>
              {selected === opt && <Check size={15} />}
            </button>
          ))}
          <p className="lq-layout-menu-hint">自动：手机 / 平板 / 电脑按屏幕切换</p>
        </div>
      )}
    </div>
  );
}
