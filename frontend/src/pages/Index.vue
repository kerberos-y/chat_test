<template>
  <div class="index-page">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h5 class="q-my-none text-weight-bold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#a78bfa" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 8px;">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          Ваші діалоги
        </h5>
        <p class="text-grey-5 q-mt-sm" style="font-weight: 300;">
          Спілкуйтеся з AI, обирайте моделі, відстежуйте вартість
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="accent"
          label="Нова сесія"
          @click="createSession"
          :loading="creating"
          class="btn-primary-glow"
          no-caps
          unelevated
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 6px;">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Нова сесія
        </q-btn>
      </div>
    </div>

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="i in 6" :key="i" class="col-12 col-sm-6 col-md-4">
        <q-card class="skeleton-card" flat>
          <q-card-section>
            <div class="skeleton-line" style="width: 60%;"></div>
            <div class="skeleton-line" style="width: 40%; margin-top: 8px;"></div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-else-if="sessions.length === 0" class="empty-state glass">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6b7280" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
      </svg>
      <p class="text-grey-5 q-mt-md text-h6">Немає сесій</p>
      <p class="text-grey-6">Створіть нову, щоб почати спілкування</p>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card
          class="session-card glass cursor-pointer"
          @click="goToSession(session.id)"
          flat
        >
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-subtitle1 text-weight-bold text-white ellipsis">
                  {{ session.title || 'Новий діалог' }}
                </div>
                <div class="row items-center q-mt-sm text-grey-6 text-caption">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;">
                    <path d="M12 2c-3.87 0-7 3.13-7 7 0 2.38 1.19 4.47 3 5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 13c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
                  </svg>
                  {{ session.model }}
                </div>
              </div>
              <q-avatar color="accent" text-color="white" size="40px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </q-avatar>
            </div>
          </q-card-section>

          <q-separator dark />

          <q-card-section class="q-pt-sm">
            <div class="row justify-between items-center">
              <div class="text-caption text-grey-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle;">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
                {{ session.total_cost_usd?.toFixed(6) || '0.00' }}
              </div>
              <div class="text-caption text-grey-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                {{ session.created_at ? new Date(session.created_at).toLocaleString() : '—' }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { Notify } from 'quasar';

interface Session {
  id: string;
  title: string | null;
  model: string;
  total_cost_usd: number;
  created_at: string;
}

const router = useRouter();
const sessions = ref<Session[]>([]);
const loading = ref(false);
const creating = ref(false);

async function fetchSessions() {
  loading.value = true;
  try {
    const { data } = await api.get('/sessions');
    sessions.value = data;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
  } finally {
    loading.value = false;
  }
}

async function createSession() {
  creating.value = true;
  try {
    const { data } = await api.post('/sessions', {
      model: 'gpt-4o-mini',
      system_prompt: 'You are a helpful assistant.',
    });
    await fetchSessions();
    router.push(`/session/${data.id}`);
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
  } finally {
    creating.value = false;
  }
}

function goToSession(id: string) {
  console.log('Перехід до сесії:', id);
  router.push(`/session/${id}`);
}

onMounted(fetchSessions);
</script>

<style scoped>
.index-page {
  animation: fadeInUp 0.5s ease-out;
}
.btn-primary-glow {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  border-radius: 60px;
  padding: 0 28px;
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.25);
  transition: box-shadow 0.3s;
}
.btn-primary-glow:hover {
  box-shadow: 0 0 40px rgba(124, 58, 237, 0.5);
}
.session-card {
  transition: transform 0.25s ease, box-shadow 0.3s ease;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.session-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.empty-state {
  text-align: center;
  padding: 64px 24px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.08);
}
.skeleton-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  padding: 16px;
  animation: pulseGlow 1.8s infinite;
}
.skeleton-line {
  height: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin-bottom: 6px;
}
</style>