import { computeUnitPrice, type FormulaContext } from './formulas';
import { round2, round4 } from './rounding';
import type {
  LineCalculation,
  LineInput,
  OptionLineDetail,
  OptionSnapshot,
  PricingSettings,
  QuoteTotals,
} from './types';

const DEFAULT_SETTINGS: PricingSettings = { vatRate: 22, currency: 'EUR' };

/**
 * Calculate a single quote line deterministically.
 *
 * - Area is computed from width/height in cm (areaMq = w*h/10000).
 * - Billable area honours product.minBillableQuantity.
 * - Options price types: FIXED, PER_SQUARE_METER, PER_LINEAR_METER, PERCENTAGE.
 * - For BASE_PLUS_OPTIONS, FIXED options are rolled into unit price (not double-counted).
 * - manualPriceOverride bypasses the formula but keeps options/discount/VAT intact.
 *
 * Returns a fully-detailed breakdown with a human-readable Italian explanation.
 */
export function calculateQuoteLine(
  input: LineInput,
  settings: PricingSettings = DEFAULT_SETTINGS
): LineCalculation {
  const warnings: string[] = [];
  const product = input.product;
  const quantity = input.quantity ?? 1;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0.');
  }
  const discountPct = clampPercentage(input.discountPercentage ?? 0);
  const vatRate = settings.vatRate;

  // Geometry
  const areaMq = computeArea(input.widthCm, input.heightCm);
  const linearMeters = computeLinear(input.lengthCm);
  const billableAreaMq = computeBillableArea(areaMq, product.minBillableQuantity);

  if (
    (product.pricingFormula === 'PER_SQUARE_METER' || product.pricingFormula === 'BASE_PLUS_AREA') &&
    !areaMq
  ) {
    warnings.push('Misure mancanti per il calcolo a metro quadro.');
  }
  if (product.pricingFormula === 'PER_LINEAR_METER' && !linearMeters) {
    warnings.push('Lunghezza mancante per il calcolo a metro lineare.');
  }

  const options = input.selectedOptions ?? [];
  const ctx: FormulaContext = { product, areaMq, billableAreaMq, linearMeters, options };

  // Unit price
  let unitPrice: number;
  let manualOverrideApplied = false;
  if (input.manualPriceOverride != null && Number.isFinite(input.manualPriceOverride)) {
    unitPrice = round4(input.manualPriceOverride);
    manualOverrideApplied = true;
  } else {
    unitPrice = computeUnitPrice(product.pricingFormula, ctx);
  }

  // Option totals — note: for BASE_PLUS_OPTIONS, FIXED options are already in unitPrice.
  const optionsTotalRaw = computeOptionsTotal({
    options,
    unitPrice,
    billableAreaMq,
    linearMeters,
    skipFixed: product.pricingFormula === 'BASE_PLUS_OPTIONS' && !manualOverrideApplied,
  });
  const optionDetails = buildOptionDetails(options);

  // Aggregate
  const lineGrossPerUnit = unitPrice + optionsTotalRaw.total;
  const subtotal = round2(lineGrossPerUnit * quantity);
  const discountAmount = round2(subtotal * (discountPct / 100));
  const taxableAmount = round2(subtotal - discountAmount);
  const vatAmount = round2(taxableAmount * (vatRate / 100));
  const total = round2(taxableAmount + vatAmount);

  const explanation = buildExplanation({
    product,
    quantity,
    areaMq,
    billableAreaMq,
    linearMeters,
    unitPrice,
    optionsTotal: optionsTotalRaw.total,
    optionDetails: optionsTotalRaw.detailsForExplanation,
    subtotal,
    discountPct,
    discountAmount,
    taxableAmount,
    vatRate,
    vatAmount,
    total,
    manualOverrideApplied,
  });

  return {
    areaMq,
    billableAreaMq,
    linearMeters,
    unitPrice: round2(unitPrice),
    optionsTotal: round2(optionsTotalRaw.total),
    optionDetails,
    subtotal,
    discountAmount,
    taxableAmount,
    vatRate,
    vatAmount,
    total,
    explanation,
    manualOverrideApplied,
    warnings,
  };
}

/**
 * Aggregate quote totals from already-calculated lines.
 * Applies an optional global discount on the taxable amount before VAT.
 */
export function calculateQuoteTotals(
  lines: LineCalculation[],
  globalDiscountPercentage: number = 0,
  vatRate: number = 22
): QuoteTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const lineDiscountTotal = round2(lines.reduce((s, l) => s + l.discountAmount, 0));
  const taxableBeforeGlobal = round2(subtotal - lineDiscountTotal);
  const globalDiscount = round2(
    taxableBeforeGlobal * (clampPercentage(globalDiscountPercentage) / 100)
  );
  const taxableAmount = round2(taxableBeforeGlobal - globalDiscount);
  const vatTotal = round2(taxableAmount * (vatRate / 100));
  const grandTotal = round2(taxableAmount + vatTotal);
  return {
    subtotal,
    discountTotal: round2(lineDiscountTotal + globalDiscount),
    globalDiscountAmount: globalDiscount,
    taxableAmount,
    vatTotal,
    grandTotal,
  };
}

// ------------------------------------------------------------
// internals
// ------------------------------------------------------------

function clampPercentage(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

function computeArea(widthCm?: number | null, heightCm?: number | null): number | null {
  if (widthCm == null || heightCm == null) return null;
  if (widthCm <= 0 || heightCm <= 0) return null;
  return round4((widthCm * heightCm) / 10000);
}

function computeLinear(lengthCm?: number | null): number | null {
  if (lengthCm == null || lengthCm <= 0) return null;
  return round4(lengthCm / 100);
}

function computeBillableArea(
  areaMq: number | null,
  minBillable?: number | null
): number | null {
  if (areaMq == null) return minBillable && minBillable > 0 ? minBillable : null;
  if (minBillable && minBillable > 0) return Math.max(areaMq, minBillable);
  return areaMq;
}

interface ComputeOptionsParams {
  options: OptionSnapshot[];
  unitPrice: number;
  billableAreaMq: number | null;
  linearMeters: number | null;
  skipFixed: boolean;
}

interface ComputeOptionsResult {
  total: number;
  detailsForExplanation: Array<{ name: string; amount: number }>;
}

function computeOptionsTotal(p: ComputeOptionsParams): ComputeOptionsResult {
  let total = 0;
  const details: Array<{ name: string; amount: number }> = [];
  for (const opt of p.options) {
    let amount = 0;
    switch (opt.priceType) {
      case 'FIXED':
        if (p.skipFixed) continue;
        amount = opt.price;
        break;
      case 'PER_SQUARE_METER':
        amount = (opt.price ?? 0) * (p.billableAreaMq ?? 0);
        break;
      case 'PER_LINEAR_METER':
        amount = (opt.price ?? 0) * (p.linearMeters ?? 0);
        break;
      case 'PERCENTAGE':
        amount = (opt.price ?? 0) * 0.01 * p.unitPrice;
        break;
    }
    amount = round4(amount);
    total += amount;
    details.push({ name: opt.name, amount });
  }
  return { total: round4(total), detailsForExplanation: details };
}

function buildOptionDetails(options: OptionSnapshot[]): OptionLineDetail[] {
  return options.map((o) => ({
    name: o.name,
    priceType: o.priceType,
    unitAmount: round2(o.price),
  }));
}

// ------------------------------------------------------------
// Human-readable Italian explanation
// ------------------------------------------------------------

interface ExplanationInput {
  product: { name: string; pricingFormula: string };
  quantity: number;
  areaMq: number | null;
  billableAreaMq: number | null;
  linearMeters: number | null;
  unitPrice: number;
  optionsTotal: number;
  optionDetails: Array<{ name: string; amount: number }>;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  manualOverrideApplied: boolean;
}

function buildExplanation(i: ExplanationInput): string {
  const eur = (n: number) =>
    new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const num = (n: number, dec = 2) =>
    new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(n);

  const parts: string[] = [];
  parts.push(`${i.product.name}.`);

  if (i.manualOverrideApplied) {
    parts.push(`Prezzo unitario manuale: ${eur(i.unitPrice)}.`);
  } else {
    switch (i.product.pricingFormula) {
      case 'FIXED_PRICE':
        parts.push(`Prezzo fisso unitario: ${eur(i.unitPrice)}.`);
        break;
      case 'PER_SQUARE_METER':
        if (i.billableAreaMq != null) {
          parts.push(
            `Area ${num(i.billableAreaMq, 2)} mq × tariffa = ${eur(i.unitPrice)}.`
          );
        } else {
          parts.push(`Prezzo unitario: ${eur(i.unitPrice)}.`);
        }
        break;
      case 'PER_LINEAR_METER':
        if (i.linearMeters != null) {
          parts.push(
            `Lunghezza ${num(i.linearMeters, 2)} m × tariffa = ${eur(i.unitPrice)}.`
          );
        } else {
          parts.push(`Prezzo unitario: ${eur(i.unitPrice)}.`);
        }
        break;
      case 'BASE_PLUS_AREA':
        if (i.areaMq != null) {
          parts.push(
            `Prezzo base + area ${num(i.areaMq, 2)} mq = ${eur(i.unitPrice)}.`
          );
        } else {
          parts.push(`Prezzo unitario: ${eur(i.unitPrice)}.`);
        }
        break;
      case 'BASE_PLUS_OPTIONS':
        parts.push(`Prezzo base + optional inclusi = ${eur(i.unitPrice)}.`);
        break;
      default:
        parts.push(`Prezzo unitario: ${eur(i.unitPrice)}.`);
    }
  }

  if (i.quantity !== 1) {
    parts.push(`Quantità: ${num(i.quantity, 2)}.`);
  }

  if (i.optionsTotal > 0 && i.optionDetails.length > 0) {
    const opts = i.optionDetails
      .map((d) => `${d.name} ${eur(d.amount)}`)
      .join(', ');
    parts.push(`Optional aggiuntivi: ${opts}.`);
  }

  parts.push(`Imponibile riga: ${eur(i.subtotal)}.`);
  if (i.discountAmount > 0) {
    parts.push(
      `Sconto ${num(i.discountPct, 2)}%: −${eur(i.discountAmount)} → ${eur(i.taxableAmount)}.`
    );
  }
  parts.push(`IVA ${num(i.vatRate, 0)}%: ${eur(i.vatAmount)}.`);
  parts.push(`Totale riga: ${eur(i.total)}.`);

  return parts.join(' ');
}
