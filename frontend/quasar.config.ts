import { defineConfig } from '@quasar/app-vite';

export default defineConfig(() => ({
  boot: [], // <-- прибираємо axios з boot
  css: ['app.scss'],
  extras: ['material-icons'],
  build: {
    target: {
      browser: ['es2022', 'chrome100', 'safari15'],
      node: 'node18'
    },
    vueRouterMode: 'history',
  },
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  },
  framework: {
    config: {},
    plugins: ['Notify']
  }
}));