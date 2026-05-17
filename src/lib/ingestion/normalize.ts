import { parsePricelistText, type CandidateRow } from '@/lib/ai';
import type { IngestionHints, RawIngestion } from './types';

const HEADER_ALIASES: Record<string, string> = {
  // names
  nome: 'name',
  prodotto: 'name',
  articolo: 'name',
  descrizione: 'description',

  // sku
  sku: 'sku',
  codice: 'sku',
  cod: 'sku',
  'codice articolo': 'sku',

  // prices
  prezzo: 'basePrice',
  importo: 'basePrice',
  costo: 'basePrice',
  'prezzo base': 'basePrice',
  'prezzo unitario': 'basePrice',
  'prezzo €': 'basePrice',
  euro: 'basePrice',

  'prezzo mq': 'pricePerSquareMeter',
  'prezzo al mq': 'pricePerSquareMeter',
  '€/mq': 'pricePerSquareMeter',
  'eur/mq': 'pricePerSquareMeter',
  mq: 'pricePerSquareMeter',

  'prezzo ml': 'pricePerLinearMeter',
  'prezzo al metro lineare': 'pricePerLinearMeter',
  '€/ml': 'pricePerLinearMeter',

  // categorical
  categoria: 'category',
  colore: 'color',
  materiale: 'material',
  variante: 'variant',
  unita: 'unit',
  'unità': 'unit',
  um: 'unit',
};

/**
 * Convert a RawIngestion into CandidateRow[].
 *  - If rows are present (CSV/XLSX), map columns via HEADER_ALIASES.
 *  - If only fullText is present (PDF/DOCX), delegate to parsePricelistText.
 */
export function normalizeIngestion(raw: RawIngestion, hints?: IngestionHints): CandidateRow[] {
  if (raw.rows.length > 0) {
    return raw.rows
      .map((row) => normalizeRow(row, raw, hints))
      .filter((r): r is CandidateRow => r != null);
  }
  if (raw.fullText && raw.fullText.length > 0) {
    return parsePricelistText(raw.fullText, hints);
  }
  return [];
}

function normalizeRow(
  row: Record<string, string>,
  raw: RawIngestion,
  hints?: IngestionHints
): CandidateRow | null {
  const mapped: Partial<Record<string, string>> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = HEADER_ALIASES[key.toLowerCase().trim()];
    if (normalizedKey) mapped[normalizedKey] = value;
  }

  const name = mapped.name?.trim();
  if (!name) return null;

  const validationErrors: string[] = [];
  const basePrice = toNumberOrNull(mapped.basePrice);
  const pricePerSquareMeter = toNumberOrNull(mapped.pricePerSquareMeter);
  const pricePerLinearMeter = toNumberOrNull(mapped.pricePerLinearMeter);

  if (basePrice == null && pricePerSquareMeter == null && pricePerLinearMeter == null) {
    validationErrors.push('Nessun prezzo identificato nella riga.');
  }

  const formula: CandidateRow['pricingFormula'] = pricePerSquareMeter != null && basePrice != null
    ? 'BASE_PLUS_AREA'
    : pricePerSquareMeter != null
      ? 'PER_SQUARE_METER'
      : pricePerLinearMeter != null
        ? 'PER_LINEAR_METER'
        : 'FIXED_PRICE';

  const fieldsScore =
    (name ? 0.4 : 0) +
    (mapped.sku ? 0.2 : 0) +
    (basePrice != null || pricePerSquareMeter != null || pricePerLinearMeter != null ? 0.4 : 0);

  return {
    productName: name,
    category: (mapped.category ?? hints?.category ?? 'OTHER').toUpperCase(),
    sku: mapped.sku ?? null,
    description: mapped.description ?? null,
    basePrice,
    pricePerSquareMeter,
    pricePerLinearMeter,
    unit: mapped.unit ?? null,
    minBillableQuantity: null,
    color: mapped.color ?? null,
    material: mapped.material ?? null,
    variant: mapped.variant ?? null,
    options: null,
    pricingFormula: formula,
    confidence: Math.min(0.7, fieldsScore),
    rawText: JSON.stringify(row),
    validationErrors,
  };
}

function toNumberOrNull(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
