import type { RawIngestion } from './types';

/**
 * Extract plain text from a PDF buffer using pdf-parse.
 *
 * NOTE: pdf-parse@1.1.1 ships a buggy index.js that opens a test PDF at import
 * time, which throws ENOENT in serverless/Next.js environments. We dynamically
 * import the inner module to bypass it.
 *
 * The returned RawIngestion has no headers/rows — pricelist-parser will run
 * over `fullText` to produce candidate rows.
 */
export async function ingestPdf(buffer: Buffer, fileName: string): Promise<RawIngestion> {
  const warnings: string[] = [];
  try {
    const mod = await import('pdf-parse/lib/pdf-parse.js');
    const pdf = (mod.default ?? mod) as (buf: Buffer) => Promise<{ text: string }>;
    const parsed = await pdf(buffer);
    const text = parsed?.text?.trim() ?? '';
    if (!text) warnings.push('Nessun testo estratto dal PDF (potrebbe essere scansionato).');
    return {
      fileName,
      source: 'pdf',
      rows: [],
      fullText: text,
      warnings,
    };
  } catch (err) {
    return {
      fileName,
      source: 'pdf',
      rows: [],
      fullText: '',
      warnings: [`Errore parsing PDF: ${(err as Error).message}`],
    };
  }
}
