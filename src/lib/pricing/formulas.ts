import type { OptionSnapshot, PricingFormulaKind, ProductSnapshot } from './types';
import { round4 } from './rounding';

export interface FormulaContext {
  areaMq: number | null;
  billableAreaMq: number | null;
  linearMeters: number | null;
  product: ProductSnapshot;
  options: OptionSnapshot[];
}

/**
 * Compute the unit price for a single product based on its pricing formula.
 * Output is rounded to 4 decimals (internal precision); the engine rounds
 * the final amounts to 2 decimals for display.
 */
export function computeUnitPrice(formula: PricingFormulaKind, ctx: FormulaContext): number {
  const { product, areaMq, billableAreaMq, linearMeters, options } = ctx;

  switch (formula) {
    case 'FIXED_PRICE':
      return round4(product.basePrice);

    case 'PER_SQUARE_METER': {
      const sqmRate = product.pricePerSquareMeter ?? 0;
      const area = billableAreaMq ?? 0;
      return round4(sqmRate * area);
    }

    case 'PER_LINEAR_METER': {
      const lmRate = product.pricePerLinearMeter ?? 0;
      const lm = linearMeters ?? 0;
      return round4(lmRate * lm);
    }

    case 'BASE_PLUS_AREA': {
      const sqmRate = product.pricePerSquareMeter ?? 0;
      const area = areaMq ?? 0;
      return round4(product.basePrice + sqmRate * area);
    }

    case 'BASE_PLUS_OPTIONS': {
      // Unit price = basePrice. FIXED options are rolled into unit price here;
      // the engine will set optionsTotal accordingly to avoid double counting.
      const fixedOptionsSum = options
        .filter((o) => o.priceType === 'FIXED')
        .reduce((sum, o) => sum + (o.price ?? 0), 0);
      return round4(product.basePrice + fixedOptionsSum);
    }

    case 'CUSTOM_FORMULA':
      // Reserved for a safe expression evaluator. In the MVP we require a
      // manualPriceOverride. The engine handles that case explicitly.
      throw new Error(
        'CUSTOM_FORMULA is not implemented in the MVP. Provide manualPriceOverride on the line.'
      );

    default: {
      const _exhaustive: never = formula;
      throw new Error(`Unknown pricing formula: ${_exhaustive as string}`);
    }
  }
}
