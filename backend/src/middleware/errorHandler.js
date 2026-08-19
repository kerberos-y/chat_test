const { AppError } = require('../errors/customErrors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown errors
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };