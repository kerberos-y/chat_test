const NodeCache = require('node-cache');
const sessionRepo = require('../repositories/sessionRepository');
const messageRepo = require('../repositories/messageRepository');
const { SessionNotFoundError } = require('../errors/customErrors');

const cache = new NodeCache({ stdTTL: 30 }); // 30 секунд

class SessionService {
  async listSessions(userId = null) {
    const cacheKey = `sessions_${userId || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const sessions = await sessionRepo.findAll(userId);
    cache.set(cacheKey, sessions);
    return sessions;
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

  async createSession({ userId, model, systemPrompt, title }) {
    const session = await sessionRepo.create({ userId, model, systemPrompt, title });
    // Інвалідуємо кеш списку
    cache.del(`sessions_${userId || 'all'}`);
    return session;
  }
}

module.exports = new SessionService();