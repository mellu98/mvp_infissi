import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('BASE_PLUS_OPTIONS formula', () => {
  it('rolls FIXED options into unit price; optionsTotal is 0', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Porta blindata Zeus',
        basePrice: 950,
        pricingFormula: 'BASE_PLUS_OPTIONS',
      },
      selectedOptions: [
        { name: 'Serratura speciale', price: 80, priceType: 'FIXED' },
        { name: 'Pannello interno', price: 120, priceType: 'FIXED' },
      ],
    });
    expect(res.unitPrice).toBe(1150);
    expect(res.optionsTotal).toBe(0);
    expect(res.subtotal).toBe(1150);
    expect(res.total).toBeCloseTo(1403, 2);
  });

  it('keeps PERCENTAGE options separate from unit price', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Porta blindata',
        basePrice: 1000,
        pricingFormula: 'BASE_PLUS_OPTIONS',
      },
      selectedOptions: [
        { name: 'Maggiorazione', price: 10, priceType: 'PERCENTAGE' },
      ],
    });
    expect(res.unitPrice).toBe(1000);
    expect(res.optionsTotal).toBe(100);
    expect(res.subtotal).toBe(1100);
  });
});
