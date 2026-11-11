import { ReactNode, useEffect, useState } from 'react';
import { apiFetch, mediaUrl, clearSession } from '../lib/api';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, User, X } from 'lucide-react';
import { Logo } from './Logo';
import { TabBar } from './TabBar';
import { navItems } from './nav';
import { useEffectiveLayout } from '../lib/device';
import { useStore } from '../store';

interface LayoutProps {
  children: ReactNode;
}

/**
 * 三套版式共用一份导航数据：
 *   phone   (<768)  顶部标题栏 + 底部标签栏 + 侧滑抽屉（每日一句 / 我的 / 退出）
 *   tablet  (768~1023) 常驻紧凑侧栏（图标 + 小字），内容区留出更多宽度
 *   desktop (>=1024) 常驻完整侧栏
 * 也可通过右上角「界面版式」手动覆盖，偏好按浏览器本地存储。
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { layout } = useEffectiveLayout();
  const isPhone = layout === 'phone';
  const isTablet = layout === 'tablet';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<{ content: string; author: string; source?: string }>({
    content: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    source: undefined,
  });
  const { currentUser, loadCurrentUser } = useStore();

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        const response = await apiFetch('/quotes/daily');
        if (response.ok) setDailyQuote(await response.json());
      } catch (error) {
        console.error('Failed to fetch daily quote:', error);
      }
    };
    fetchDailyQuote();
  }, []);

  // 切换路由或切换版式后收起抽屉，避免平板/桌面留下遮罩
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, layout]);

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  const sidebarClass = `fixed left-0 top-0 z-40 h-full glass transition-transform duration-300 ease-in-out ${
    isTablet
      ? 'w-[88px] translate-x-0'
      : isPhone
        ? `w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : 'w-72 translate-x-0'
  }`;

  const mainClass = `ui-scope min-h-screen ${
    isTablet ? 'ml-[88px]' : !isPhone ? 'ml-72' : ''
  }`;

  const contentClass = isPhone
    ? 'px-4 pb-28 pt-16'
    : isTablet
      ? 'px-6 pb-8 pt-14'
      : 'px-8 pb-8 pt-14';

  return (
    <div className="min-h-screen">
      {/* 手机版：顶部标题栏 + 汉堡入口 */}
      {isPhone && (
        <>
          <header className="lq-appbar">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lq-appbar-btn"
              aria-label={sidebarOpen ? '关闭菜单' : '打开菜单'}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/" className="lq-appbar-title" onClick={() => setSidebarOpen(false)}>
              <Logo size="sm" />
              <span>English</span>
            </Link>
          </header>
        </>
      )}

      {/* 主题按钮 / 版式切换由 App 根部统一提供，所有页面共用一份 */}

      <aside className={sidebarClass} aria-label="主导航">
        <div className={isTablet ? 'flex justify-center px-2 pt-5 pb-0' : 'px-6 pt-6 pb-0'}>
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <div className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Logo size={isTablet ? 'md' : 'lg'} />
            </div>
            {!isTablet && (
              <h1 className="font-bold text-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                English
              </h1>
            )}
          </Link>
        </div>

        <nav className={isTablet ? 'mt-4 space-y-1 px-2' : 'mt-3 px-3'}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            if (isTablet) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`lq-side-compact${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 transform scale-105'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105'
                }`}
              >
                <Icon size={20} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                <span className="font-medium transition-all duration-300 group-hover:font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!isTablet && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="p-4 rounded-2xl surface-glass">
              <p className="text-xs font-medium text-tertiary">每日一句</p>
              <p className="text-sm text-secondary mt-2 italic leading-relaxed">
                &quot;{dailyQuote.content}&quot;
              </p>
              <p className="text-xs text-tertiary mt-2">— {dailyQuote.author}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  {currentUser?.avatar ? (
                    <img src={mediaUrl(currentUser.avatar)} alt="头像" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                  {currentUser?.username || '用户'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">退出</span>
              </button>
            </div>
          </div>
        )}

        {/* 平板紧凑侧栏：底部只保留头像与退出，点击热区仍为 44px */}
        {isTablet && (
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-2">
            <Link to="/profile" title="我的" className="lq-side-avatar">
              {currentUser?.avatar ? (
                <img src={mediaUrl(currentUser.avatar)} alt="头像" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </Link>
            <button onClick={handleLogout} title="退出" aria-label="退出" className="lq-side-logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </aside>

      {isPhone && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={mainClass}>
        <div className={contentClass}>{children}</div>
      </main>

      {isPhone && <TabBar />}
    </div>
  );
}
