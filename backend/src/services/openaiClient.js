const OpenAI = require('openai');
const config = require('../config');
const { OpenAIError } = require('../errors/customErrors');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

class OpenAIClient {
  async call(messages, model, maxCompletionTokens = config.maxCompletionTokens) {
    // Якщо ввімкнено мок-режим – повертаємо тестову відповідь без запиту до OpenAI
    if (process.env.USE_MOCK_OPENAI === 'true') {
      logger.warn('🔧 Using mock OpenAI response (USE_MOCK_OPENAI=true)');
      return {
        content: 'Це тестова відповідь (mock). Поповніть баланс OpenAI для реальної роботи.',
        usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
      };
    }

    let attempts = 0;
    const maxRetries = 2;
    const backoff = 1000;

    while (attempts <= maxRetries) {
      try {
        const response = await openai.chat.completions.create({
          model: model || config.defaultModel,
          messages,
          max_completion_tokens: maxCompletionTokens,
        });

        const { choices, usage } = response;
        if (!choices || choices.length === 0) {
          throw new OpenAIError('No response choices from OpenAI');
        }

        return {
          content: choices[0].message.content,
          usage: {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
          },
        };
      } catch (error) {
        logger.error(`OpenAI call attempt ${attempts + 1} failed: ${error.message}`);
        // Якщо це помилка квоти – не робимо повторних спроб, одразу кидаємо
        if (error.status === 429 && error.message.includes('quota')) {
          throw new OpenAIError(`429 You exceeded your current quota. Please add credits to your OpenAI account.`);
        }
        // Інші помилки – повторюємо
        if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
          attempts++;
          if (attempts <= maxRetries) {
            const delay = backoff * Math.pow(2, attempts - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw new OpenAIError(`OpenAI API error: ${error.message}`);
      }
    }
    throw new OpenAIError('Failed to get response from OpenAI after retries');
  }
}

module.exports = new OpenAIClient();