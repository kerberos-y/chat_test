const contextBuilder = require('../../src/services/contextBuilder');
const messageRepo = require('../../src/repositories/messageRepository');
const config = require('../../src/config');

jest.mock('../../src/repositories/messageRepository');
jest.mock('@dqbd/tiktoken', () => ({
  encoding_for_model: jest.fn().mockReturnValue({
    encode: jest.fn().mockReturnValue([1, 2, 3]),
    free: jest.fn(),
  }),
}));

describe('ContextBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build context with system prompt and messages within limit', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];
    messageRepo.findBySessionId.mockResolvedValue(mockMessages);

    const context = await contextBuilder.buildContext('session-123', 'You are a bot', 'gpt-4o-mini');
    expect(context).toHaveLength(3); // system + 2 messages
    expect(context[0].role).toBe('system');
    expect(context[0].content).toBe('You are a bot');
  });

  test('should trim messages if token limit exceeded', async () => {
    // Підготуємо довгі повідомлення, які перевищать ліміт
    const longMessage = 'a'.repeat(10000);
    const mockMessages = [
      { role: 'user', content: longMessage },
      { role: 'assistant', content: longMessage },
      { role: 'user', content: longMessage },
    ];
    messageRepo.findBySessionId.mockResolvedValue(mockMessages);

    // Мокаємо tiktoken, щоб повертати велику кількість токенів для перших повідомлень
    const encodeMock = jest.spyOn(require('@dqbd/tiktoken'), 'encoding_for_model');
    encodeMock.mockReturnValue({
      encode: jest.fn().mockImplementation((text) => {
        if (text.includes('system')) return [1];
        return new Array(1000).fill(1); // дуже багато токенів
      }),
      free: jest.fn(),
    });

    const context = await contextBuilder.buildContext('session-123', null, 'gpt-4o-mini');
    // Очікуємо, що будуть обрізані старі повідомлення, залишаться тільки новіші
    expect(context.length).toBeLessThan(4); // має бути менше, ніж всі повідомлення
  });
});