<template>
  <q-layout view="hHh Lpr lFf" class="app-layout">
    <q-header elevated class="header-glass">
      <q-toolbar class="container">
        <q-btn
          flat
          dense
          round
          aria-label="На головну"
          @click="router.push('/')"
          class="text-white"
        >
          <!-- SVG іконка home -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </q-btn>
        <q-toolbar-title class="text-white text-h6">
          <!-- SVG іконка auto_awesome -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#a78bfa" viewBox="0 0 24 24" style="margin-right: 8px;">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="text-weight-bold">Nova</span><span class="text-weight-light">Chat</span>
        </q-toolbar-title>
        <div class="text-caption text-white q-mr-md row items-center">
          <!-- SVG іконка account_circle -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Гість
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="page-wrapper">
        <router-view />
      </div>
    </q-page-container>

    <q-footer class="footer-glass text-white">
      <div class="container q-pa-sm text-center">
        <span class="text-caption">© 2026 NovaChat — зроблено з ❤️ та AI</span>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.app-layout {
  background: radial-gradient(ellipse at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(167, 139, 250, 0.10) 0%, transparent 60%),
              #0b0d15;
  min-height: 100vh;
}
.header-glass {
  background: rgba(11, 13, 21, 0.75);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.footer-glass {
  background: rgba(11, 13, 21, 0.6);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 20px;
}
.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 130px);
}
</style>