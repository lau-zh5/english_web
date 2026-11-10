import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiJson, setSession, type Session } from '../lib/api';
import { useTheme } from '../lib/theme';

type Mode = 'login' | 'register';

interface AuthResponse extends Session {
  error?: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();
  const { resolved, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!USERNAME_RE.test(username)) {
      setError('用户名需为 3-20 位字母、数字或下划线');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位');
      return;
    }
    if (mode === 'register') {
      if (email && !EMAIL_RE.test(email)) {
        setError('邮箱格式不正确');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        mode === 'login'
          ? { username, password }
          : { username, password, email: email || undefined };

      // 走统一 API 层：本地为 /api，上云后只需把 VITE_API_BASE 指向云端 HTTP 服务，
      // 注册信息即写入云端数据库，无需改动这里的代码。
      const data = await apiJson<AuthResponse>(
        mode === 'login' ? '/users/login' : '/users/register',
        { method: 'POST', body: JSON.stringify(payload) },
      );

      setSession({
        token: data.token,
        id: data.id,
        username: data.username,
        email: data.email,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 input-apple';

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* 玻璃质感所需的光晕，纯 CSS，不依赖任何外部图片 */}
      <div
        className="pointer-events-none absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-60"
        style={{ background: 'var(--orb-1)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60"
        style={{ background: 'var(--orb-2)' }}
      />

      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-20 p-2.5 rounded-xl glass text-secondary hover:text-primary transition-all"
        title={resolved === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        aria-label="切换主题"
      >
        {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <Logo size="lg" />
            <h1 className="mt-4 text-2xl font-semibold text-primary tracking-tight">English</h1>
            <p className="mt-1.5 text-sm text-tertiary">开启你的英语学习之旅</p>
          </div>

          <div className="flex p-1 mb-6 rounded-2xl" style={{ background: 'var(--input-bg)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  mode === m ? 'text-white shadow-md' : 'text-secondary hover:text-primary'
                }`}
                style={mode === m ? { background: 'var(--accent)' } : undefined}
              >
                {m === 'login' ? '登录' : '注册账号'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">用户名</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3-20 位字母、数字或下划线"
                className={inputClass}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">
                  邮箱 <span className="opacity-70">（选填）</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="用于找回账号"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">密码</label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                className={inputClass}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">确认密码</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再输入一次密码"
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <div
                className="px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--danger)', color: '#fff' }}
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? mode === 'login'
                  ? '登录中...'
                  : '注册中...'
                : mode === 'login'
                  ? '登录'
                  : '创建账号'}
            </button>
          </form>

          <div className="flex items-start gap-2 mt-5 px-1 text-xs text-tertiary leading-relaxed">
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <span>
              {mode === 'register'
                ? '账号信息经加密存储，写入云端账号；同一账号可在 iPhone、iPad、Windows 上同步学习数据。'
                : '登录后可继续你的学习进度，数据来自云端账号。'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
