import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

/**
 * 全站唯一的主题切换入口，挂在应用根部（所有路由之外）。
 * 固定在视口右上角，滚动时不移动；登录页、内页、未来新增页面都自动覆盖。
 * 内容区由 Layout 统一预留 pt-14，登录卡片自带垂直居中，均不会被遮挡。
 */
export function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="lq-theme-toggle fixed top-2.5 right-3 z-[60] flex h-9 w-9 items-center justify-center rounded-xl glass text-secondary shadow-md hover:text-primary hover:shadow-lg transition-all"
      title={resolved === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      aria-label="切换主题"
    >
      {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
