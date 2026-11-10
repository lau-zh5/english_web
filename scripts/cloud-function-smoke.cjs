/**
 * 云函数离线冒烟测试：用内存文档数据库替换 @cloudbase/node-sdk，
 * 不联网、不写云端，验证注册/登录/用户隔离/CRUD/导出等全部逻辑分支。
 * 运行：node .workbuddy/cloud-function-smoke.cjs
 */
'use strict';

const Module = require('module');
const path = require('path');

const store = {};
let seq = 0;

function matches(cond) {
  return (doc) => Object.entries(cond).every(([k, v]) => doc[k] === v);
}

function collection(name) {
  if (!store[name]) store[name] = [];
  const docs = store[name];

  return {
    where(cond) {
      const found = () => docs.filter(matches(cond));
      const chain = {
        async count() { return { total: found().length }; },
        async get() { return { data: found().map((d) => ({ ...d })) }; },
        async update(patch) {
          const list = found();
          list.forEach((d) => Object.assign(d, patch));
          return { updated: list.length };
        },
        async remove() {
          let n = 0;
          for (let i = docs.length - 1; i >= 0; i -= 1) {
            if (matches(cond)(docs[i])) { docs.splice(i, 1); n += 1; }
          }
          return { deleted: n };
        },
      };
      chain.limit = (n) => ({
        async get() { return { data: found().slice(0, n).map((d) => ({ ...d })) }; },
        async count() { return { total: Math.min(found().length, n) }; },
      });
      return chain;
    },
    doc(id) {
      return {
        async get() { return { data: docs.filter((d) => d._id === id).map((d) => ({ ...d })) }; },
        async update(patch) {
          const d = docs.find((x) => x._id === id);
          if (!d) return { updated: 0 };
          Object.assign(d, patch);
          return { updated: 1 };
        },
      };
    },
    async add(doc) {
      const _id = `doc_${++seq}`;
      docs.push({ _id, ...doc });
      return { id: _id };
    },
  };
}

const db = {
  async createCollection(name) {
    if (store[name]) throw new Error('collection already exists');
    store[name] = [];
  },
  collection,
};

const mockSdk = {
  SYMBOL_CURRENT_ENV: Symbol('current-env'),
  init() { return { database: () => db }; },
};

const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === '@cloudbase/node-sdk') return mockSdk;
  return originalLoad.call(this, request, parent, isMain);
};

const fn = require(path.resolve(__dirname, '../cloudbase/functions/english-api/index.js'));

function ev(method, apiPath, body, token) {
  return {
    httpMethod: method,
    path: `/api${apiPath}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: body === undefined ? null : JSON.stringify(body),
    isBase64Encoded: false,
  };
}

let passed = 0;
let failed = 0;

async function check(label, event, expectStatus, verify) {
  const res = await fn.main(event, {});
  let data;
  try { data = JSON.parse(res.body); } catch { data = {}; }
  const ok = res.statusCode === expectStatus && (!verify || verify(data));
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}  [${res.statusCode}]`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}  [${res.statusCode}] ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

(async () => {
  console.log('--- 健康检查与环境 ---');
  await check('GET /health', ev('GET', '/health'), 200, (d) => d.ok === true && d.database.includes('free'));

  console.log('--- 注册 / 登录 ---');
  await check('弱密码被拒绝', ev('POST', '/users/register', { username: 'ab', password: '123' }), 400);
  const reg = await check(
    '正常注册',
    ev('POST', '/users/register', { username: 'cloud_tester', password: 'Passw0rd!2026', email: 't@example.com' }),
    201,
    (d) => Boolean(d.token && d.id),
  );
  await check('重复用户名返回 409', ev('POST', '/users/register', { username: 'cloud_tester', password: 'Passw0rd!2026' }), 409);
  const login = await check('正确密码登录', ev('POST', '/users/login', { username: 'cloud_tester', password: 'Passw0rd!2026' }), 200, (d) => Boolean(d.token));
  await check('错误密码返回 401', ev('POST', '/users/login', { username: 'cloud_tester', password: 'WrongPass!2026' }), 401);
  await check('token 可查用户', ev('GET', `/users/${reg.id}`, undefined, login.token), 200, (d) => d.username === 'cloud_tester' && d.password === undefined);

  console.log('--- 业务数据与用户隔离 ---');
  const token = login.token;
  await check('初始单词本为空', ev('GET', '/wordbooks', undefined, token), 200, (d) => Array.isArray(d) && d.length === 0);
  const created = await check('新增单词本', ev('POST', '/wordbooks', { name: '云端测试词书', description: 'free plan' }, token), 201, (d) => d.name === '云端测试词书');
  await check('本人可读', ev('GET', '/wordbooks', undefined, token), 200, (d) => d.length === 1 && d[0].id);
  // 统一鉴权门槛：无 token 一律 401，不再返回 200 空数据 / 404
  await check('未登录读取被拒', ev('GET', '/wordbooks'), 401, (d) => d.error === '请先登录');
  await check('未登录不能改', ev('PUT', `/wordbooks/${created.id}`, { name: 'hack' }), 401);
  await check('未登录不能导出', ev('GET', '/data/export'), 401);
  await check('未登录不能读他人档案', ev('GET', `/users/${reg.id}`), 401);
  await check('本人可改名', ev('PUT', `/wordbooks/${created.id}`, { name: '改名成功' }, token), 200);
  await check('改名生效', ev('GET', '/wordbooks', undefined, token), 200, (d) => d[0].name === '改名成功');

  console.log('--- 批量 / 导出 / 特殊接口 ---');
  await check('批量新增单词', ev('POST', '/words/batch', { words: [{ word: 'apple', meaning: '苹果' }, { word: 'banana', meaning: '香蕉' }] }, token), 201, (d) => d.length === 2);
  await check('每日一句', ev('GET', '/quotes/daily', undefined, token), 200, (d) => Boolean(d.content && d.author));
  await check('分组查询', ev('GET', '/words/grouped/list?group_type=similar', undefined, token), 200, (d) => Array.isArray(d));
  await check('数据导出', ev('GET', '/data/export', undefined, token), 200, (d) => Boolean(d.collections && d.collections.users.length === 1));
  await check('媒体上传明确未开放', ev('POST', '/ebooks/upload', {}, token), 501);
  await check('未知接口 404', ev('GET', '/no-such-api', undefined, token), 404);
  await check('预检请求', ev('OPTIONS', '/wordbooks', undefined, token), 204);

  console.log('--- 删除 ---');
  await check('删除单词本', ev('DELETE', `/wordbooks/${created.id}`, undefined, token), 200, (d) => d.ok === true);
  await check('删除后为空', ev('GET', '/wordbooks', undefined, token), 200, (d) => d.length === 0);

  console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
