import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'

// 当前 Vue3 alpha 包在 Node ESM 下保留了一层 CommonJS 兼容导出。
const uni = uniModule.default ?? uniModule

export default defineConfig({
  plugins: [uni()],
  // 同时兼容自定义域名根路径和 GitHub Pages 项目子路径。
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5174
  }
})
