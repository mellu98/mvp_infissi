import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Calculation explanation', () => {
  it('mentions area and VAT for PER_SQUARE_METER lines', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Zanzariera avvolgibile laterale bianca',
        basePrice: 0,
        pricePerSquareMeter: 45,
        pricingFormula: 'PER_SQUARE_METER',
      },
      widthCm: 120,
      heightCm: 240,
    });
    expect(res.explanation).toContain('Zanzariera');
    expect(res.explanation).toContain('mq');
    expect(res.explanation).toContain('IVA');
    expect(res.explanation).toContain('Totale riga');
  });

  it('mentions discount when applied', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 1000, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: 10,
    });
    expect(res.explanation).toMatch(/Sconto/);
  });

  it('mentions optional when present', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 500, pricingFormula: 'FIXED_PRICE' },
      selectedOptions: [{ name: 'Maniglia premium', price: 45, priceType: 'FIXED' }],
    });
    expect(res.explanation).toMatch(/Maniglia premium/);
  });

  it('mentions manual override when applied', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
      manualPriceOverride: 200,
    });
    expect(res.explanation).toMatch(/manuale/i);
  });
});
