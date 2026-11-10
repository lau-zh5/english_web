/// <reference types="vite/client" />

/**
 * 全站统一的地址层。
 *
 * 设计目标：无论从 5173(dev)、4173(preview)、还是部署后的域名/云函数地址打开，
 * 前端都只认「同源相对路径」，由网关或 vite proxy 转发到后端。
 * 这样端口、域名变化不会影响样式与资源加载。
 */

const configured = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();

/** API 根路径。默认同源 /api；上云时通过 VITE_API_BASE 指向云端 HTTP 服务。 */
export const API_BASE = configured ? configured.replace(/\/+$/, '') : '/api';

/** 用户产生的媒体（头像 / 音频 / PDF）统一前缀，与后端 /media 静态路由一一对应。 */
export const MEDIA_BASE = '/media';

/** 站点自带静态资源（public/ 下），一律用根相对路径，不依赖后端。 */
export function assetUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 把历史上三套混乱的媒体路径归一化成 /media/...：
 *   /info/pic/a.jpg      -> /media/pic/a.jpg
 *   /chapter-audio/a.mp3 -> /media/chapter-audio/a.mp3
 *   /music/a.mp3         -> /media/music/a.mp3
 *   /info/ebooks/a.pdf   -> /media/ebooks/a.pdf
 * 已经是完整 URL / data: / blob: 的原样返回。
 */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;

  let p = path.replace(/\\/g, '/').trim();
  p = p.replace(/^\/api\//, '');
  p = p.replace(/^\/info\//i, '');
  p = p.replace(/^\/?media\//i, '');
  p = p.replace(/^\/+/, '');

  return p ? `${MEDIA_BASE}/${p}` : '';
}

export interface Session {
  token: string;
  id: number | string;
  username: string;
  email?: string;
  avatar?: string;
}

const SESSION_KEY = 'english_session';
/** 兼容老版本：部分页面仍读 localStorage.user */
const LEGACY_USER_KEY = 'user';

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as Session;
    const legacy = localStorage.getItem(LEGACY_USER_KEY);
    if (legacy) return JSON.parse(legacy) as Session;
  } catch {
    // ignore broken storage
  }
  return null;
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // 过渡期保留旧键，避免其它页面读不到登录态
  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify({
      id: session.id,
      username: session.username,
      email: session.email,
      avatar: session.avatar,
    }),
  );
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

/** 只拼 URL 不发请求，用于 <audio>/<iframe> 这类需要 src 的场景。 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 统一请求入口：自动拼 API 根、自动带 token、自动处理 JSON 头。 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);

  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getSession()?.token;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...init, headers });
}

/** 带错误信息的 JSON 请求，注册/登录等表单场景使用。 */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.error || `请求失败 (${response.status})`);
  }
  return data as T;
}
