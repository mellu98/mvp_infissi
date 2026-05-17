import { describe, expect, it } from 'vitest';
import { round, round2, round4, roundHalfToEven } from '@/lib/pricing';

describe('round/round2/round4', () => {
  it('round2 handles FP precision (1.005 → 1.01)', () => {
    expect(round2(1.005)).toBe(1.01);
  });

  it('round2 handles trailing zeros', () => {
    expect(round2(2.1)).toBe(2.1);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('round4 keeps four decimals', () => {
    expect(round4(2.88)).toBe(2.88);
    expect(round4(1 / 3)).toBe(0.3333);
  });

  it('round() supports arbitrary decimals', () => {
    expect(round(1.23456, 3)).toBe(1.235);
    expect(round(1.23456, 0)).toBe(1);
  });

  it('round handles non-finite values defensively', () => {
    expect(round(Number.NaN)).toBe(0);
    expect(round(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("roundHalfToEven (banker's rounding)", () => {
  it('rounds 2.5 to 2 and 3.5 to 4', () => {
    expect(roundHalfToEven(2.5, 0)).toBe(2);
    expect(roundHalfToEven(3.5, 0)).toBe(4);
  });

  it('rounds 0.125 to 0.12 and 0.135 to 0.14', () => {
    expect(roundHalfToEven(0.125, 2)).toBe(0.12);
    expect(roundHalfToEven(0.135, 2)).toBe(0.14);
  });

  it('rounds non-half values normally', () => {
    expect(roundHalfToEven(1.236, 2)).toBe(1.24);
    expect(roundHalfToEven(1.234, 2)).toBe(1.23);
  });
});
