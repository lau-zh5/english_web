'use strict';

/**
 * English Web · CloudBase 免费环境 HTTP 云函数
 * ------------------------------------------------------------
 * 用文档型数据库（NoSQL）替代原项目 MySQL，全程落在免费版资源点内。
 * 前端无需改动：把 HTTP 访问服务的 /api/* 指到本函数即可同源调用。
 *
 * 集合：users / wordbooks / chapters / words / articles / questions /
 *       study_records / notes / audios / ebooks / daily_quotes / email_codes
 * 每条业务数据都带 userId，实现三端同账号共享、不同账号隔离。
 *
 * 部署后务必在云函数「环境变量」里设置 AUTH_SECRET（随机长字符串）。
 * 邮箱验证码为可选能力：配齐 SES_* 四个环境变量后自动启用，未配置时
 * 注册流程保持原样（不会把已有账号挡在门外）。详见下方 emailConfig()。
 */

const crypto = require('crypto');
const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();

const SECRET = process.env.AUTH_SECRET || 'dev-only-please-set-AUTH_SECRET';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DATA_COLLECTIONS = [
  'wordbooks',
  'chapters',
  'words',
  'articles',
  'questions',
  'study_records',
  'notes',
  'audios',
  'ebooks',
];
const ALL_COLLECTIONS = ['users', 'daily_quotes', 'email_codes', ...DATA_COLLECTIONS];

const QUOTES = [
  ['The only way to do great work is to love what you do.', 'Steve Jobs'],
  ['Stay hungry, stay foolish.', 'Steve Jobs'],
  ['The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'],
  ['It is during our darkest moments that we must focus to see the light.', 'Aristotle'],
  ['The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb'],
  ['Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill'],
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json; charset=utf-8',
};

/* ------------------------------ 工具 ------------------------------ */

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function unb64url(input) {
  return Buffer.from(String(input).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function isHashed(stored) {
  return /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored || '');
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (isHashed(stored)) {
    const [, salt, expected] = stored.split('$');
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(actual, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signToken(uid) {
  const payload = b64url(JSON.stringify({ uid: String(uid), exp: Date.now() + TOKEN_TTL_MS }));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(unb64url(payload).toString('utf8'));
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function lowerKeys(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) out[k.toLowerCase()] = v;
  return out;
}

function bearerOf(headers) {
  const raw = headers.authorization || headers.Authorization;
  const m = /^Bearer\s+(.+)$/i.exec(raw || '');
  return m ? m[1] : null;
}

function uidOf(headers) {
  const payload = verifyToken(bearerOf(headers));
  return payload ? String(payload.uid) : 'public';
}

/* ----------------------- 邮箱验证 / 腾讯云 SES -----------------------
 * 国内版 SES 的 SendEmail 默认只允许「模板发送」（Simple 仅对历史特批
 * 账号开放），所以固定走 Template + TemplateData，模板变量用 {{code}}。
 * 用云 API 3.0 的 TC3-HMAC-SHA256 手写签名直调 HTTPS，避免为发一封
 * 验证码邮件引入整套腾讯云 SDK（免费环境依赖包越小越稳）。
 */
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_RESEND_MS = 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function emailConfig() {
  const secretId = process.env.SES_SECRET_ID || process.env.TCB_SECRET_ID || '';
  const secretKey = process.env.SES_SECRET_KEY || process.env.TCB_SECRET_KEY || '';
  const from = process.env.SES_FROM_ADDRESS || '';
  const templateId = process.env.SES_TEMPLATE_ID || '';
  return {
    // 四项配齐才启用；EMAIL_VERIFY_ENABLED=0 可随时一键回退到原注册流程
    enabled: process.env.EMAIL_VERIFY_ENABLED !== '0'
      && Boolean(secretId && secretKey && from && templateId),
    secretId,
    secretKey,
    from,
    templateId,
    region: process.env.SES_REGION || 'ap-guangzhou',
    endpoint: process.env.SES_ENDPOINT || 'ses.tencentcloudapi.com',
    replyTo: process.env.SES_REPLY_TO || '',
  };
}

function sha256hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function tc3Hmac(key, msg, encoding) {
  return crypto.createHmac('sha256', key).update(msg).digest(encoding);
}

function tc3Headers({ secretId, secretKey, endpoint, region, action, payload }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const service = 'ses';
  const contentType = 'application/json; charset=utf-8';
  const canonicalHeaders = `content-type:${contentType}\nhost:${endpoint}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = [
    'POST', '/', '', canonicalHeaders, signedHeaders, sha256hex(payload),
  ].join('\n');
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256', String(timestamp), credentialScope, sha256hex(canonicalRequest),
  ].join('\n');
  const secretDate = tc3Hmac(Buffer.from(`TC3${secretKey}`, 'utf8'), date);
  const secretService = tc3Hmac(secretDate, service);
  const secretSigning = tc3Hmac(secretService, 'tc3_request');
  const signature = tc3Hmac(secretSigning, stringToSign, 'hex');
  return {
    'Content-Type': contentType,
    Host: endpoint,
    Authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'X-TC-Action': action,
    'X-TC-Timestamp': String(timestamp),
    'X-TC-Version': '2020-10-02',
    'X-TC-Region': region,
  };
}

function httpsPostFallback(endpoint, headers, payload) {
  return new Promise((resolve, reject) => {
    // 只有运行时没有全局 fetch 时才会走到这里（Node 18 默认有）
    const https = require('https');
    const req = https.request(
      { hostname: endpoint, path: '/', method: 'POST', headers, timeout: 8000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    );
    req.on('timeout', () => req.destroy(new Error('SES 请求超时')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendSesCode(to, code, scene) {
  const cfg = emailConfig();
  const request = {
    FromEmailAddress: cfg.from,
    Destination: [to],
    Subject: scene === 'register' ? 'English 注册验证码' : 'English 重置密码验证码',
    Template: {
      TemplateID: Number(cfg.templateId),
      TemplateData: JSON.stringify({ code }),
    },
    TriggerType: 1,
  };
  if (cfg.replyTo) request.ReplyToAddresses = cfg.replyTo;

  const payload = JSON.stringify(request);
  const headers = tc3Headers({ ...cfg, action: 'SendEmail', payload });
  const text = typeof globalThis.fetch === 'function'
    ? await (async () => {
      const res = await globalThis.fetch(`https://${cfg.endpoint}/`, {
        method: 'POST', headers, body: payload,
      });
      const raw = await res.text();
      if (!res.ok) throw new Error(`SES HTTP ${res.status}: ${raw.slice(0, 200)}`);
      return raw;
    })()
    : await httpsPostFallback(cfg.endpoint, headers, payload);

  let parsed = {};
  try { parsed = JSON.parse(text); } catch { /* 空响应按失败处理 */ }
  const result = parsed.Response;
  if (!result || result.Error) {
    const detail = result && result.Error
      ? `${result.Error.Code}: ${result.Error.Message}`
      : '响应格式异常';
    throw new Error(`SES ${detail}`);
  }
  return result;
}

function codeHash(email, scene, code) {
  return crypto.createHmac('sha256', SECRET).update(`${email}|${scene}|${code}`).digest('hex');
}

async function emailCodeRecords(email, scene) {
  const r = await db.collection('email_codes').where({ email, scene }).limit(1000).get();
  return (r.data || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function issueCode(email, scene) {
  const now = Date.now();
  const records = await emailCodeRecords(email, scene);
  const latest = records[0];
  if (latest && now - (latest.createdAt || 0) < CODE_RESEND_MS) {
    fail(429, '验证码发送太频繁，请 60 秒后再试');
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const doc = {
    email,
    scene,
    codeHash: codeHash(email, scene, code),
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
    used: false,
    createdAt: now,
  };
  await db.collection('email_codes').add(doc);
  try {
    await sendSesCode(email, code, scene);
  } catch (e) {
    await db.collection('email_codes').where({ codeHash: doc.codeHash }).remove();
    console.error('[email] SES 发送失败：', e && e.message);
    fail(502, '验证码邮件发送失败，请稍后重试或联系管理员');
  }
  return { ok: true, expiresIn: Math.floor(CODE_TTL_MS / 1000) };
}

async function consumeCode(email, scene, raw) {
  const code = String(raw || '').trim();
  const records = await emailCodeRecords(email, scene);
  const record = records.find((d) => !d.used && d.expiresAt > Date.now());
  if (!record) fail(400, '验证码已过期，请重新获取');
  if ((record.attempts || 0) >= CODE_MAX_ATTEMPTS) {
    fail(429, '错误次数过多，请重新获取验证码');
  }
  if (codeHash(email, scene, code) !== record.codeHash) {
    await db.collection('email_codes').doc(record._id).update({
      attempts: (record.attempts || 0) + 1,
    });
    fail(400, '验证码不正确');
  }
  await db.collection('email_codes').doc(record._id).update({ used: true, usedAt: Date.now() });
  return true;
}

function validateRegistration({ username, password, email }) {
  if (!username || !password) return '用户名和密码不能为空';
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return '用户名需为 3-20 位字母、数字或下划线';
  if (password.length < 8) return '密码至少需要 8 位';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确';
  return null;
}

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function reply(status, data) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(data) };
}

/* --------------------------- 集合初始化 --------------------------- */

let initPromise = null;

function ready() {
  if (!initPromise) {
    initPromise = (async () => {
      for (const name of ALL_COLLECTIONS) {
        try {
          await db.createCollection(name);
        } catch (e) {
          // 已存在会报错，忽略即可
        }
      }
    })().catch((e) => {
      console.error('ensure collections failed:', e);
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

function normalize(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const out = { ...doc };
  if (out.id === undefined && out._id !== undefined) out.id = out._id;
  delete out.password;
  return out;
}

function sanitize(patch) {
  const out = { ...patch };
  delete out._id;
  delete out.id;
  delete out.userId;
  delete out.password;
  out.updatedAt = Date.now();
  return out;
}

/* ------------------------- 归属过滤（数据隔离） -------------------------
 * 外键字段有历史遗留的两种写法：早期 MySQL 导入的数据是数字 ID，
 * 云端新建的 wordbook / chapter 用的是字符串 _id。文档数据库等值查询
 * 严格区分类型，所以两种都查一遍再按 _id 去重合并，避免漏掉旧数据。
 */
function idCandidates(raw) {
  const s = String(raw);
  if (/^-?\d+$/.test(s) && String(Number(s)) === s && Number.isSafeInteger(Number(s))) {
    return [s, Number(s)];
  }
  return [s];
}

async function queryByFilters(col, base, filters, limit) {
  let combos = [{}];
  for (const [field, raw] of filters) {
    const next = [];
    for (const combo of combos) {
      for (const value of idCandidates(raw)) next.push({ ...combo, [field]: value });
    }
    combos = next;
  }

  const seen = new Set();
  const out = [];
  for (const combo of combos) {
    const r = await col.where({ ...base, ...combo }).limit(limit).get();
    for (const doc of r.data || []) {
      const key = doc._id != null ? String(doc._id) : JSON.stringify(doc);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(doc);
      }
    }
  }
  return out.slice(0, limit);
}

// 只有这些字段允许参与列表查询，避免把 limit 等控制参数当成数据条件
const LIST_FILTERS = {
  chapter_id: 'chapter_id', chapterId: 'chapter_id',
  wordbook_id: 'wordbook_id', wordbookId: 'wordbook_id',
  article_id: 'article_id', articleId: 'article_id',
  audio_id: 'audio_id', group_id: 'group_id', group_type: 'group_type',
  status: 'status', source_type: 'source_type', category: 'category',
  date: 'date', type: 'type',
};

function filtersFromQuery(query, extra = []) {
  const filters = [...extra];
  const used = new Set(extra.map(([field]) => field));
  for (const [key, raw] of Object.entries(query || {})) {
    const field = LIST_FILTERS[key];
    if (!field || used.has(field)) continue;
    if (raw === undefined || raw === null || raw === '' || Array.isArray(raw)) continue;
    used.add(field);
    filters.push([field, raw]);
  }
  return filters;
}

/* ------------------------------ 路由 ------------------------------ */

async function route(ctx) {
  const { method, path, headers, body, query } = ctx;
  const uid = uidOf(headers);

  if (method === 'OPTIONS') return reply(204, {});

  if (path === '/health' || path === '/') {
    return reply(200, {
      ok: true,
      service: 'english-api',
      database: 'cloudbase-document (free plan)',
      env: process.env.TCB_ENV || process.env.SCF_NAMESPACE || 'current',
      time: new Date().toISOString(),
      collections: ALL_COLLECTIONS,
      hasSecret: Boolean(process.env.AUTH_SECRET),
      emailVerification: {
        enabled: emailConfig().enabled,
        loginWithEmail: true,
        codeTtlSeconds: Math.floor(CODE_TTL_MS / 1000),
        resendSeconds: Math.floor(CODE_RESEND_MS / 1000),
      },
    });
  }

  await ready();

  /* ---------- 注册 / 登录 / 邮箱验证 ---------- */
  if (path === '/users/register' && method === 'POST') {
    const invalid = validateRegistration(body);
    if (invalid) return reply(400, { error: invalid });

    const cfg = emailConfig();
    const email = normalizeEmail(body.email);
    if (cfg.enabled) {
      if (!EMAIL_RE.test(email)) return reply(400, { error: '请填写正确的邮箱地址' });
      if (!String(body.code || '').trim()) return reply(400, { error: '请填写邮箱验证码' });
    }

    const users = db.collection('users');
    const exists = await users.where({ username: body.username }).count();
    if (exists.total > 0) return reply(409, { error: '该用户名已被注册，请换一个' });
    if (email) {
      const dupEmail = await users.where({ email }).count();
      if (dupEmail.total > 0) return reply(409, { error: '该邮箱已被注册，请直接登录或找回密码' });
    }

    if (cfg.enabled) await consumeCode(email, 'register', body.code);

    const now = Date.now();
    const doc = {
      username: body.username,
      email: email || null,
      password: hashPassword(body.password),
      emailVerified: cfg.enabled,
      avatar: null,
      dailyWordGoal: 20,
      dailyListeningGoal: 30,
      dailyReadingGoal: 3,
      createdAt: now,
      updatedAt: now,
    };
    const added = await users.add(doc);
    return reply(201, {
      token: signToken(added.id),
      id: added.id,
      username: doc.username,
      email: doc.email,
    });
  }

  if (path === '/users/login' && method === 'POST') {
    const users = db.collection('users');
    const account = String(body.account || body.username || '').trim();
    const byUsername = await users.where({ username: account }).limit(1).get();
    let user = byUsername.data && byUsername.data[0];
    // 允许用邮箱登录：用户名没命中时再按邮箱查一次
    if (!user && account) {
      const byEmail = await users.where({ email: normalizeEmail(account) }).limit(1).get();
      user = byEmail.data && byEmail.data[0];
    }
    if (!user || !verifyPassword(body.password || '', user.password)) {
      return reply(401, { error: '账号或密码错误' });
    }
    if (!isHashed(user.password)) {
      await users.doc(user._id).update({ password: hashPassword(body.password) });
    }
    return reply(200, {
      token: signToken(user._id),
      id: user._id,
      username: user.username,
      email: user.email || null,
    });
  }

  if (path === '/users/send-code' && method === 'POST') {
    if (!emailConfig().enabled) return reply(503, { error: '邮箱验证尚未启用' });
    const scene = body.scene === 'reset' ? 'reset' : 'register';
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) return reply(400, { error: '请填写正确的邮箱地址' });

    const users = db.collection('users');
    const found = await users.where({ email }).limit(1).get();
    const exists = Boolean(found.data && found.data[0]);
    if (scene === 'register' && exists) return reply(409, { error: '该邮箱已注册，请直接登录' });
    if (scene === 'reset' && !exists) return reply(404, { error: '该邮箱尚未注册' });

    return reply(200, await issueCode(email, scene));
  }

  if (path === '/users/reset-password' && method === 'POST') {
    if (!emailConfig().enabled) return reply(503, { error: '邮箱验证尚未启用' });
    const email = normalizeEmail(body.email);
    const newPassword = String(body.password || body.newPassword || '');
    if (!EMAIL_RE.test(email)) return reply(400, { error: '请填写正确的邮箱地址' });
    if (newPassword.length < 8) return reply(400, { error: '新密码至少需要 8 位' });

    const users = db.collection('users');
    const found = await users.where({ email }).limit(1).get();
    const user = found.data && found.data[0];
    if (!user) return reply(404, { error: '该邮箱尚未注册' });

    await consumeCode(email, 'reset', body.code);
    await users.doc(user._id).update({
      password: hashPassword(newPassword),
      updatedAt: Date.now(),
    });
    return reply(200, { ok: true });
  }

  /* ---------- 鉴权门槛 ----------
   * 健康检查 / 注册 / 登录 / 发码 / 重置密码之外，所有接口都必须携带有效 token。
   * 无 token 时 uidOf() 返回 'public'，此前会返回 200 + 空数据，
   * 且 /users/:id 可匿名读取他人档案，这里统一收敛为 401。
   */
  if (uid === 'public') {
    return reply(401, { error: '请先登录' });
  }

  const userMatch = /^\/users\/([^/]+)$/.exec(path);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    if (method === 'GET') {
      const r = await db.collection('users').doc(id).get();
      const user = r.data && (Array.isArray(r.data) ? r.data[0] : r.data);
      if (!user) return reply(404, { error: '用户不存在' });
      return reply(200, normalize(user));
    }
    if (method === 'PUT') {
      if (uid === 'public' || uid !== id) return reply(403, { error: '请先登录' });
      const patch = sanitize(body);
      await db.collection('users').doc(id).update(patch);
      return reply(200, { id, ...patch });
    }
  }

  if (/^\/users\/[^/]+\/avatar$/.test(path)) {
    return reply(501, { error: '头像上传将在接入云存储后开放；当前版本不包含用户上传的图片' });
  }

  /* ---------- 每日一句 / 分组 / 导出 ---------- */
  if (path === '/quotes/daily' && method === 'GET') {
    const day = Math.floor(Date.now() / 86400000) % QUOTES.length;
    return reply(200, { content: QUOTES[day][0], author: QUOTES[day][1] });
  }

  if (path === '/words/grouped/list' && method === 'GET') {
    const docs = await queryByFilters(
      db.collection('words'),
      { userId: uid },
      filtersFromQuery(query, [['group_type', query.group_type || 'polysemous']]),
      1000,
    );
    return reply(200, docs.map(normalize));
  }

  // 早期版本写入的单词可能没有 chapter_id / wordbook_id（ID 被 parseInt 弄坏），
  // 单独列出来，供前端提示用户归入某个章节，避免修复隔离后这些词「消失」。
  if (path === '/words/orphans' && method === 'GET') {
    const r = await db.collection('words').where({ userId: uid }).limit(1000).get();
    const docs = (r.data || []).filter((d) => {
      const v = d.chapter_id ?? d.chapterId;
      return v === undefined || v === null || v === '' || String(v) === 'NaN';
    });
    return reply(200, docs.map(normalize));
  }

  // 阅读生词：按来源筛选，不能被通用「按 _id 取单条」分支吞掉
  if (path === '/words/reading' && method === 'GET') {
    const docs = await queryByFilters(
      db.collection('words'),
      { userId: uid },
      [['source_type', 'reading']],
      1000,
    );
    return reply(200, docs.map(normalize));
  }

  if (path === '/data/export' && method === 'GET') {
    const snapshot = { exportedAt: new Date().toISOString(), userId: uid, collections: {} };
    for (const name of ALL_COLLECTIONS) {
      // 用户档案按 _id 取，业务数据按 userId 取
      const r = name === 'users'
        ? await db.collection(name).where({ _id: uid }).limit(10).get()
        : await db.collection(name).where({ userId: uid }).limit(1000).get();
      snapshot.collections[name] = (r.data || []).map((d) => normalize(d));
    }
    return reply(200, snapshot);
  }

  /* ---------- 媒体上传：免费版暂不接入云存储 ---------- */
  const mediaUpload = [
    '/ebooks/upload',
    '/words/audio',
    '/chapters/audio',
    '/users/avatar',
  ];
  if (mediaUpload.includes(path) && method === 'POST') {
    return reply(501, { error: '媒体上传尚未接入云存储，当前版本仅同步结构化学习数据' });
  }
  if (/^\/(audios\/stream|chapters\/[^/]+\/audio|words\/[^/]+\/audio)/.test(path)) {
    return reply(404, { error: '云端暂无该音频' });
  }
  if (/^\/ebooks\/[^/]+$/.test(path) && method === 'GET') {
    return reply(200, { url: '', title: '', message: '云端暂无该电子书' });
  }

  /* ---------- 通用集合 CRUD ---------- */
  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  const name = segments[0];
  const id = segments[1] ? decodeURIComponent(segments[1]) : null;

  if (!DATA_COLLECTIONS.includes(name)) {
    return reply(404, { error: `未知接口: ${method} ${path}` });
  }

  const col = db.collection(name);

  // 批量新增：/words/batch、/questions/batch
  const batchItems = Array.isArray(body.words) ? body.words
    : Array.isArray(body.questions) ? body.questions
      : Array.isArray(body.items) ? body.items : null;
  if (id === 'batch' && method === 'POST' && batchItems) {
    const now = Date.now();
    const created = [];
    for (const item of batchItems) {
      const doc = {
        ...item,
        userId: uid,
        wordbook_id: item.wordbook_id ?? body.wordbookId ?? body.wordbook_id,
        chapter_id: item.chapter_id ?? body.chapterId ?? body.chapter_id,
        article_id: item.article_id ?? body.articleId ?? body.article_id,
        status: item.status || 'new',
        createdAt: now,
        updatedAt: now,
      };
      // 一词多义 / 相似词组：整批共用 group_id，供 /words/grouped/list 聚合
      const groupType = item.group_type ?? body.group_type ?? body.groupType;
      const groupId = item.group_id ?? body.group_id ?? body.groupId;
      if (groupType) doc.group_type = groupType;
      if (groupId) doc.group_id = groupId;
      const added = await col.add(doc);
      created.push({ id: added.id, ...doc });
    }
    return reply(201, created);
  }

  // 按外键筛选：/chapters/wordbook/:id、/questions/article/:id、/notes/audio/:id
  if (segments.length >= 3 && method === 'GET') {
    const field = { wordbook: 'wordbook_id', article: 'article_id', audio: 'audio_id' }[segments[1]];
    if (field) {
      const value = decodeURIComponent(segments[2]);
      const docs = await queryByFilters(col, { userId: uid }, [[field, value]], 1000);
      return reply(200, docs.map(normalize));
    }
  }

  // 学习记录按日期查
  if (name === 'study_records' && id && method === 'GET') {
    const r = await col.where({ userId: uid, date: id }).limit(1).get();
    const one = (r.data || [])[0];
    return reply(200, one ? normalize(one) : {});
  }

  if (id && method === 'GET') {
    const r = await col.where({ _id: id, userId: uid }).limit(1).get();
    const one = (r.data || [])[0];
    return reply(200, one ? normalize(one) : {});
  }

  if (!id && method === 'GET') {
    // 关键：/words?chapter_id=X 必须只返回该章节的单词，
    // 否则所有单词书会互相串数据。
    const limit = Number(query.limit) || 1000;
    const docs = await queryByFilters(col, { userId: uid }, filtersFromQuery(query), limit);
    return reply(200, docs.map(normalize));
  }

  if (!id && method === 'POST') {
    const now = Date.now();
    const doc = { ...body, userId: uid, createdAt: now, updatedAt: now };
    const added = await col.add(doc);
    return reply(201, { id: added.id, ...doc });
  }

  if (id && method === 'PUT') {
    const patch = sanitize(body);
    const r = await col.where({ _id: id, userId: uid }).update(patch);
    if (!r.updated) return reply(404, { error: '记录不存在或无权修改' });
    return reply(200, { id, ...patch });
  }

  if (id && method === 'DELETE') {
    const r = await col.where({ _id: id, userId: uid }).remove();
    if (!r.deleted) return reply(404, { error: '记录不存在或无权删除' });
    return reply(200, { ok: true, id });
  }

  return reply(405, { error: `不支持的请求: ${method} ${path}` });
}

/* --------------------------- 事件入口 --------------------------- */

function parseEvent(event) {
  const headers = lowerKeys(event.headers || event.header || {});
  const method = String(
    event.httpMethod || event.method || (event.requestContext && event.requestContext.httpMethod) || 'GET',
  ).toUpperCase();

  let path =
    event.path ||
    event.rawPath ||
    (event.requestContext && (event.requestContext.path || event.requestContext.rawPath)) ||
    '/';
  path = String(path).split('?')[0].replace(/^\/+/, '');

  const parts = path.split('/').filter(Boolean);
  // 兼容 /api/*、/english-api/*、/v1/functions/english-api/* 三种前缀
  if (parts[0] === 'api' || parts[0] === 'english-api') parts.shift();
  else if (parts[0] === 'v1' && parts[1] === 'functions') parts.splice(0, 3);
  path = '/' + parts.join('/');

  let body = {};
  const raw = event.body;
  if (raw) {
    const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    if (typeof text === 'string') {
      try { body = JSON.parse(text); } catch { body = {}; }
    } else if (typeof text === 'object') {
      body = text;
    }
  }

  const query = event.queryStringParameters || event.queryString || event.query || {};
  return { method, path, headers, body, query };
}

exports.main = async (event = {}, context) => {
  const ctx = parseEvent(event);
  try {
    if (ctx.method === 'OPTIONS') return reply(204, {});
    return await route(ctx);
  } catch (error) {
    const status = error && error.status ? error.status : 500;
    const message = status === 500 ? '云端服务出错：' + (error && error.message) : error.message;
    console.error('[english-api]', ctx.method, ctx.path, error);
    return reply(status, { error: message, path: ctx.path });
  }
};
