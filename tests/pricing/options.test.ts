import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('Product options pricing', () => {
  it('FIXED option adds flat amount per unit', () => {
    const res = calculateQuoteLine({
      product: { name: 'Serramento', basePrice: 500, pricingFormula: 'FIXED_PRICE' },
      selectedOptions: [{ name: 'Maniglia premium', price: 45, priceType: 'FIXED' }],
    });
    expect(res.optionsTotal).toBe(45);
    expect(res.subtotal).toBe(545);
  });

  it('PER_SQUARE_METER option multiplies by billable area', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Serramento',
        basePrice: 0,
        pricePerSquareMeter: 100,
        pricingFormula: 'PER_SQUARE_METER',
      },
      widthCm: 100,
      heightCm: 100,
      selectedOptions: [
        { name: 'Vetro extra', price: 5, priceType: 'PER_SQUARE_METER' },
      ],
    });
    expect(res.areaMq).toBe(1);
    expect(res.unitPrice).toBe(100);
    expect(res.optionsTotal).toBe(5);
    expect(res.subtotal).toBe(105);
  });

  it('PER_LINEAR_METER option multiplies by linear meters', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Profilo',
        basePrice: 0,
        pricePerLinearMeter: 30,
        pricingFormula: 'PER_LINEAR_METER',
      },
      lengthCm: 200,
      selectedOptions: [
        { name: 'Finitura', price: 4, priceType: 'PER_LINEAR_METER' },
      ],
    });
    expect(res.linearMeters).toBe(2);
    expect(res.unitPrice).toBe(60);
    expect(res.optionsTotal).toBe(8);
    expect(res.subtotal).toBe(68);
  });

  it('PERCENTAGE option applies on unit price (not on options)', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 1000, pricingFormula: 'FIXED_PRICE' },
      selectedOptions: [
        { name: 'Maggiorazione', price: 15, priceType: 'PERCENTAGE' },
      ],
    });
    expect(res.optionsTotal).toBe(150);
    expect(res.subtotal).toBe(1150);
  });

  it('multiple option types combine correctly', () => {
    const res = calculateQuoteLine({
      product: {
        name: 'Serramento',
        basePrice: 260,
        pricePerSquareMeter: 210,
        pricingFormula: 'BASE_PLUS_AREA',
      },
      widthCm: 100,
      heightCm: 210,
      selectedOptions: [
        { name: 'Maniglia', price: 50, priceType: 'FIXED' },
        { name: 'Vetro', price: 10, priceType: 'PER_SQUARE_METER' },
      ],
    });
    expect(res.unitPrice).toBe(701);
    // FIXED 50 + PER_SQM 10*2.1 = 71
    expect(res.optionsTotal).toBe(71);
    expect(res.subtotal).toBe(772);
  });
});
