import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { apiJson, setSession, type Session } from '../lib/api';

type Mode = 'login' | 'register' | 'forgot';

interface AuthResponse extends Session {
  error?: string;
}

interface HealthResponse {
  emailVerification?: {
    enabled?: boolean;
    codeTtlSeconds?: number;
    resendSeconds?: number;
  };
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 邮箱验证码是可选能力：从云端健康接口读取开关，没配 SES 时保持原来的两步注册
  useEffect(() => {
    let alive = true;
    apiJson<HealthResponse>('/health')
      .then((d) => { if (alive) setEmailEnabled(Boolean(d.emailVerification?.enabled)); })
      .catch(() => { if (alive) setEmailEnabled(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setCode('');
    setConfirmPassword('');
    setCooldown(0);
  };

  const showError = (err: unknown) => {
    setError(err instanceof Error ? err.message : '网络错误，请稍后重试');
  };

  const sendCode = async () => {
    setError('');
    setNotice('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('请先填写正确的邮箱地址');
      return;
    }
    setSending(true);
    try {
      await apiJson('/users/send-code', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          scene: mode === 'forgot' ? 'reset' : 'register',
        }),
      });
      setCooldown(60);
      setNotice('验证码已发送，10 分钟内有效；没收到请检查垃圾箱');
    } catch (err) {
      showError(err);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (mode === 'forgot') {
      if (!EMAIL_RE.test(email.trim())) { setError('请填写正确的邮箱地址'); return; }
      if (!code.trim()) { setError('请填写邮箱验证码'); return; }
      if (password.length < 8) { setError('新密码至少需要 8 位'); return; }
      if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
      setLoading(true);
      try {
        await apiJson('/users/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
        });
        setPassword('');
        setConfirmPassword('');
        switchMode('login');
        setNotice('密码已重置，请用新密码登录');
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!USERNAME_RE.test(username)) { setError('用户名需为 3-20 位字母、数字或下划线'); return; }
      if (emailEnabled && !EMAIL_RE.test(email.trim())) { setError('请填写正确的邮箱地址'); return; }
      if (email && !EMAIL_RE.test(email.trim())) { setError('邮箱格式不正确'); return; }
      if (password.length < 8) { setError('密码至少需要 8 位'); return; }
      if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
      if (emailEnabled && !code.trim()) { setError('请填写邮箱验证码'); return; }
      setLoading(true);
      try {
        const data = await apiJson<AuthResponse>('/users/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            email: email.trim() || undefined,
            ...(emailEnabled ? { code: code.trim() } : {}),
          }),
        });
        setSession({
          token: data.token,
          id: data.id,
          username: data.username,
          email: data.email,
        });
        navigate('/');
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!username.trim()) { setError('请输入用户名或邮箱'); return; }
    setLoading(true);
    try {
      // 后端同时支持用户名与邮箱，统一用 account 字段
      const data = await apiJson<AuthResponse>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ account: username.trim(), password }),
      });
      setSession({
        token: data.token,
        id: data.id,
        username: data.username,
        email: data.email,
      });
      navigate('/');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 input-apple';

  const needsCode = (mode === 'register' && emailEnabled) || mode === 'forgot';

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

      {/* 主题按钮由应用根部的 <ThemeToggle /> 统一提供，此处不再重复 */}

      {/* ui-scope 放在卡片容器上，使右上角的全站主题按钮不受控件体系影响 */}
      <div className="ui-scope relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <Logo size="lg" />
            <h1 className="mt-4 text-2xl font-semibold text-primary tracking-tight">English</h1>
            <p className="mt-1.5 text-sm text-tertiary">开启你的英语学习之旅</p>
          </div>

          {/* 两个独立玻璃按钮，中间留空，不再共用一个分段胶囊 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`lq-auth-tab w-full py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  mode === m ? 'lq-btn--primary text-white' : 'lq-auth-tab--idle'
                }`}
              >
                {m === 'login' ? '登录' : '注册账号'}
              </button>
            ))}
          </div>

          {mode === 'forgot' && (
            <div className="flex items-center gap-3 mb-5 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="lq-auth-tab lq-auth-tab--idle px-3 py-1.5 rounded-xl text-xs font-medium"
              >
                返回登录
              </button>
              <span className="font-semibold text-primary">找回密码</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">
                  {mode === 'login' ? '用户名或邮箱' : '用户名'}
                </label>
                <input
                  type="text"
                  autoComplete={mode === 'login' ? 'username' : 'off'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'login' ? '用户名或注册邮箱' : '3-20 位字母、数字或下划线'}
                  className={inputClass}
                />
              </div>
            )}

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">
                  邮箱{' '}
                  <span className="opacity-70">
                    （{(mode === 'forgot' || emailEnabled) ? '必填' : '选填'}）
                  </span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'forgot' ? '输入注册时填写的邮箱' : '用于验证账号与找回密码'}
                  className={inputClass}
                />
              </div>
            )}

            {needsCode && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">邮箱验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 位数字"
                    className={`${inputClass} flex-1 min-w-0`}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sending || cooldown > 0}
                    className="lq-auth-tab lq-auth-tab--idle flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? '发送中...' : cooldown > 0 ? `${cooldown}s 后重发` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">
                {mode === 'forgot' ? '新密码' : '密码'}
              </label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                className={inputClass}
              />
            </div>

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1.5 ml-1">确认密码</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再输入一次"
                  className={inputClass}
                />
              </div>
            )}

            {mode === 'login' && emailEnabled && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  忘记密码？
                </button>
              </div>
            )}

            {notice && (
              <div
                className="px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--lq-accent-soft)', color: 'var(--text-1)' }}
                role="status"
              >
                {notice}
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
                ? mode === 'login' ? '登录中...' : mode === 'register' ? '注册中...' : '提交中...'
                : mode === 'login' ? '登录' : mode === 'register' ? '创建账号' : '重置密码'}
            </button>
          </form>

          <div className="flex items-start gap-2 mt-5 px-1 text-xs text-tertiary leading-relaxed">
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <span>
              {mode === 'forgot'
                ? '验证码只会发送到你注册时填写的邮箱，10 分钟内有效；重置后请用新密码登录。'
                : mode === 'register'
                  ? '账号信息经加密存储，写入云端账号；同一账号可在 iPhone、iPad、Windows 上同步学习数据。'
                  : '支持用户名或邮箱登录，登录后可继续你的学习进度，数据来自云端账号。'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
