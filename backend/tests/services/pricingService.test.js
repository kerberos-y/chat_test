const pricingService = require('../../src/services/pricingService');
const pricingRepo = require('../../src/repositories/pricingRepository');

jest.mock('../../src/repositories/pricingRepository');

describe('PricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate cost correctly', async () => {
    const mockPricing = {
      model: 'gpt-4o-mini',
      input_price_per_1k: 0.000150,
      output_price_per_1k: 0.000600,
    };
    pricingRepo.getPrice.mockResolvedValue(mockPricing);

    const cost = await pricingService.calculateCost('gpt-4o-mini', 100, 200);
    expect(cost).toBeCloseTo(0.000015 + 0.000120, 6); // (100/1000)*0.000150 + (200/1000)*0.000600
    expect(pricingRepo.getPrice).toHaveBeenCalledWith('gpt-4o-mini');
  });

  test('should throw error if pricing not found', async () => {
    pricingRepo.getPrice.mockRejectedValue(new Error('Pricing not found'));
    await expect(pricingService.calculateCost('unknown-model', 10, 10)).rejects.toThrow('Pricing not found');
  });
});