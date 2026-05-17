/**
 * Round to N decimals avoiding the classic Math.round IEEE-754 trap
 * (e.g. 1.005 → 1.00). Default 2 decimals for currency amounts.
 */
export function round(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export const round2 = (value: number) => round(value, 2);
export const round4 = (value: number) => round(value, 4);

/**
 * Banker's rounding (round half to even). Used for accounting where bias matters.
 * Not used by the engine by default; exposed for callers that need IEEE 754-2008 behavior.
 */
export function roundHalfToEven(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;

  let rounded: number;
  if (Math.abs(diff - 0.5) < 1e-9) {
    rounded = floor % 2 === 0 ? floor : floor + 1;
  } else {
    rounded = Math.round(scaled);
  }
  return rounded / factor;
}
