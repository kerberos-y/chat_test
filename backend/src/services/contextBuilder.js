const { encoding_for_model } = require('@dqbd/tiktoken');
const messageRepo = require('../repositories/messageRepository');
const config = require('../config');

class ContextBuilder {
  constructor() {
    this.modelLimits = config.modelLimits;
  }

  async buildContext(sessionId, systemPrompt, model) {
    // Завантажуємо всі повідомлення сесії (хронологічно)
    const messages = await messageRepo.findBySessionId(sessionId);

    // Будуємо масив об'єктів для OpenAI
    const contextMessages = [];
    if (systemPrompt) {
      contextMessages.push({ role: 'system', content: systemPrompt });
    }

    // Додаємо всі повідомлення (вони вже містять user та assistant)
    for (const msg of messages) {
      contextMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Ліміт контексту моделі
    const maxContextTokens = this.modelLimits[model]?.maxContextTokens || 128000;
    const maxCompletionTokens = config.maxCompletionTokens;
    const availableTokens = maxContextTokens - maxCompletionTokens - 500; // резерв

    // Якщо контекст замалий, обрізаємо повідомлення від найстаріших до новіших
    // Використовуємо алгоритм: ідемо з кінця, додаємо повідомлення, поки не перевищимо ліміт
    const encoding = encoding_for_model(model);
    try {
      let totalTokens = 0;
      // Починаємо з system (якщо є) – його завжди включаємо
      let systemTokens = 0;
      if (systemPrompt) {
        systemTokens = encoding.encode(systemPrompt).length;
        totalTokens += systemTokens;
      }

      // Проходимо повідомлення від найновішого до найстарішого
      const reversedMessages = [...contextMessages.slice(systemPrompt ? 1 : 0)].reverse();
      const selectedMessages = [];

      for (const msg of reversedMessages) {
        const msgText = msg.content;
        const tokens = encoding.encode(msgText).length;
        if (totalTokens + tokens <= availableTokens) {
          selectedMessages.push(msg);
          totalTokens += tokens;
        } else {
          // Якщо не влазить – пропускаємо найстаріші
          break;
        }
      }

      // Відновлюємо порядок (від старого до нового)
      const finalMessages = [];
      if (systemPrompt) {
        finalMessages.push({ role: 'system', content: systemPrompt });
      }
      finalMessages.push(...selectedMessages.reverse());

      return finalMessages;
    } finally {
      encoding.free();
    }
  }
}

module.exports = new ContextBuilder();