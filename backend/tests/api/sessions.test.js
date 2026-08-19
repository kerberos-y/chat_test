const request = require('supertest');
const app = require('../../src/app');
const sessionService = require('../../src/services/sessionService');
const messageService = require('../../src/services/messageService');

jest.mock('../../src/services/sessionService');
jest.mock('../../src/services/messageService');

describe('Sessions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sessions', () => {
    test('should create a session', async () => {
      const mockSession = { id: '123', model: 'gpt-4o-mini' };
      sessionService.createSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/sessions')
        .send({ model: 'gpt-4o-mini', system_prompt: 'You are a bot' })
        .expect(201);

      expect(response.body).toEqual(mockSession);
      expect(sessionService.createSession).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        systemPrompt: 'You are a bot',
        title: undefined,
        userId: undefined,
      });
    });

    test('should return 400 if invalid data', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({ model: 123 })
        .expect(400);
      // Перевіряємо, що повернуто помилку (текст може бути різним)
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /sessions/:id', () => {
    test('should return session with messages', async () => {
      const mockSession = { id: '123', messages: [] };
      sessionService.getSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/sessions/123')
        .expect(200);

      expect(response.body).toEqual(mockSession);
    });

    test('should return 404 if session not found', async () => {
      const { SessionNotFoundError } = require('../../src/errors/customErrors');
      sessionService.getSession.mockRejectedValue(new SessionNotFoundError('123'));
      await request(app).get('/sessions/999').expect(404);
    });
  });

  describe('POST /sessions/:id/messages', () => {
    test('should send message and return response', async () => {
      const mockResult = {
        message: { id: 'a1', content: 'Hi' },
        usage: { prompt_tokens: 5, completion_tokens: 10 },
        cost: 0.00001,
      };
      messageService.sendMessage.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/sessions/123/messages')
        .send({ content: 'Hello' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
    });

    test('should return 400 if content missing', async () => {
      await request(app)
        .post('/sessions/123/messages')
        .send({})
        .expect(400);
    });

    test('should return 404 if session not found', async () => {
      const { SessionNotFoundError } = require('../../src/errors/customErrors');
      messageService.sendMessage.mockRejectedValue(new SessionNotFoundError('123'));
      await request(app)
        .post('/sessions/999/messages')
        .send({ content: 'Hello' })
        .expect(404);
    });
  });
});