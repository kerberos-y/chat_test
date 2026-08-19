const supabase = require('../config/supabase');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

class PricingRepository {
  async getPrice(model) {
    const cacheKey = `pricing_${model}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('model_pricing')
      .select('*')
      .eq('model', model)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Pricing not found for model ${model}`);

    cache.set(cacheKey, data);
    return data;
  }
}

module.exports = new PricingRepository();