<template>
  <div class="chat-page">
    <div class="row items-center q-pb-md q-mb-md chat-header">
      <div class="col">
        <q-btn flat round @click="router.push('/')" class="text-white" aria-label="Назад">
          <!-- SVG іконка arrow_back -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </q-btn>
        <span class="text-h6 text-weight-bold text-white q-ml-sm">{{ sessionTitle }}</span>
      </div>
      <div class="col-auto q-gutter-x-sm">
        <q-select
          v-model="selectedModel"
          :options="modelOptions"
          label="Модель"
          dense
          outlined
          class="model-select"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          :disable="loading"
          dark
          color="accent"
        />
        <q-btn
          color="negative"
          outline
          label="Скинути"
          @click="resetSession"
          :loading="resetting"
          :disable="loading || messages.length === 0"
          no-caps
          class="btn-outline-glass"
        />
        <q-chip outline color="accent" class="q-ml-sm chip-cost">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
          {{ session.total_cost_usd?.toFixed(6) || '0.00' }}
        </q-chip>
      </div>
    </div>

    <div
      ref="messagesContainer"
      class="messages-container"
      :style="{ height: messagesHeight }"
    >
      <div v-if="loadingHistory" class="row justify-center q-pa-xl">
        <q-spinner-dots size="3rem" color="accent" />
      </div>

      <div v-else>
        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-wrapper"
          :class="{
            'message-wrapper--user': msg.role === 'user',
            'message-wrapper--assistant': msg.role === 'assistant'
          }"
          :style="{ animationDelay: (index * 0.05) + 's' }"
        >
          <div class="message-bubble" :class="{
            'message-bubble--user': msg.role === 'user',
            'message-bubble--assistant': msg.role === 'assistant'
          }">
            <div class="message-avatar">
              {{ msg.role === 'user' ? 'U' : 'A' }}
            </div>
            <div class="message-content">
              <div style="white-space: pre-wrap; word-break: break-word;">
                {{ msg.content }}
              </div>
              <div v-if="msg.role === 'assistant'" class="message-meta">
                <span>токени: {{ msg.tokens_prompt }}/{{ msg.tokens_completion }}</span>
                <span>· вартість: ${{ msg.cost_usd?.toFixed(6) }}</span>
                <span v-if="msg.model">· модель: {{ msg.model }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="message-wrapper message-wrapper--assistant">
          <div class="message-bubble message-bubble--assistant">
            <div class="message-avatar">A</div>
            <div class="message-content">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area glass">
      <q-input
        v-model="newMessage"
        filled
        dense
        placeholder="Напишіть повідомлення..."
        @keyup.enter="sendMessage"
        :disable="loading"
        class="message-input"
        dark
        color="accent"
      >
        <template v-slot:append>
          <q-btn
            round
            color="accent"
            @click="sendMessage"
            :disable="!newMessage.trim() || loading"
            class="send-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </q-btn>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
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
  model?: string | null;
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

const session = ref<Session>({
  id: '',
  title: '',
  model: 'gpt-4o-mini',
  total_cost_usd: 0,
  total_tokens_prompt: 0,
  total_tokens_completion: 0,
});
const messages = ref<Message[]>([]);
const newMessage = ref('');
const loading = ref(false);
const loadingHistory = ref(false);
const resetting = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const sessionTitle = ref('');

const modelOptions = [
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
];
const selectedModel = ref('gpt-4o-mini');

const messagesHeight = computed(() => `calc(100vh - 300px)`);

async function fetchSession() {
  loadingHistory.value = true;
  try {
    const { data } = await api.get(`/sessions/${sessionId}`);
    session.value = data;
    messages.value = data.messages || [];
    sessionTitle.value = data.title || 'Новий діалог';
    if (data.model) selectedModel.value = data.model;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
    router.push('/');
  } finally {
    loadingHistory.value = false;
    scrollToBottom();
  }
}

async function sendMessage() {
  const content = newMessage.value.trim();
  if (!content || loading.value) return;

  loading.value = true;
  try {
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    messages.value.push(tempUserMsg);
    newMessage.value = '';
    scrollToBottom();

    const { data } = await api.post(`/sessions/${sessionId}/messages`, {
      content,
      model: selectedModel.value,
    });

    const assistantMsg: Message = {
      id: data.message.id,
      role: 'assistant',
      content: data.message.content,
      tokens_prompt: data.usage.prompt_tokens,
      tokens_completion: data.usage.completion_tokens,
      cost_usd: data.cost,
      model: data.message.model || selectedModel.value,
      created_at: data.message.created_at,
    };
    messages.value.push(assistantMsg);
    scrollToBottom();

    const sessionResp = await api.get(`/sessions/${sessionId}`);
    session.value = sessionResp.data;
  } catch (err: any) {
    messages.value.pop();
    const errorMsg = err.response?.data?.error || err.message;
    if (err.response?.status === 400 && errorMsg.includes('not supported')) {
      Notify.create({ type: 'negative', message: `Модель "${selectedModel.value}" не підтримується.` });
    } else {
      Notify.create({ type: 'negative', message: errorMsg });
    }
  } finally {
    loading.value = false;
  }
}

async function resetSession() {
  if (resetting.value) return;
  if (!confirm('Ви впевнені, що хочете скинути цю сесію?')) return;

  resetting.value = true;
  try {
    await api.post(`/sessions/${sessionId}/reset`);
    messages.value = [];
    session.value.total_cost_usd = 0;
    session.value.total_tokens_prompt = 0;
    session.value.total_tokens_completion = 0;
    Notify.create({ type: 'positive', message: 'Сесію скинуто' });
    await fetchSession();
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.error || err.message });
  } finally {
    resetting.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

onMounted(fetchSession);

watch(messages, () => {
  scrollToBottom();
}, { deep: true });
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.chat-header {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 12px;
}
.model-select { min-width: 150px; }
.model-select >>> .q-field__control {
  background: rgba(255,255,255,0.04);
  border-radius: 30px;
  border: 1px solid rgba(255,255,255,0.08);
}
.btn-outline-glass {
  border-radius: 30px;
  border-color: rgba(255,100,100,0.3);
  color: #ff6b6b;
}
.btn-outline-glass:hover {
  background: rgba(255,100,100,0.08);
}
.chip-cost {
  background: rgba(124,58,237,0.1);
  border-color: rgba(124,58,237,0.3);
  color: #a78bfa;
}
.messages-container {
  overflow-y: auto;
  padding: 16px 0;
  flex: 1;
}
.message-wrapper {
  display: flex;
  margin-bottom: 16px;
  animation: fadeInUp 0.4s ease forwards;
  opacity: 0;
}
.message-wrapper--user {
  justify-content: flex-end;
}
.message-bubble {
  display: flex;
  align-items: flex-start;
  max-width: 78%;
  gap: 12px;
}
.message-bubble--user {
  flex-direction: row-reverse;
}
.message-bubble--user .message-content {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  border-radius: 22px 22px 4px 22px;
}
.message-bubble--assistant .message-content {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(4px);
  color: #e8edf5;
  border-radius: 22px 22px 22px 4px;
  border: 1px solid rgba(255,255,255,0.04);
}
.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  flex-shrink: 0;
  font-size: 0.9rem;
}
.message-bubble--assistant .message-avatar {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.06);
}
.message-content {
  padding: 14px 18px;
  font-size: 0.95rem;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.message-meta {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.input-area {
  padding: 16px 0 4px;
  border-top: 1px solid rgba(255,255,255,0.04);
  background: transparent;
}
.message-input >>> .q-field__control {
  border-radius: 60px;
  background: rgba(255,255,255,0.04);
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,0.06);
}
.message-input >>> .q-field__control:focus-within {
  border-color: #7c3aed;
}
.send-btn {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(124,58,237,0.2);
  width: 40px;
  height: 40px;
}
.send-btn:disabled {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.3);
  box-shadow: none;
}
.typing-dots {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}
.typing-dots span {
  width: 8px;
  height: 8px;
  background: #a78bfa;
  border-radius: 50%;
  display: inline-block;
  animation: typingBounce 1.4s infinite both;
}
.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%,60%,100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>