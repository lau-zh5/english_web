import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 后端地址只在这里配置一次。前端永远请求同源的 /api 与 /media，
// 由 dev server / preview server 转发；部署后换成网关或云函数路由即可。
const backend = 'http://localhost:3001'

const proxy = {
  '/api': { target: backend, changeOrigin: true },
  '/media': { target: backend, changeOrigin: true },
  // 兼容数据库里尚未迁移的历史路径
  '/info': { target: backend, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy,
  },
})
