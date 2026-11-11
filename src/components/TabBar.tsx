import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, LogOut, User } from 'lucide-react';
import { navItems } from './nav';
import { clearSession, mediaUrl } from '../lib/api';
import { useStore } from '../store';

/**
 * 手机版底部标签栏（iOS 风格）。
 * 只在 layout === 'phone' 时渲染；固定在视口底部，自带 Home Indicator 安全区留白。
 * 第一行：主导航；第二行：头像/我的 + 退出账号（对应桌面侧栏底部的两项功能）。
 */
export function TabBar() {
  const { pathname } = useLocation();
  const { currentUser } = useStore();

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  return (
    <nav className="lq-tabbar" aria-label="主导航">
      <div className="lq-tabbar-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`lq-tabbar-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={23} strokeWidth={isActive ? 2.3 : 1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="lq-tabbar-account">
        <Link
          to="/profile"
          className={`lq-tabbar-account-user${pathname === '/profile' ? ' is-active' : ''}`}
          aria-current={pathname === '/profile' ? 'page' : undefined}
        >
          <span className="lq-tabbar-avatar">
            {currentUser?.avatar ? (
              <img src={mediaUrl(currentUser.avatar)} alt="头像" />
            ) : (
              <User size={15} />
            )}
          </span>
          <span className="lq-tabbar-account-name">{currentUser?.username || '我的'}</span>
          <ChevronRight size={14} className="lq-tabbar-account-chevron" />
        </Link>
        <button type="button" onClick={handleLogout} className="lq-tabbar-logout">
          <LogOut size={15} />
          退出账号
        </button>
      </div>
    </nav>
  );
}
