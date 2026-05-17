import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('FIXED_PRICE formula', () => {
  it('returns basePrice as unit price', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Porta blindata Zeus 1 anta',
        basePrice: 950,
        pricingFormula: 'FIXED_PRICE',
      },
    });
    expect(res.unitPrice).toBe(950);
    expect(res.subtotal).toBe(950);
    expect(res.vatAmount).toBe(209);
    expect(res.total).toBe(1159);
    expect(res.areaMq).toBeNull();
    expect(res.linearMeters).toBeNull();
    expect(res.manualOverrideApplied).toBe(false);
  });

  it('multiplies by quantity > 1', () => {
    const res = calculateQuoteLine({
      product: { name: 'Maniglia premium', basePrice: 45, pricingFormula: 'FIXED_PRICE' },
      quantity: 4,
    });
    expect(res.unitPrice).toBe(45);
    expect(res.subtotal).toBe(180);
    expect(res.total).toBe(180 + 39.6);
  });

  it('throws when quantity is zero', () => {
    expect(() =>
      calculateQuoteLine({
        product: { name: 'X', basePrice: 10, pricingFormula: 'FIXED_PRICE' },
        quantity: 0,
      })
    ).toThrow();
  });
});
