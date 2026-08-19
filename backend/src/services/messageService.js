const sessionRepo = require('../repositories/sessionRepository');
const messageRepo = require('../repositories/messageRepository');
const openaiClient = require('./openaiClient');
const pricingService = require('./pricingService');
const contextBuilder = require('./contextBuilder');
const { SessionNotFoundError, ValidationError } = require('../errors/customErrors');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Кеш для інвалідації (спільний з sessionService)
const cache = new NodeCache({ stdTTL: 30 });

class MessageService {
  async sendMessage(sessionId, userId, content) {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }

    const session = await sessionRepo.findById(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);

    // 1. Зберігаємо повідомлення користувача
    const userMessage = await messageRepo.create({
      sessionId,
      role: 'user',
      content: content.trim(),
    });

    // 2. Автогенерація назви сесії (якщо ще немає)
    if (!session.title) {
      const allMessages = await messageRepo.findBySessionId(sessionId);
      if (allMessages.length === 1) {
        let title = content.trim().substring(0, 50);
        if (content.length > 50) title += '...';
        await sessionRepo.update(sessionId, { title });
        session.title = title;
      }
    }

    // 3. Будуємо контекст (включаючи щойно збережене повідомлення)
    const model = session.model || 'gpt-4o-mini';
    const systemPrompt = session.system_prompt;
    const context = await contextBuilder.buildContext(sessionId, systemPrompt, model);

    logger.debug(`Context built with ${context.length} messages for session ${sessionId}`);

    // 4. Викликаємо OpenAI
    const { content: assistantContent, usage } = await openaiClient.call(context, model);

    // 5. Розраховуємо вартість
    const cost = await pricingService.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

    // 6. Зберігаємо повідомлення асистента
    const assistantMessage = await messageRepo.create({
      sessionId,
      role: 'assistant',
      content: assistantContent,
      tokensPrompt: usage.prompt_tokens,
      tokensCompletion: usage.completion_tokens,
      costUsd: cost,
      model,
    });

    // Інвалідуємо кеш для цієї сесії та списку сесій
    cache.del(`session_${sessionId}`);
    cache.del(`sessions_all`);

    return {
      message: assistantMessage,
      usage,
      cost,
    };
  }
}

module.exports = new MessageService();