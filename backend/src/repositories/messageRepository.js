const supabase = require('../config/supabase');

class MessageRepository {
  async create({ sessionId, role, content, tokensPrompt, tokensCompletion, costUsd, model }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        tokens_prompt: tokensPrompt || null,
        tokens_completion: tokensCompletion || null,
        cost_usd: costUsd || null,
        model: model || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}

module.exports = new MessageRepository();