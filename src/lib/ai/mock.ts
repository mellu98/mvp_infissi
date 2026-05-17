import type {
  AIProvider,
  CandidateRow,
  CatalogProductLite,
  PricelistParseHints,
  QuoteNoteResult,
} from './provider';
import { parseQuoteNoteHeuristic } from './note-parser';
import { parsePricelistText } from './pricelist-parser';

/**
 * Mock AI provider used by default in the MVP. All logic is local and
 * deterministic — no network calls. Confidence is capped at 0.7 to ensure
 * candidate rows always surface in the human review UI.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async parsePricelist(
    text: string,
    hints?: PricelistParseHints
  ): Promise<CandidateRow[]> {
    return parsePricelistText(text, hints);
  }

  async parseQuoteNote(
    text: string,
    catalog: CatalogProductLite[]
  ): Promise<QuoteNoteResult> {
    return parseQuoteNoteHeuristic(text, catalog);
  }

  async normalizeProductRows(rows: CandidateRow[]): Promise<CandidateRow[]> {
    // The mock provider does not transform rows beyond what the text parser produced.
    // Real providers may merge duplicates, normalize units, or fill missing SKUs.
    return rows;
  }
}
