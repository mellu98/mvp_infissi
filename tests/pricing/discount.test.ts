import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Discounts', () => {
  it('applies a line-level percentage discount before VAT', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 1000, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: 10,
    });
    expect(res.subtotal).toBe(1000);
    expect(res.discountAmount).toBe(100);
    expect(res.taxableAmount).toBe(900);
    expect(res.vatAmount).toBe(198);
    expect(res.total).toBe(1098);
  });

  it('clamps negative discount to 0', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: -10,
    });
    expect(res.discountAmount).toBe(0);
  });

  it('clamps discount > 100 to 100', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: 200,
    });
    expect(res.discountAmount).toBe(100);
    expect(res.taxableAmount).toBe(0);
    expect(res.total).toBe(0);
  });
});
