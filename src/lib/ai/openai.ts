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
 * OpenAIProvider — STUB. Same fallback pattern as AnthropicAIProvider.
 * To implement: `npm i openai`, wire `process.env.OPENAI_API_KEY`, return
 * Zod-validated structured outputs.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[OpenAIProvider] OPENAI_API_KEY is missing — falling back to local heuristics.');
    }
  }

  async parsePricelist(text: string, hints?: PricelistParseHints): Promise<CandidateRow[]> {
    console.warn('[OpenAIProvider] parsePricelist is a stub (using heuristics).');
    return parsePricelistText(text, hints);
  }

  async parseQuoteNote(text: string, catalog: CatalogProductLite[]): Promise<QuoteNoteResult> {
    console.warn('[OpenAIProvider] parseQuoteNote is a stub (using heuristics).');
    return parseQuoteNoteHeuristic(text, catalog);
  }

  async normalizeProductRows(rows: CandidateRow[]): Promise<CandidateRow[]> {
    return rows;
  }
}
