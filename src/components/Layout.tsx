import { ReactNode } from 'react';
import { apiFetch, mediaUrl, clearSession } from '../lib/api';
import { useTheme } from '../lib/theme';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Headphones, FileText, Home, Menu, X, LogOut, User, Moon, Sun, Database } from 'lucide-react';
import { Logo } from './Logo';
import { useState, useEffect } from 'react';
import { useStore } from '../store';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/vocabulary', label: '单词本', icon: BookOpen },
  { path: '/listening', label: '听力训练', icon: Headphones },
  { path: '/reading', label: '阅读理解', icon: FileText },
  { path: '/data', label: '我的数据', icon: Database },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<{content: string; author: string; source?: string}>({
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    source: undefined
  });
  const { resolved, toggleTheme } = useTheme();
  const { currentUser, loadCurrentUser } = useStore();

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        const response = await apiFetch('/quotes/daily');
        if (response.ok) {
          const data = await response.json();
          setDailyQuote(data);
        }
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

  return (
    <div className="min-h-screen">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-2.5 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl glass shadow-md hover:shadow-lg transition-all"
      >
        {sidebarOpen ? <X size={18} className="text-secondary" /> : <Menu size={18} className="text-secondary" />}
      </button>

      {/* 全站唯一的主题切换入口：固定在视口右上角。
          内容区统一预留 pt-14（56px），按钮仅占 10~46px，不会压住首页日期等顶部内容。 */}
      <button
        onClick={toggleTheme}
        className="fixed top-2.5 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl glass text-secondary shadow-md hover:text-primary hover:shadow-lg transition-all"
        title={resolved === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        aria-label="切换主题"
      >
        {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 glass transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo 图片自带透明留白，去掉容器底部内边距，避免与下方菜单之间出现大块空白 */}
        <div className="px-6 pt-6 pb-0">
          <Link 
            to="/" 
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <div className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Logo size="lg" />
            </div>
            <h1 className="font-bold text-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
              English
            </h1>
          </Link>
        </div>

        <nav className="mt-3 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
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

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-2xl surface-glass">
            <p className="text-xs font-medium text-tertiary">每日一句</p>
            <p className="text-sm text-secondary mt-2 italic leading-relaxed">
              "{dailyQuote.content}"
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
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">{currentUser?.username || '用户'}</span>
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
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-72 min-h-screen">
        <div className="px-4 pb-4 pt-14 lg:px-8 lg:pb-8 lg:pt-14">{children}</div>
      </main>
    </div>
  );
}
