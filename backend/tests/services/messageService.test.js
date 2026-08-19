const messageService = require('../../src/services/messageService');
const sessionRepo = require('../../src/repositories/sessionRepository');
const messageRepo = require('../../src/repositories/messageRepository');
const openaiClient = require('../../src/services/openaiClient');
const pricingService = require('../../src/services/pricingService');
const contextBuilder = require('../../src/services/contextBuilder');
const { SessionNotFoundError, ValidationError } = require('../../src/errors/customErrors');

jest.mock('../../src/repositories/sessionRepository');
jest.mock('../../src/repositories/messageRepository');
jest.mock('../../src/services/openaiClient');
jest.mock('../../src/services/pricingService');
jest.mock('../../src/services/contextBuilder');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send message successfully', async () => {
    const mockSession = { id: '123', model: 'gpt-4o-mini', system_prompt: null, title: null };
    const mockUserMessage = { id: 'u1', role: 'user', content: 'Hello' };
    const mockAssistantMessage = { id: 'a1', role: 'assistant', content: 'Hi' };
    const mockContext = [{ role: 'user', content: 'Hello' }];
    const mockUsage = { prompt_tokens: 10, completion_tokens: 20 };
    const mockCost = 0.000015;

    sessionRepo.findById.mockResolvedValue(mockSession);
    messageRepo.create
      .mockResolvedValueOnce(mockUserMessage)
      .mockResolvedValueOnce(mockAssistantMessage);
    contextBuilder.buildContext.mockResolvedValue(mockContext);
    openaiClient.call.mockResolvedValue({ content: 'Hi', usage: mockUsage });
    pricingService.calculateCost.mockResolvedValue(mockCost);
    messageRepo.findBySessionId.mockResolvedValue([mockUserMessage]);

    const result = await messageService.sendMessage('123', null, 'Hello');
    expect(result.message).toEqual(mockAssistantMessage);
    expect(result.usage).toEqual(mockUsage);
    expect(result.cost).toEqual(mockCost);
    expect(sessionRepo.update).toHaveBeenCalledWith('123', { title: 'Hello' }); // автогенерація назви
    expect(messageRepo.create).toHaveBeenCalledTimes(2);
  });

  test('should throw ValidationError if content empty', async () => {
    await expect(messageService.sendMessage('123', null, '')).rejects.toThrow(ValidationError);
    await expect(messageService.sendMessage('123', null, '   ')).rejects.toThrow(ValidationError);
  });

  test('should throw SessionNotFoundError if session missing', async () => {
    sessionRepo.findById.mockResolvedValue(null);
    await expect(messageService.sendMessage('999', null, 'Hello')).rejects.toThrow(SessionNotFoundError);
  });

  test('should handle OpenAI error gracefully', async () => {
    const mockSession = { id: '123', model: 'gpt-4o-mini', system_prompt: null, title: null };
    sessionRepo.findById.mockResolvedValue(mockSession);
    messageRepo.create.mockResolvedValue({ id: 'u1' });
    contextBuilder.buildContext.mockResolvedValue([]);
    openaiClient.call.mockRejectedValue(new Error('OpenAI error'));

    await expect(messageService.sendMessage('123', null, 'Hello')).rejects.toThrow('OpenAI error');
    // Перевіряємо, що повідомлення асистента не збережено
    expect(messageRepo.create).toHaveBeenCalledTimes(1); // тільки user message
  });
});