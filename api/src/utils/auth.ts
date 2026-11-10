import crypto from 'crypto';

/**
 * 轻量鉴权工具：scrypt 密码哈希 + HMAC 签名 token。
 * 不引第三方依赖，方便直接部署到云函数 / 容器。
 * 生产环境务必通过 AUTH_SECRET 注入随机密钥。
 */

const SECRET = process.env.AUTH_SECRET || 'dev-only-secret-change-before-deploy';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

/** 手写 base64url，避免依赖较新版本的 Node 类型定义 */
function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function isHashed(stored: string): boolean {
  return /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  if (isHashed(stored)) {
    const [, salt, expected] = stored.split('$');
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(actual, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // 兼容改造前遗留的明文密码，登录成功后由调用方升级为哈希
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface TokenPayload {
  uid: number;
  exp: number;
}

export function signToken(uid: number): string {
  const payload = toBase64Url(JSON.stringify({ uid, exp: Date.now() + TOKEN_TTL_MS }));
  const signature = toBase64Url(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verifyToken(token?: string | null): TokenPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = toBase64Url(crypto.createHmac('sha256', SECRET).update(payload).digest());
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(fromBase64Url(payload).toString('utf8')) as TokenPayload;
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** 从 Authorization: Bearer xxx 中取出 token */
export function bearerOf(header?: string): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

/** 注册信息校验，返回错误文案或 null */
export function validateRegistration(input: {
  username?: string;
  password?: string;
  email?: string;
}): string | null {
  const { username, password, email } = input;
  if (!username || !password) return '用户名和密码不能为空';
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return '用户名需为 3-20 位字母、数字或下划线';
  }
  if (password.length < 8) return '密码至少需要 8 位';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确';
  return null;
}
