import type { CandidateRow } from './provider';

/**
 * Heuristic price-list text parser used by MockAIProvider.
 *
 * Extracts rows from plain text where each line resembles:
 *   "PRODUCT NAME | SKU | PRICE [€] [per unit]"
 *   "PRODUCT NAME 45 €/mq"
 *   "PRODUCT NAME prezzo 950"
 *
 * Confidence is intentionally conservative — every row defaults to needs_review
 * unless price + name are both clearly extracted.
 */
export function parsePricelistText(text: string, hints?: { category?: string }): CandidateRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !looksLikeHeader(l));

  const out: CandidateRow[] = [];
  for (const raw of lines) {
    const row = parseSingleLine(raw, hints?.category);
    if (row) out.push(row);
  }
  return out;
}

function looksLikeHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    /^(prezzo|prezzi|listino|cod\.?|sku|articolo|prodotto|descrizione|importo)/.test(lower) &&
    !/\d/.test(line)
  );
}

function parseSingleLine(line: string, hintCategory?: string): CandidateRow | null {
  // Pipe-separated: NAME | SKU | PRICE
  const pipe = line.split(/\s*\|\s*/);
  if (pipe.length >= 2) {
    const name = pipe[0]!;
    const sku = pipe[1] ?? null;
    const priceTok = pipe.slice(2).join(' ');
    const price = extractPrice(priceTok || pipe[1] || '');
    if (price.basePrice != null || price.pricePerSquareMeter != null) {
      return buildRow({ name, sku, line, price, hintCategory });
    }
  }

  // Fallback: "NAME ... NUMBER €/mq" or "NAME ... NUMBER" at the end
  const price = extractPrice(line);
  if (price.basePrice == null && price.pricePerSquareMeter == null && price.pricePerLinearMeter == null) {
    return null;
  }

  // Use everything before the first digit-with-currency as the name.
  const nameMatch = line.match(/^(.+?)\s+\d[\d.,]*\s*(?:€|EUR|\/mq|\/ml|euro)/i);
  const name = (nameMatch ? nameMatch[1] : line).trim();
  return buildRow({ name, sku: null, line, price, hintCategory });
}

interface ExtractedPrice {
  basePrice: number | null;
  pricePerSquareMeter: number | null;
  pricePerLinearMeter: number | null;
  formulaHint: 'FIXED_PRICE' | 'PER_SQUARE_METER' | 'PER_LINEAR_METER' | 'BASE_PLUS_AREA' | null;
}

function extractPrice(text: string): ExtractedPrice {
  const out: ExtractedPrice = {
    basePrice: null,
    pricePerSquareMeter: null,
    pricePerLinearMeter: null,
    formulaHint: null,
  };
  const sqm = text.match(/(\d[\d.,]*)\s*€?\s*\/?\s*mq\b/i);
  const lm = text.match(/(\d[\d.,]*)\s*€?\s*\/?\s*(?:ml|metro lineare)\b/i);
  const basePlus = text.match(/base\s*(\d[\d.,]*)\s*\+\s*(\d[\d.,]*)\s*\/\s*mq/i);
  const fixed = text.match(/(?:prezzo|costo|importo)?\s*(\d[\d.,]*)\s*(?:€|euro|EUR)/i);

  if (basePlus && basePlus[1] && basePlus[2]) {
    out.basePrice = parseNumber(basePlus[1]);
    out.pricePerSquareMeter = parseNumber(basePlus[2]);
    out.formulaHint = 'BASE_PLUS_AREA';
    return out;
  }
  if (sqm && sqm[1]) {
    out.pricePerSquareMeter = parseNumber(sqm[1]);
    out.formulaHint = 'PER_SQUARE_METER';
    return out;
  }
  if (lm && lm[1]) {
    out.pricePerLinearMeter = parseNumber(lm[1]);
    out.formulaHint = 'PER_LINEAR_METER';
    return out;
  }
  if (fixed && fixed[1]) {
    out.basePrice = parseNumber(fixed[1]);
    out.formulaHint = 'FIXED_PRICE';
    return out;
  }
  return out;
}

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

interface BuildRowParams {
  name: string;
  sku: string | null;
  line: string;
  price: ExtractedPrice;
  hintCategory?: string;
}

function buildRow(p: BuildRowParams): CandidateRow {
  const validationErrors: string[] = [];
  if (!p.name) validationErrors.push('Nome prodotto mancante.');
  if (
    p.price.basePrice == null &&
    p.price.pricePerSquareMeter == null &&
    p.price.pricePerLinearMeter == null
  ) {
    validationErrors.push('Prezzo non identificato.');
  }

  const fieldsScore =
    (p.name ? 0.4 : 0) +
    (p.sku ? 0.2 : 0) +
    (p.price.basePrice != null || p.price.pricePerSquareMeter != null || p.price.pricePerLinearMeter != null
      ? 0.4
      : 0);

  return {
    productName: p.name,
    category: (p.hintCategory ?? 'OTHER').toUpperCase(),
    sku: p.sku,
    description: null,
    basePrice: p.price.basePrice,
    pricePerSquareMeter: p.price.pricePerSquareMeter,
    pricePerLinearMeter: p.price.pricePerLinearMeter,
    unit: null,
    minBillableQuantity: null,
    color: null,
    material: null,
    variant: null,
    options: null,
    pricingFormula: p.price.formulaHint ?? 'FIXED_PRICE',
    confidence: Math.min(0.7, fieldsScore), // mock never exceeds 0.7 — keep humans in the loop
    rawText: p.line,
    validationErrors,
  };
}
