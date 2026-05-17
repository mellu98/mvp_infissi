import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('PER_LINEAR_METER formula', () => {
  it('computes 200cm length at 30 €/m', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Profilo lineare',
        basePrice: 0,
        pricePerLinearMeter: 30,
        pricingFormula: 'PER_LINEAR_METER',
      },
      lengthCm: 200,
    });
    expect(res.linearMeters).toBe(2);
    expect(res.unitPrice).toBe(60);
    expect(res.total).toBeCloseTo(73.2, 2);
  });

  it('warns when length is missing', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'X',
        basePrice: 0,
        pricePerLinearMeter: 30,
        pricingFormula: 'PER_LINEAR_METER',
      },
    });
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.unitPrice).toBe(0);
  });
});
