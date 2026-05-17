import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Minimum billable quantity', () => {
  it('lifts area to minBillable when actual area is smaller', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Zanzariera mini plissé',
        basePrice: 0,
        pricePerSquareMeter: 65,
        minBillableQuantity: 1.0,
        pricingFormula: 'PER_SQUARE_METER',
      },
      widthCm: 50,
      heightCm: 50,
    });
    expect(res.areaMq).toBe(0.25);
    expect(res.billableAreaMq).toBe(1.0);
    expect(res.unitPrice).toBe(65);
    expect(res.total).toBeCloseTo(79.3, 2);
  });

  it('does not lift area when actual is bigger', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Zanzariera',
        basePrice: 0,
        pricePerSquareMeter: 45,
        minBillableQuantity: 1.0,
        pricingFormula: 'PER_SQUARE_METER',
      },
      widthCm: 120,
      heightCm: 240,
    });
    expect(res.billableAreaMq).toBe(2.88);
    expect(res.unitPrice).toBe(129.6);
  });
});
