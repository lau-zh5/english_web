import { ReactNode } from 'react';
import { apiFetch, mediaUrl, clearSession } from '../lib/api';
import { useTheme } from '../lib/theme';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Headphones, FileText, Home, Menu, X, LogOut, User, Moon, Sun, Monitor, Database } from 'lucide-react';
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
  const { mode, resolved, setTheme, toggleTheme } = useTheme();
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass hover:shadow-lg transition-all"
      >
        {sidebarOpen ? <X size={24} className="text-secondary" /> : <Menu size={24} className="text-secondary" />}
      </button>

      {/* 任意端口 / 任意设备上都能直接切换主题，不必先展开侧栏 */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl glass text-secondary hover:text-primary transition-all"
        title={resolved === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        aria-label="切换主题"
      >
        {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 glass transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
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

        <nav className="mt-8 px-3">
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
          
          <div className="mt-3 px-2">
            <p className="text-xs font-medium text-tertiary mb-2 px-2">外观</p>
            <div className="flex items-center gap-1 p-1 rounded-2xl surface-glass">
              {([
                { key: 'light', label: '浅色', icon: Sun },
                { key: 'dark', label: '深色', icon: Moon },
                { key: 'system', label: '自动', icon: Monitor },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  aria-pressed={mode === key}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    mode === key ? 'text-white shadow-md' : 'text-secondary hover:text-primary'
                  }`}
                  style={mode === key ? { background: 'var(--accent)' } : undefined}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
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
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
