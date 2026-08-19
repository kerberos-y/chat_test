require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxCompletionTokens: 4096,
  // Контекстні ліміти для моделей (можна розширити)
  modelLimits: {
    'gpt-4o-mini': { maxContextTokens: 128000 },
    'gpt-4o': { maxContextTokens: 128000 },
    'gpt-4-turbo': { maxContextTokens: 128000 },
    'gpt-3.5-turbo': { maxContextTokens: 16385 },
  },
};