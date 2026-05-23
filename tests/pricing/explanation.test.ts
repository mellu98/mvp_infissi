import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Calculation explanation', () => {
  it('mentions product and total for FIXED_PRICE lines', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Zanzariera avvolgibile laterale bianca',
        basePrice: 180,
        pricingFormula: 'FIXED_PRICE',
      },
    });
    expect(res.explanation).toContain('Zanzariera');
    expect(res.explanation).toContain('180,00');
    expect(res.explanation).toContain('=');
  });

  it('mentions discount when applied', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 1000, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: 10,
    });
    expect(res.explanation).toMatch(/sconto/);
  });

  it('mentions optional when present', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 500, pricingFormula: 'FIXED_PRICE' },
      selectedOptions: [{ name: 'Maniglia premium', price: 45, priceType: 'FIXED' }],
    });
    expect(res.explanation).toMatch(/Maniglia premium/);
  });

  it('mentions fixed unit price when no override', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 200, pricingFormula: 'FIXED_PRICE' },
    });
    expect(res.explanation).toContain('200,00');
    expect(res.explanation).toContain('=');
  });
});
