import { describe, expect, it } from 'vitest';
import { calculateQuoteLine, calculateQuoteTotals } from '@/lib/pricing';

describe('calculateQuoteTotals', () => {
  it('aggregates multiple lines with no global discount', () => {
    const l1 = calculateQuoteLine({
      product: { name: 'A', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
    });
    const l2 = calculateQuoteLine({
      product: { name: 'B', basePrice: 200, pricingFormula: 'FIXED_PRICE' },
    });
    const totals = calculateQuoteTotals([l1, l2], 0, 22);
    expect(totals.subtotal).toBe(300);
    expect(totals.discountTotal).toBe(0);
    expect(totals.taxableAmount).toBe(300);
    expect(totals.vatTotal).toBe(66);
    expect(totals.grandTotal).toBe(366);
  });

  it('handles empty line list', () => {
    const totals = calculateQuoteTotals([], 0, 22);
    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });
});
