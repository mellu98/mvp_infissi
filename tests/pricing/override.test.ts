import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Manual price override', () => {
  it('replaces the formula result while keeping options/discount/VAT', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Serramento speciale',
        basePrice: 260,
        pricePerSquareMeter: 210,
        pricingFormula: 'BASE_PLUS_AREA',
      },
      widthCm: 100,
      heightCm: 210,
      manualPriceOverride: 500,
      selectedOptions: [{ name: 'Maniglia', price: 50, priceType: 'FIXED' }],
      discountPercentage: 10,
    });
    expect(res.manualOverrideApplied).toBe(true);
    expect(res.unitPrice).toBe(500);
    expect(res.optionsTotal).toBe(50);
    expect(res.subtotal).toBe(550);
    expect(res.discountAmount).toBe(55);
    expect(res.taxableAmount).toBe(495);
    expect(res.total).toBeCloseTo(603.9, 2);
  });

  it('makes CUSTOM_FORMULA usable when override is provided', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 0, pricingFormula: 'CUSTOM_FORMULA' },
      manualPriceOverride: 1234.56,
    });
    expect(res.unitPrice).toBe(1234.56);
    expect(res.manualOverrideApplied).toBe(true);
  });
});
