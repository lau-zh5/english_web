/**
 * CI 部署脚本：把 cloudbase/functions/english-api 同步到线上云函数。
 *
 * 背景：.github/workflows/deploy.yml 原本只上传 dist 静态文件，
 * 云函数代码改动不会随 push 生效，导致仓库与线上逻辑不一致。
 * 这里直接调用 @cloudbase/manager-node 的 functions.updateFunctionCode，
 * 与 CLI 的 `tcb fn code update` 同一套底层实现，但不需要 CLI 登录。
 *
 * 只更新代码，不动函数配置：AUTH_SECRET 等环境变量、/api 网关路由保持原样。
 * 代码包里只有 index.js + package.json，依赖由云端按 package.json 安装。
 *
 * 环境变量：TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID
 */
const path = require('path');
const fs = require('fs');
const CloudBase = require('@cloudbase/manager-node');

(async () => {
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;
  const envId = process.env.TCB_ENV_ID;

  if (!secretId || !secretKey || !envId) {
    console.error('缺少 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID，终止');
    process.exit(1);
  }

  const functionPath = path.resolve(__dirname, '..', 'cloudbase', 'functions', 'english-api');
  if (!fs.existsSync(path.join(functionPath, 'index.js'))) {
    console.error('未找到云函数 index.js：', functionPath);
    process.exit(1);
  }

  const app = CloudBase.init({ secretId, secretKey, envId });

  let runtime = 'Nodejs18.15';
  try {
    const detail = await app.functions.getFunctionDetail('english-api');
    if (detail && detail.Runtime) runtime = detail.Runtime;
    console.log('线上函数运行时：', runtime);
  } catch (e) {
    console.log('读取函数详情失败，使用默认运行时：', runtime, e && e.message);
  }

  const result = await app.functions.updateFunctionCode({
    func: {
      name: 'english-api',
      handler: 'index.main',
      // runtime 只用于 SDK 判断「是否云端安装依赖」，不会改动线上配置
      runtime,
      installDependency: true,
      isWaitInstall: true,
    },
    functionPath,
    deployMode: 'zip',
  });

  console.log('更新结果：', JSON.stringify(result));
  console.log('云函数 english-api 代码同步完成');
})().catch((e) => {
  console.error('FUNCTION DEPLOY FAILED');
  console.error(e && (e.stack || e.message || JSON.stringify(e)));
  process.exit(1);
});
