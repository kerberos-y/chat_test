<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col">
        <q-btn flat icon="arrow_back" @click="router.push('/')" />
        <span class="q-ml-sm text-h6">{{ sessionTitle }}</span>
      </div>
      <div class="col-auto text-caption">
        Вартість: ${{ session.total_cost_usd?.toFixed(6) || '0' }}
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div ref="messagesContainer" class="messages-container q-mb-md" style="max-height: 60vh; overflow-y: auto;">
      <div v-for="msg in messages" :key="msg.id" class="q-mb-sm">
        <div class="row">
          <div class="col-auto q-pr-sm">
            <q-avatar :color="msg.role === 'user' ? 'primary' : 'secondary'" text-color="white">
              {{ msg.role === 'user' ? 'U' : 'A' }}
            </q-avatar>
          </div>
          <div class="col">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div style="white-space: pre-wrap;">{{ msg.content }}</div>
              <div v-if="msg.role === 'assistant'" class="text-caption text-grey">
                tokens: {{ msg.tokens_prompt }}/{{ msg.tokens_completion }} · cost: ${{ msg.cost_usd?.toFixed(6) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="row">
        <div class="col-auto q-pr-sm">
          <q-avatar color="secondary" text-color="white">A</q-avatar>
        </div>
        <div class="col">
          <div class="q-pa-sm bg-grey-2 rounded-borders">
            <q-spinner-dots size="2rem" />
          </div>
        </div>
      </div>
    </div>

    <div class="row items-center">
      <q-input
        v-model="newMessage"
        class="col"
        filled
        dense
        placeholder="Напишіть повідомлення..."
        @keyup.enter="sendMessage"
        :disable="loading"
      />
      <q-btn
        class="q-ml-sm"
        color="primary"
        label="Надіслати"
        @click="sendMessage"
        :disable="!newMessage.trim() || loading"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api';
import { Notify } from 'quasar';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_prompt?: number | null;
  tokens_completion?: number | null;
  cost_usd?: number | null;
  created_at: string;
}

interface Session {
  id: string;
  title: string | null;
  model: string;
  total_cost_usd: number;
  total_tokens_prompt: number;
  total_tokens_completion: number;
  messages?: Message[];
}

const router = useRouter();
const route = useRoute();
const sessionId = route.params.id as string;

const session = ref<Session>({ id: '', title: '', model: '', total_cost_usd: 0, total_tokens_prompt: 0, total_tokens_completion: 0 });
const messages = ref<Message[]>([]);
const newMessage = ref('');
const loading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const sessionTitle = ref('');

async function fetchSession() {
  try {
    const { data } = await api.get(`/sessions/${sessionId}`);
    session.value = data;
    messages.value = data.messages || [];
    sessionTitle.value = data.title || 'Чат';
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
    router.push('/');
  }
}

async function sendMessage() {
  const content = newMessage.value.trim();
  if (!content || loading.value) return;

  loading.value = true;
  try {
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    messages.value.push(tempUserMsg);
    newMessage.value = '';

    const { data } = await api.post(`/sessions/${sessionId}/messages`, { content });

    messages.value.push({
      id: data.message.id,
      role: 'assistant',
      content: data.message.content,
      tokens_prompt: data.usage.prompt_tokens,
      tokens_completion: data.usage.completion_tokens,
      cost_usd: data.cost,
      created_at: data.message.created_at,
    });

    const sessionResp = await api.get(`/sessions/${sessionId}`);
    session.value.total_cost_usd = sessionResp.data.total_cost_usd;
    session.value.total_tokens_prompt = sessionResp.data.total_tokens_prompt;
    session.value.total_tokens_completion = sessionResp.data.total_tokens_completion;

    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  } catch (err: any) {
    messages.value.pop();
    Notify.create({ type: 'negative', message: err.response?.data?.error || err.message });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSession);

watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });
</script>

<style scoped>
.messages-container {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}
</style>