import { ReactNode, useEffect, useRef, useState } from 'react';
import { apiFetch, mediaUrl, clearSession } from '../lib/api';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
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
 *   phone   (<768)  顶部标题栏（左上角头像 → 设置/退出登录二级菜单）+ 底部 5 项标签栏，无侧栏/抽屉
 *   tablet  (768~1023) 常驻紧凑侧栏（图标 + 小字），内容区留出更多宽度
 *   desktop (>=1024) 常驻完整侧栏（含每日一句、头像、退出）
 * 也可通过右上角「界面版式」手动覆盖，偏好按浏览器本地存储。
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { layout } = useEffectiveLayout();
  const isPhone = layout === 'phone';
  const isTablet = layout === 'tablet';

  const [dailyQuote, setDailyQuote] = useState<{ content: string; author: string; source?: string }>({
    content: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    source: undefined,
  });
  const { currentUser, loadCurrentUser } = useStore();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // 账号菜单：点外部 / 按 Esc / 换页时自动收起
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [location.pathname]);

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

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  // 手机端没有侧栏：aside 只服务平板与桌面
  const sidebarClass = `fixed left-0 top-0 z-40 h-full glass transition-transform duration-300 ease-in-out ${
    isTablet ? 'w-[88px] translate-x-0' : 'w-72 translate-x-0'
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
      {/* 手机版：顶部标题栏，左上角头像 → 设置/退出登录，居中 Logo；导航交给底部标签栏 */}
      {isPhone && (
        <header className="lq-appbar">
          <div className="lq-appbar-account" ref={accountRef}>
            <button
              type="button"
              className="lq-appbar-avatar"
              aria-label="账号菜单"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((v) => !v)}
            >
              {currentUser?.avatar ? (
                <img src={mediaUrl(currentUser.avatar)} alt="" />
              ) : (
                <User size={18} />
              )}
            </button>

            {accountMenuOpen && (
              <div className="lq-account-menu" role="menu">
                <p className="lq-account-menu-name">{currentUser?.username || '我的账号'}</p>
                <div className="lq-account-menu-divider" />
                <Link
                  to="/profile"
                  className="lq-account-menu-item"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <Settings size={16} />
                  设置
                </Link>
                <button
                  type="button"
                  className="lq-account-menu-item is-danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>

          <Link to="/" className="lq-appbar-title">
            <Logo size="sm" />
            <span>English</span>
          </Link>
        </header>
      )}

      {/* 主题按钮 / 版式切换由 App 根部统一提供，所有页面共用一份 */}

      {!isPhone && (
        <aside className={sidebarClass} aria-label="主导航">
          <div className={isTablet ? 'flex justify-center px-2 pt-5 pb-0' : 'px-6 pt-6 pb-0'}>
            <Link
              to="/"
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
      )}

      <main className={mainClass}>
        <div className={contentClass}>{children}</div>
      </main>

      {isPhone && <TabBar />}
    </div>
  );
}
