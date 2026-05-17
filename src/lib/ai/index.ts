import type { AIProvider } from './provider';
import { MockAIProvider } from './mock';
import { AnthropicAIProvider } from './anthropic';
import { OpenAIProvider } from './openai';

export type {
  AIProvider,
  CandidateRow,
  CatalogProductLite,
  PricelistParseHints,
  QuoteNoteCandidate,
  QuoteNoteResult,
} from './provider';
export { MockAIProvider } from './mock';
export { parseQuoteNoteHeuristic } from './note-parser';
export { parsePricelistText } from './pricelist-parser';

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const kind = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  switch (kind) {
    case 'anthropic':
      cached = new AnthropicAIProvider();
      break;
    case 'openai':
      cached = new OpenAIProvider();
      break;
    case 'mock':
    default:
      cached = new MockAIProvider();
  }
  return cached;
}

export function __resetAIProvider(): void {
  cached = null;
}
