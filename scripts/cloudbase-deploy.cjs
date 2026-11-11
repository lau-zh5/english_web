/**
 * CI 部署脚本：把 dist 目录上传到 CloudBase 静态托管根目录。
 *
 * 为什么不用 `tcb hosting deploy`：
 *   在 GitHub Actions 中 `tcb login --apiKeyId/--apiKey` 持续失败（含强制 --intl false）。
 *   这里直接调用 @cloudbase/manager-node 的 hosting.uploadFiles，
 *   与 CLI 的 deploy 走同一套底层实现，但只需 API 密钥，不经过 CLI 登录流程。
 *
 * 环境变量：
 *   TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID
 */
const path = require('path');
const fs = require('fs');
const CloudBase = require('@cloudbase/manager-node');

const mask = (v) => (v ? `${v.slice(0, 6)}…${v.slice(-4)}（长度 ${v.length}）` : '(空)');

(async () => {
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;
  const envId = process.env.TCB_ENV_ID;

  console.log('SecretId :', mask(secretId));
  console.log('SecretKey:', mask(secretKey));
  console.log('EnvId    :', envId || '(空)');

  if (!secretId || !secretKey || !envId) {
    console.error('缺少凭证环境变量，终止');
    process.exit(1);
  }

  const localPath = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(localPath)) {
    console.error('dist 目录不存在，先执行 npm run build');
    process.exit(1);
  }
  console.log('上传目录 :', localPath);

  const app = CloudBase.init({ secretId, secretKey, envId });

  const info = await app.hosting.getInfo();
  console.log('托管信息 :', JSON.stringify(info));

  const result = await app.hosting.uploadFiles({
    localPath,
    cloudPath: '/',
    prune: false,
  });

  const text = JSON.stringify(result, null, 2);
  console.log('上传结果 :', text.length > 4000 ? text.slice(0, 4000) + '…' : text);
  console.log('部署完成');
})().catch((e) => {
  console.error('DEPLOY FAILED');
  console.error(e && (e.stack || e.message || JSON.stringify(e)));
  process.exit(1);
});
