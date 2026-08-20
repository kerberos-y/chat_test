<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col">
        <q-btn flat icon="arrow_back" @click="router.push('/')" />
        <span class="q-ml-sm text-h6">{{ sessionTitle }}</span>
      </div>
      <div class="col-auto text-caption">
        Вартість: ${{ totalCostFormatted }}
      </div>
      <div class="col-auto q-ml-sm">
        <q-btn
          color="negative"
          outline
          label="Скинути сесію"
          @click="resetSession"
          :loading="resetting"
          :disable="loading || messages.length === 0"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div v-if="loadingHistory" class="row justify-center q-pa-md">
      <q-spinner-dots size="3rem" color="primary" />
    </div>
    <div v-else ref="messagesContainer" class="messages-container q-mb-md" style="max-height: 60vh; overflow-y: auto;">
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
                <span v-if="msg.model" class="q-ml-sm">модель: {{ msg.model }}</span>
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

    <div class="row items-center q-gutter-sm">
      <q-select
        v-model="selectedModel"
        :options="modelOptions"
        label="Модель"
        dense
        class="col-3"
        outlined
        :disable="loading"
        option-value="value"
        option-label="label"
        emit-value
        map-options
      />
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
        color="primary"
        label="Надіслати"
        @click="sendMessage"
        :disable="!newMessage.trim() || loading"
      />
    </div>
  </q-page>
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

// Локальний підрахунок загальної вартості
const totalCost = ref(0);

// Форматування вартості для відображення
const totalCostFormatted = computed(() => {
  return totalCost.value.toFixed(6);
});

const modelOptions = [
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
];
const selectedModel = ref('gpt-4o-mini');

// Функція для перерахунку загальної вартості з повідомлень
function recalcTotalCost() {
  let sum = 0;
  for (const msg of messages.value) {
    if (msg.role === 'assistant' && msg.cost_usd) {
      sum += msg.cost_usd;
    }
  }
  totalCost.value = sum;
  // Оновлюємо session.total_cost_usd для сумісності
  session.value.total_cost_usd = sum;
}

async function fetchSession() {
  loadingHistory.value = true;
  try {
    const { data } = await api.get(`/sessions/${sessionId}`);
    session.value = data;
    messages.value = data.messages || [];
    sessionTitle.value = data.title || 'Чат';
    if (data.model) selectedModel.value = data.model;
    // Перераховуємо вартість локально
    recalcTotalCost();
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.message });
    router.push('/');
  } finally {
    loadingHistory.value = false;
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

    // Перераховуємо загальну вартість локально
    recalcTotalCost();

    // Оновлюємо сесію з бекенду (для синхронізації, якщо треба)
    try {
      const sessionResp = await api.get(`/sessions/${sessionId}`);
      session.value = sessionResp.data;
    } catch (e) {
      // Якщо не вийшло – залишаємо локальну вартість
    }

    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  } catch (err: any) {
    messages.value.pop();
    recalcTotalCost(); // перераховуємо після видалення
    const errorMsg = err.response?.data?.error || err.message;
    if (err.response?.status === 400 && errorMsg.includes('not supported')) {
      Notify.create({ type: 'negative', message: `Модель "${selectedModel.value}" не підтримується. Оберіть іншу.` });
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
    totalCost.value = 0;
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