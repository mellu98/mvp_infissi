import type {
  CatalogProductLite,
  QuoteNoteCandidate,
  QuoteNoteResult,
} from './provider';

/**
 * Heuristic parser for free-text quote notes (Italian).
 *
 * Extracts quantity, dimensions, color, material, variant and matches against
 * the product catalog. Does NOT compute prices — pricing is always handled by
 * the deterministic engine on validated input.
 *
 * Confidence is a 0..1 score combining the strength of the catalog match and
 * the completeness of the extracted fields. Caller MUST present candidates for
 * human approval before turning them into quote items.
 */

const QTY_WORDS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
};

const COLORS = [
  'bianco', 'bianca', 'bianchi', 'bianche',
  'nero', 'nera', 'neri', 'nere',
  'grigio', 'grigia', 'grigi', 'grigie',
  'marrone', 'marroni',
  'rosso', 'rossa', 'rossi', 'rosse',
  'blu',
  'verde', 'verdi',
  'giallo', 'gialla',
  'beige',
  'antracite',
  'argento', 'silver',
  'oro', 'gold',
  'noce', 'rovere', 'ciliegio', 'wenge',
];

const MATERIALS = ['pvc', 'alluminio', 'legno', 'cristallo', 'vetro', 'abs', 'acciaio', 'ferro'];

const VARIANTS = [
  'avvolgibile', 'avvolgibili',
  'laterale', 'laterali',
  'scorrevole', 'scorrevoli',
  'battente', 'battenti',
  'fissa', 'fisso', 'fisse', 'fissi',
  'plissé', 'plisse',
  'blindata', 'blindato', 'blindate', 'blindati',
  'interna', 'interno', 'interne', 'interni',
  'reversibile',
  'libro',
  'a libro',
  'taglio termico',
  'doppia guarnizione',
  'tripla guarnizione',
  '1 anta', '2 ante',
  'classe 1', 'classe 2', 'classe 3', 'classe 4',
];

const SERVICE_KEYWORDS = [
  { pattern: /\bposa\b/i, name: 'Posa' },
  { pattern: /\btrasporto\b/i, name: 'Trasporto' },
  { pattern: /\bdetrazion(e|i)\b/i, name: 'Supporto pratiche detrazioni' },
  { pattern: /\bsopralluogo\b/i, name: 'Sopralluogo' },
];

/** Words that mark a likely product-anchor noun. */
const PRODUCT_ANCHORS = [
  'zanzariera', 'zanzariere',
  'serramento', 'serramenti',
  'finestra', 'finestre', 'porta-finestra', 'portafinestra',
  'porta', 'porte',
  'tapparella', 'tapparelle',
  'persiana', 'persiane',
  'maniglia', 'maniglie',
];

const SPLIT_RE = /[.;]\s+/g;

export function parseQuoteNoteHeuristic(
  text: string,
  catalog: CatalogProductLite[]
): QuoteNoteResult {
  const warnings: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    return { originalText: text, candidates: [], warnings: ['Nota vuota.'] };
  }

  // 1. Split into sentences and then on " e " / "," boundaries that begin with a quantity.
  const sentences = trimmed.split(SPLIT_RE).filter(Boolean);
  const segments: string[] = [];
  for (const s of sentences) {
    splitOnQuantityBoundaries(s).forEach((seg) => {
      const t = seg.trim();
      if (t) segments.push(t);
    });
  }

  // 2. For each segment, attempt to build a candidate. Skip segments without a
  // product anchor *and* without a catalog match.
  const candidates: QuoteNoteCandidate[] = [];
  for (const segment of segments) {
    const candidate = extractCandidate(segment, catalog);
    if (candidate) candidates.push(candidate);
  }

  if (candidates.length === 0) {
    warnings.push('Nessun prodotto identificabile nella nota.');
  }

  return { originalText: text, candidates, warnings };
}

// ------------------------------------------------------------
// Splitting
// ------------------------------------------------------------

function splitOnQuantityBoundaries(text: string): string[] {
  // Split when " e " or ", " is followed by a quantity word/number AND a product anchor later.
  // To keep things simple we split on " e " or ", " only when followed by
  // a digit or quantity-word token (case-insensitive).
  const qtyPattern = `(?:\\d+|${Object.keys(QTY_WORDS).join('|')})`;
  const re = new RegExp(`(?:\\s+e\\s+|,\\s+)(?=${qtyPattern}\\b)`, 'gi');
  return text.split(re);
}

// ------------------------------------------------------------
// Extraction
// ------------------------------------------------------------

function extractCandidate(
  segment: string,
  catalog: CatalogProductLite[]
): QuoteNoteCandidate | null {
  const lower = segment.toLowerCase();

  // Quantity
  const quantity = extractQuantity(lower);

  // Dimensions — find ALL N x N patterns. The LAST one is usually the measurement
  // when there's also a profile size like "14x55".
  const dims = extractDimensions(segment);

  // Color, material, variant
  const color = extractFirstMatch(lower, COLORS);
  const material = extractFirstMatch(lower, MATERIALS);
  const variant = extractFirstMatch(lower, VARIANTS);

  // Optional services
  const optionNames = SERVICE_KEYWORDS.filter((k) => k.pattern.test(segment)).map((k) => k.name);

  // Find best catalog match
  const match = findBestProductMatch(lower, catalog);

  // If no catalog match AND no product anchor → not really a product mention.
  const hasAnchor = PRODUCT_ANCHORS.some((a) => lower.includes(a));
  if (!match && !hasAnchor) return null;

  // Confidence calculation
  const matchScore = match?.score ?? 0;
  const fields = [
    quantity > 0,
    dims.widthCm != null && dims.heightCm != null,
    !!color,
    !!material || !!variant,
  ].filter(Boolean).length;
  const confidence = clamp01(0.55 * matchScore + 0.1 * fields);

  const missingFields: string[] = [];
  if (!match) missingFields.push('prodotto');
  if (dims.widthCm == null || dims.heightCm == null) missingFields.push('misure');
  if (!color && match?.product.category === 'WINDOW') missingFields.push('colore');

  const rawHints: string[] = [];
  if (match) rawHints.push(`Match: ${match.product.name} (score ${matchScore.toFixed(2)})`);
  if (dims.allPairs.length > 1) {
    rawHints.push(`Più dimensioni trovate: ${dims.allPairs.map((p) => `${p[0]}x${p[1]}`).join(', ')}`);
  }

  return {
    segment,
    productName: match?.product.name ?? guessProductName(lower) ?? 'Prodotto non identificato',
    matchedProductId: match?.product.id,
    matchedProductSku: match?.product.sku,
    quantity: Math.max(1, quantity),
    widthCm: dims.widthCm,
    heightCm: dims.heightCm,
    lengthCm: null,
    color,
    material,
    variant,
    selectedOptionNames: optionNames,
    confidence,
    missingFields,
    rawHints,
  };
}

function extractQuantity(lowerSegment: string): number {
  // Numeric leading: "3 zanzariere", "2 porte"
  const numMatch = lowerSegment.match(/(^|\s)(\d+)\s+(?:[a-zàèéìòù]{3,})/);
  if (numMatch && numMatch[2]) {
    const n = parseInt(numMatch[2], 10);
    if (!Number.isNaN(n) && n > 0 && n < 1000) return n;
  }
  // Word-based: "due tapparelle", "tre zanzariere"
  for (const [word, value] of Object.entries(QTY_WORDS)) {
    const re = new RegExp(`(^|\\s)${word}\\s+`, 'i');
    if (re.test(lowerSegment)) return value;
  }
  return 1;
}

function extractDimensions(segment: string): {
  widthCm: number | null;
  heightCm: number | null;
  allPairs: Array<[number, number]>;
} {
  const re = /(\d+(?:[.,]\d+)?)\s*[x×X]\s*(\d+(?:[.,]\d+)?)/g;
  const pairs: Array<[number, number]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    const a = parseFloat(m[1]!.replace(',', '.'));
    const b = parseFloat(m[2]!.replace(',', '.'));
    if (Number.isFinite(a) && Number.isFinite(b)) pairs.push([a, b]);
  }
  if (pairs.length === 0) return { widthCm: null, heightCm: null, allPairs: [] };
  // Prefer the pair after the keyword "misura" if present; else the largest pair.
  const idx = findDimAfterKeyword(segment, /\bmisur[ae]\b/i);
  const chosen = idx != null && pairs[idx] ? pairs[idx]! : pickLargestPair(pairs);
  return { widthCm: chosen[0], heightCm: chosen[1], allPairs: pairs };
}

function findDimAfterKeyword(segment: string, kw: RegExp): number | null {
  const match = kw.exec(segment);
  if (!match) return null;
  const after = segment.slice(match.index);
  const dim = /(\d+(?:[.,]\d+)?)\s*[x×X]\s*(\d+(?:[.,]\d+)?)/.exec(after);
  if (!dim) return null;
  // index of the matched pair in the segment's pair list
  const before = segment.slice(0, match.index);
  const beforePairs = before.match(/\d+(?:[.,]\d+)?\s*[x×X]\s*\d+(?:[.,]\d+)?/g) ?? [];
  return beforePairs.length;
}

function pickLargestPair(pairs: Array<[number, number]>): [number, number] {
  return pairs.reduce((best, p) => (p[0] * p[1] > best[0] * best[1] ? p : best), pairs[0]!);
}

function extractFirstMatch(lower: string, list: string[]): string | null {
  for (const word of list) {
    if (lower.includes(word)) return word;
  }
  return null;
}

function guessProductName(lower: string): string | null {
  for (const anchor of PRODUCT_ANCHORS) {
    if (lower.includes(anchor)) return capitalize(anchor);
  }
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

// ------------------------------------------------------------
// Product matching
// ------------------------------------------------------------

interface MatchResult {
  product: CatalogProductLite;
  score: number;
}

const STOPWORDS = new Set([
  'di', 'da', 'il', 'la', 'le', 'lo', 'i', 'gli', 'un', 'uno', 'una', 'con', 'per', 'in', 'a', 'e',
  'al', 'alla', 'sui', 'su', 'del', 'della', 'dei', 'delle',
]);

function findBestProductMatch(
  lowerSegment: string,
  catalog: CatalogProductLite[]
): MatchResult | null {
  let best: MatchResult | null = null;
  for (const product of catalog) {
    const score = scoreProduct(lowerSegment, product);
    if (score > 0 && (!best || score > best.score)) best = { product, score };
  }
  if (!best || best.score < 0.25) return null;
  return best;
}

function scoreProduct(lowerSegment: string, product: CatalogProductLite): number {
  if (
    ['INSTALLATION', 'TRANSPORT', 'TAX_SUPPORT'].includes(product.category) &&
    PRODUCT_ANCHORS.some((anchor) => lowerSegment.includes(anchor))
  ) {
    return 0;
  }

  const segmentTokens = tokenize(lowerSegment);
  const nameTokens = tokenize(product.name.toLowerCase());
  if (nameTokens.size === 0) return 0;
  let matched = 0;
  let boost = 0;
  for (const t of nameTokens) {
    if (segmentTokens.has(t)) {
      matched++;
      // Distinctive tokens (uppercase models like K5000, Zeus, Coveral) get a boost.
      if (/^[a-z]{1,5}\d{2,5}$/i.test(t) || isModelToken(t)) boost += 0.5;
    }
  }
  // SKU exact match in segment → big boost
  if (product.sku && lowerSegment.includes(product.sku.toLowerCase())) boost += 1;
  const ratio = matched / nameTokens.size;
  return ratio + boost * 0.3;
}

function tokenize(s: string): Set<string> {
  const rawTokens = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && t.length > 1);

  const tokens = new Set<string>();
  for (const token of rawTokens) {
    for (const candidate of expandItalianToken(token)) {
      if (!STOPWORDS.has(candidate) && candidate.length > 1) tokens.add(candidate);
    }
  }
  return tokens;
}

function expandItalianToken(token: string): string[] {
  const candidates = new Set<string>([token]);

  if (token.endsWith('che') && token.length > 4) {
    candidates.add(`${token.slice(0, -3)}ca`);
    candidates.add(`${token.slice(0, -3)}co`);
  }
  if (token.endsWith('ghe') && token.length > 4) {
    candidates.add(`${token.slice(0, -3)}ga`);
    candidates.add(`${token.slice(0, -3)}go`);
  }
  if (token.endsWith('bili') && token.length > 5) {
    candidates.add(`${token.slice(0, -4)}bile`);
  }
  if (token.endsWith('ali') && token.length > 4) {
    candidates.add(`${token.slice(0, -3)}ale`);
  }
  if (token.endsWith('ere') && token.length > 4) {
    candidates.add(`${token.slice(0, -1)}a`);
  }
  if (token.endsWith('e') && token.length > 3) {
    candidates.add(`${token.slice(0, -1)}a`);
    candidates.add(`${token.slice(0, -1)}o`);
  }
  if (token.endsWith('i') && token.length > 3) {
    candidates.add(`${token.slice(0, -1)}o`);
    candidates.add(`${token.slice(0, -1)}e`);
  }

  return Array.from(candidates);
}

const KNOWN_MODELS = new Set([
  'k4000', 'k5000', 'coveral', 'nextal', 'termalmix', 'solmix', 'elite',
  'rever', 'essential', 'metropolitan', 'luxury', 'solution',
  'urano', 'poseidon', 'zeus', 'helios', 'ares', 'vogue',
]);
function isModelToken(t: string): boolean {
  return KNOWN_MODELS.has(t);
}
