<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none">Мої сесії</h5>
      </div>
      <div class="col-auto">
        <q-btn color="primary" label="Нова сесія" @click="createSession" />
      </div>
    </div>

    <q-list bordered separator>
      <q-item v-for="session in sessions" :key="session.id" clickable @click="goToSession(session.id)">
        <q-item-section>
          <q-item-label>{{ session.title || 'Без назви' }}</q-item-label>
          <q-item-label caption>
            Модель: {{ session.model }} · Вартість: ${{ session.total_cost_usd?.toFixed(6) || '0' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label caption>{{ new Date(session.created_at).toLocaleString() }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="sessions.length === 0">
        <q-item-section>Немає сесій. Створіть нову!</q-item-section>
      </q-item>
    </q-list>
  </q-page>
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

async function fetchSessions() {
  try {
    const { data } = await api.get('/sessions');
    sessions.value = data;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
  }
}

async function createSession() {
  try {
    const { data } = await api.post('/sessions', {
      model: 'gpt-4o-mini',
      system_prompt: 'You are a helpful assistant.',
    });
    await fetchSessions();
    router.push(`/session/${data.id}`);
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
  }
}

function goToSession(id: string) {
  router.push(`/session/${id}`);
}

onMounted(fetchSessions);
</script>