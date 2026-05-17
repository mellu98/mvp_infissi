import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('CUSTOM_FORMULA', () => {
  it('throws if no manualPriceOverride is given', () => {
    expect(() =>
      calculateQuoteLine({
        product: { name: 'X', basePrice: 0, pricingFormula: 'CUSTOM_FORMULA' },
      })
    ).toThrow(/CUSTOM_FORMULA/);
  });
});
