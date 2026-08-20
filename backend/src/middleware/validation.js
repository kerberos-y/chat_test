const { z } = require('zod');
const { ValidationError } = require('../errors/customErrors');

const createSessionSchema = z.object({
  model: z.string().optional(),
  system_prompt: z.string().optional(),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(100000),
  // model – опціональний рядок, додаємо явно в схемі нижче або тут
  // Для сумісності залишаємо базову схему, а в роутері розширюємо
});

// Ми розширюємо в роутері, але можемо додати і тут окрему схему.
// Для зручності експортуємо обидві.
const sendMessageWithModelSchema = sendMessageSchema.extend({
  model: z.string().optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    next(new ValidationError(error.errors.map(e => e.message).join(', ')));
  }
};

module.exports = {
  createSessionSchema,
  sendMessageSchema,
  sendMessageWithModelSchema,
  validate,
};