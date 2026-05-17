import { ingestCsv } from './csv';
import { ingestXlsx } from './xlsx';
import { ingestPdf } from './pdf';
import { ingestDocx } from './docx';
import { ingestImage } from './image';
import { normalizeIngestion } from './normalize';
import type { IngestionHints, RawIngestion } from './types';
import type { CandidateRow } from '@/lib/ai';

export type { RawIngestion, IngestionHints } from './types';
export { normalizeIngestion } from './normalize';

export async function ingestFile(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<RawIngestion> {
  const { buffer, fileName, mimeType } = params;
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();

  if (mimeType.includes('csv') || ext === 'csv') return ingestCsv(buffer, fileName);
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'xlsm'
  ) {
    return ingestXlsx(buffer, fileName);
  }
  if (mimeType.includes('pdf') || ext === 'pdf') return ingestPdf(buffer, fileName);
  if (
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('msword') ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    return ingestDocx(buffer, fileName);
  }
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return ingestImage(buffer, fileName);
  }
  return {
    fileName,
    source: 'csv',
    rows: [],
    warnings: [`Formato file non supportato: ${mimeType || ext}`],
  };
}

export async function ingestAndNormalize(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  hints?: IngestionHints;
}): Promise<{ raw: RawIngestion; candidates: CandidateRow[] }> {
  const raw = await ingestFile(params);
  const candidates = normalizeIngestion(raw, params.hints);
  return { raw, candidates };
}
