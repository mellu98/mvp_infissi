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
 * AnthropicAIProvider — STUB.
 *
 * STATUS: not implemented in the MVP. Falls back to the same heuristics as
 * MockAIProvider but logs a clear warning so it's obvious the model isn't
 * actually being used.
 *
 * To implement:
 *   1. `npm i @anthropic-ai/sdk`
 *   2. Replace the bodies below with structured prompt calls to Claude.
 *   3. Validate model output with Zod before returning.
 */
export class AnthropicAIProvider implements AIProvider {
  readonly name = 'anthropic';

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[AnthropicAIProvider] ANTHROPIC_API_KEY is missing — falling back to local heuristics.');
    }
  }

  async parsePricelist(text: string, hints?: PricelistParseHints): Promise<CandidateRow[]> {
    console.warn('[AnthropicAIProvider] parsePricelist is a stub (using heuristics).');
    return parsePricelistText(text, hints);
  }

  async parseQuoteNote(text: string, catalog: CatalogProductLite[]): Promise<QuoteNoteResult> {
    console.warn('[AnthropicAIProvider] parseQuoteNote is a stub (using heuristics).');
    return parseQuoteNoteHeuristic(text, catalog);
  }

  async normalizeProductRows(rows: CandidateRow[]): Promise<CandidateRow[]> {
    return rows;
  }
}
