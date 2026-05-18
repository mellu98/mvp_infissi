/**
 * Pure types for the pricing engine.
 * Intentionally decoupled from Prisma so the engine can be tested in isolation.
 * The string-literal unions mirror the Prisma enums in schema.prisma.
 */

export type PricingFormulaKind =
  | 'FIXED_PRICE'
  | 'PER_SQUARE_METER'
  | 'PER_LINEAR_METER'
  | 'BASE_PLUS_AREA'
  | 'BASE_PLUS_OPTIONS'
  | 'CUSTOM_FORMULA';

export type OptionPriceTypeKind =
  | 'FIXED'
  | 'PER_SQUARE_METER'
  | 'PER_LINEAR_METER'
  | 'PERCENTAGE';

export interface ProductSnapshot {
  id?: string;
  sku?: string;
  name: string;
  category?: string;
  unit?: string;
  basePrice: number;
  pricePerSquareMeter?: number | null;
  pricePerLinearMeter?: number | null;
  minBillableQuantity?: number | null;
  pricingFormula: PricingFormulaKind;
  demoPrice?: boolean;
}

export interface OptionSnapshot {
  id?: string;
  name: string;
  price: number;
  priceType: OptionPriceTypeKind;
}

export interface LineInput {
  product: ProductSnapshot;
  quantity?: number;
  widthCm?: number | null;
  heightCm?: number | null;
  lengthCm?: number | null;
  selectedOptions?: OptionSnapshot[];
  selectedVariant?: string;
  discountPercentage?: number;
  manualPriceOverride?: number | null;
  notes?: string;
}

export interface PricingSettings {
  vatRate: number;
  currency: string;
}

export interface OptionLineDetail {
  name: string;
  priceType: OptionPriceTypeKind;
  unitAmount: number;
}

export interface LineCalculation {
  areaMq: number | null;
  billableAreaMq: number | null;
  linearMeters: number | null;
  unitPrice: number;
  optionsTotal: number;
  optionDetails: OptionLineDetail[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  explanation: string;
  manualOverrideApplied: boolean;
  warnings: string[];
}

export interface QuoteTotals {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  vatTotal: number;
  grandTotal: number;
}
