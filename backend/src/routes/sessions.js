const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const messageService = require('../services/messageService');
const { validate, createSessionSchema, sendMessageSchema } = require('../middleware/validation');

// GET /sessions - список сесій (для UI)
router.get('/', async (req, res, next) => {
  try {
    const sessions = await sessionService.listSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// POST /sessions - створити сесію
router.post('/', validate(createSessionSchema), async (req, res, next) => {
  try {
    const { model, system_prompt, title } = req.body;
    const session = await sessionService.createSession({
      model,
      systemPrompt: system_prompt,
      title,
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /sessions/:id - отримати сесію + історію + total cost
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSession(id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// POST /sessions/:id/messages - надіслати повідомлення
router.post(
  '/:id/messages',
  validate(sendMessageSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const result = await messageService.sendMessage(id, null, content);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;