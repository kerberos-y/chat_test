class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class SessionNotFoundError extends AppError {
  constructor(id) {
    super(`Session with id ${id} not found`, 404);
    this.name = 'SessionNotFoundError';
  }
}

class OpenAIError extends AppError {
  constructor(message) {
    super(message, 502);
    this.name = 'OpenAIError';
  }
}

class PricingError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = 'PricingError';
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

module.exports = {
  AppError,
  SessionNotFoundError,
  OpenAIError,
  PricingError,
  ValidationError,
};