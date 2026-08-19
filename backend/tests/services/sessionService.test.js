const sessionService = require('../../src/services/sessionService');
const sessionRepo = require('../../src/repositories/sessionRepository');
const messageRepo = require('../../src/repositories/messageRepository');
const { SessionNotFoundError } = require('../../src/errors/customErrors');

jest.mock('../../src/repositories/sessionRepository');
jest.mock('../../src/repositories/messageRepository');
jest.mock('node-cache');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a session', async () => {
    const mockSession = { id: '123', model: 'gpt-4o-mini', title: null };
    sessionRepo.create.mockResolvedValue(mockSession);

    const result = await sessionService.createSession({ model: 'gpt-4o-mini' });
    expect(result).toEqual(mockSession);
    expect(sessionRepo.create).toHaveBeenCalledWith({
      userId: undefined,
      model: 'gpt-4o-mini',
      systemPrompt: undefined,
      title: undefined,
    });
  });

  test('should get session with messages', async () => {
    const mockSession = { id: '123', title: 'Test' };
    const mockMessages = [{ id: 'msg1', content: 'Hello' }];
    sessionRepo.findById.mockResolvedValue(mockSession);
    messageRepo.findBySessionId.mockResolvedValue(mockMessages);

    const result = await sessionService.getSession('123');
    expect(result).toEqual({ ...mockSession, messages: mockMessages });
    expect(sessionRepo.findById).toHaveBeenCalledWith('123');
    expect(messageRepo.findBySessionId).toHaveBeenCalledWith('123');
  });

  test('should throw SessionNotFoundError if session does not exist', async () => {
    sessionRepo.findById.mockResolvedValue(null);
    await expect(sessionService.getSession('999')).rejects.toThrow(SessionNotFoundError);
  });

  test('should list sessions', async () => {
    const mockSessions = [{ id: '1' }, { id: '2' }];
    sessionRepo.findAll.mockResolvedValue(mockSessions);

    const result = await sessionService.listSessions();
    expect(result).toEqual(mockSessions);
    // У вашому sessionService.listSessions викликається sessionRepo.findAll(userId)
    // Якщо параметр userId має дефолтне значення null, то очікуємо null.
    // Якщо дефолту немає, то очікуйте undefined.
    // За замовчуванням у вашому коді: async listSessions(userId = null) => тому null.
    expect(sessionRepo.findAll).toHaveBeenCalledWith(null);
  });
});