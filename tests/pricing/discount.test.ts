import { describe, expect, it } from 'vitest';
import { calculateQuoteLine, calculateQuoteTotals } from '@/lib/pricing';

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

  it('applies global discount on top of line discounts in calculateQuoteTotals', () => {
    const l1 = calculateQuoteLine({
      product: { name: 'A', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
      discountPercentage: 10,
    });
    const l2 = calculateQuoteLine({
      product: { name: 'B', basePrice: 200, pricingFormula: 'FIXED_PRICE' },
    });
    const totals = calculateQuoteTotals([l1, l2], 5, 22);
    expect(totals.subtotal).toBe(300);
    // line discount: 10 (10% of 100). Global: 5% of (300-10) = 14.50
    expect(totals.globalDiscountAmount).toBe(14.5);
    expect(totals.discountTotal).toBe(24.5);
    expect(totals.taxableAmount).toBe(275.5);
    expect(totals.vatTotal).toBeCloseTo(60.61, 2);
    expect(totals.grandTotal).toBeCloseTo(336.11, 2);
  });
});
