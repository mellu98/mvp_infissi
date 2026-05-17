import type { RawIngestion } from './types';

/**
 * Extract plain text from a DOCX buffer using mammoth.
 * Tables are flattened into newline-separated lines.
 */
export async function ingestDocx(buffer: Buffer, fileName: string): Promise<RawIngestion> {
  const warnings: string[] = [];
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim() ?? '';
    if (!text) warnings.push('Nessun testo estratto dal DOCX.');
    if (result.messages && result.messages.length > 0) {
      warnings.push(...result.messages.map((m) => `mammoth: ${m.message}`));
    }
    return { fileName, source: 'docx', rows: [], fullText: text, warnings };
  } catch (err) {
    return {
      fileName,
      source: 'docx',
      rows: [],
      fullText: '',
      warnings: [`Errore parsing DOCX: ${(err as Error).message}`],
    };
  }
}
