import type { PricingFormulaKind } from '@/lib/pricing/types';

/**
 * AI provider interface — used by the price-list parser and quote-note parser.
 * MockAIProvider is the MVP default; Anthropic/OpenAI providers are stubs.
 */

export interface PricelistParseHints {
  category?: string;
  supplier?: string;
}

export interface CandidateRow {
  productName: string;
  category: string;
  sku: string | null;
  description: string | null;
  basePrice: number | null;
  pricePerSquareMeter: number | null;
  pricePerLinearMeter: number | null;
  unit: string | null;
  minBillableQuantity: number | null;
  color: string | null;
  material: string | null;
  variant: string | null;
  options: Record<string, unknown> | null;
  pricingFormula: PricingFormulaKind;
  confidence: number;
  rawText: string;
  validationErrors: string[];
}

export interface CatalogProductLite {
  id: string;
  name: string;
  sku: string;
  category: string;
  material?: string | null;
  pricingFormula: PricingFormulaKind;
}

export interface QuoteNoteCandidate {
  segment: string;
  productName: string;
  matchedProductId?: string;
  matchedProductSku?: string;
  quantity: number;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  color: string | null;
  material: string | null;
  variant: string | null;
  selectedOptionNames: string[];
  confidence: number;
  missingFields: string[];
  rawHints: string[];
}

export interface QuoteNoteResult {
  originalText: string;
  candidates: QuoteNoteCandidate[];
  warnings: string[];
}

export interface AIProvider {
  readonly name: string;
  parsePricelist(text: string, hints?: PricelistParseHints): Promise<CandidateRow[]>;
  parseQuoteNote(text: string, catalog: CatalogProductLite[]): Promise<QuoteNoteResult>;
  normalizeProductRows(rows: CandidateRow[]): Promise<CandidateRow[]>;
}
