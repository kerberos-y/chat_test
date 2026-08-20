const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const messageService = require('../services/messageService');
const { validate, createSessionSchema, sendMessageSchema } = require('../middleware/validation');
const { z } = require('zod');

// GET /sessions - список сесій
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

// НОВИЙ маршрут: POST /sessions/:id/reset - скинути сесію
router.post('/:id/reset', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedSession = await sessionService.resetSession(id);
    res.json(updatedSession);
  } catch (error) {
    next(error);
  }
});

// POST /sessions/:id/messages - надіслати повідомлення (з можливістю вказати модель)
const sendMessageWithModelSchema = sendMessageSchema.extend({
  model: z.string().optional(),
});

router.post(
  '/:id/messages',
  validate(sendMessageWithModelSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content, model } = req.body;
      const result = await messageService.sendMessage(id, null, content, model);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;