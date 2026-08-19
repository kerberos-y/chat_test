const { z } = require('zod');
const { ValidationError } = require('../errors/customErrors');

const createSessionSchema = z.object({
  model: z.string().optional(),
  system_prompt: z.string().optional(),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(100000),
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
  validate,
};