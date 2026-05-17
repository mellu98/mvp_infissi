import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('PER_SQUARE_METER formula', () => {
  it('computes 120x240 zanzariera at 45 €/mq', () => {
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
    expect(res.areaMq).toBe(2.88);
    expect(res.billableAreaMq).toBe(2.88);
    expect(res.unitPrice).toBe(129.6);
    expect(res.subtotal).toBe(129.6);
    expect(res.vatAmount).toBeCloseTo(28.51, 2);
    expect(res.total).toBeCloseTo(158.11, 2);
  });

  it('multiplies by quantity', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Zanzariera',
        basePrice: 0,
        pricePerSquareMeter: 45,
        pricingFormula: 'PER_SQUARE_METER',
      },
      widthCm: 120,
      heightCm: 240,
      quantity: 3,
    });
    expect(res.subtotal).toBe(388.8);
    expect(res.total).toBeCloseTo(474.34, 2);
  });

  it('emits a warning if measurements are missing', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'X',
        basePrice: 0,
        pricePerSquareMeter: 45,
        pricingFormula: 'PER_SQUARE_METER',
      },
    });
    expect(res.unitPrice).toBe(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
