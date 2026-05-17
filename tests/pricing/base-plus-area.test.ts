import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('BASE_PLUS_AREA formula', () => {
  it('K5000 serramento 100x210 at base 260 + 210 €/mq', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Serramento K5000 PVC tripla guarnizione',
        basePrice: 260,
        pricePerSquareMeter: 210,
        pricingFormula: 'BASE_PLUS_AREA',
      },
      widthCm: 100,
      heightCm: 210,
    });
    expect(res.areaMq).toBe(2.1);
    expect(res.unitPrice).toBe(701);
    expect(res.total).toBeCloseTo(855.22, 2);
  });

  it('still applies basePrice when measurements are missing (warns)', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'X',
        basePrice: 260,
        pricePerSquareMeter: 210,
        pricingFormula: 'BASE_PLUS_AREA',
      },
    });
    expect(res.unitPrice).toBe(260);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
