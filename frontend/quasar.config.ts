import { defineConfig } from '@quasar/app-vite';

export default defineConfig(() => ({
  boot: [],
  css: ['app.scss'],
  extras: [],
  build: {
    vueRouterMode: 'history',
  },
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
  framework: {
    plugins: ['Notify'],
  },
}));