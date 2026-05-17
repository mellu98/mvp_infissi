import { describe, expect, it } from 'vitest';
import { calculateQuoteLine } from '@/lib/pricing';

describe('VAT handling', () => {
  it('uses 22% by default', () => {
    const res = calculateQuoteLine({
      product: { name: 'X', basePrice: 100, pricingFormula: 'FIXED_PRICE' },
    });
    expect(res.vatRate).toBe(22);
    expect(res.vatAmount).toBe(22);
    expect(res.total).toBe(122);
  });

  it('honours custom VAT rate', () => {
    const res = calculateQuoteLine(
      { product: { name: 'X', basePrice: 100, pricingFormula: 'FIXED_PRICE' } },
      { vatRate: 10, currency: 'EUR' }
    );
    expect(res.vatRate).toBe(10);
    expect(res.vatAmount).toBe(10);
    expect(res.total).toBe(110);
  });

  it('VAT 0% returns subtotal as total', () => {
    const res = calculateQuoteLine(
      { product: { name: 'X', basePrice: 250, pricingFormula: 'FIXED_PRICE' } },
      { vatRate: 0, currency: 'EUR' }
    );
    expect(res.vatAmount).toBe(0);
    expect(res.total).toBe(250);
  });
});
