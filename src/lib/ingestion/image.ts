import type { RawIngestion } from './types';

/**
 * Image ingestion — STUB (no OCR in the MVP).
 *
 * Returns an empty result with a clear warning. To enable OCR:
 *   1. Add `tesseract.js` (or call a cloud OCR API).
 *   2. Implement here, passing the raw text to `parsePricelistText`.
 *
 * The price-list UI is expected to fall back to manual entry whenever a row
 * arrives with an image source and no extracted rows.
 */
export async function ingestImage(_buffer: Buffer, fileName: string): Promise<RawIngestion> {
  return {
    fileName,
    source: 'image',
    rows: [],
    fullText: '',
    warnings: [
      'OCR non implementato in questo MVP. Carica un CSV/Excel/PDF testuale oppure inserisci i prodotti a mano.',
    ],
  };
}
