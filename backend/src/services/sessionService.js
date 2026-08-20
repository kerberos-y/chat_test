const NodeCache = require('node-cache');
const sessionRepo = require('../repositories/sessionRepository');
const messageRepo = require('../repositories/messageRepository');
const { SessionNotFoundError } = require('../errors/customErrors');

const cache = new NodeCache({ stdTTL: 30 });

class SessionService {
  async createSession({ userId, model, systemPrompt, title }) {
    const session = await sessionRepo.create({ userId, model, systemPrompt, title });
    cache.del(`sessions_${userId || 'all'}`);
    return session;
  }

  async getSession(id) {
    const cacheKey = `session_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const session = await sessionRepo.findById(id);
    if (!session) throw new SessionNotFoundError(id);

    const messages = await messageRepo.findBySessionId(id);
    const result = { ...session, messages };
    cache.set(cacheKey, result);
    return result;
  }

  async listSessions(userId = null) {
    const cacheKey = `sessions_${userId || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const sessions = await sessionRepo.findAll(userId);
    cache.set(cacheKey, sessions);
    return sessions;
  }

  // Новий метод для скидання сесії
  async resetSession(id) {
    const session = await sessionRepo.findById(id);
    if (!session) throw new SessionNotFoundError(id);

    // Видаляємо всі повідомлення
    await messageRepo.deleteBySessionId(id);

    // Скидаємо агрегати
    const updated = await sessionRepo.update(id, {
      total_tokens_prompt: 0,
      total_tokens_completion: 0,
      total_cost_usd: 0,
    });

    // Інвалідуємо кеш
    cache.del(`session_${id}`);
    cache.del(`sessions_all`);

    return updated;
  }
}

module.exports = new SessionService();