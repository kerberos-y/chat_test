const supabase = require('../config/supabase');

class SessionRepository {
  async create({ userId, model, systemPrompt, title }) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId || null,
        model: model || 'gpt-4o-mini',
        system_prompt: systemPrompt || null,
        title: title || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null; // not found
    if (error) throw error;
    return data;
  }

  async findAll(userId = null) {
    let query = supabase.from('sessions').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = new SessionRepository();