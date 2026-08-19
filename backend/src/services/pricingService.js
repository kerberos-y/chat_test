const pricingRepo = require('../repositories/pricingRepository');

class PricingService {
  async getPrice(model) {
    return pricingRepo.getPrice(model);
  }

  async calculateCost(model, promptTokens, completionTokens) {
    const pricing = await this.getPrice(model);
    const inputCost = (promptTokens / 1000) * parseFloat(pricing.input_price_per_1k);
    const outputCost = (completionTokens / 1000) * parseFloat(pricing.output_price_per_1k);
    return inputCost + outputCost;
  }
}

module.exports = new PricingService();