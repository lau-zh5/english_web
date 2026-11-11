import { Link, useLocation } from 'react-router-dom';
import { navItems } from './nav';

/**
 * 手机版底部标签栏（iOS 风格）。
 * 只在 layout === 'phone' 时渲染；固定在视口底部，自带 Home Indicator 安全区留白。
 */
export function TabBar() {
  const { pathname } = useLocation();

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
    </nav>
  );
}
