import type { RawIngestion } from './types';

/**
 * Minimal RFC-4180-ish CSV parser. Handles:
 *   - comma or semicolon delimiter (auto-detected from the first line)
 *   - quoted fields with embedded delimiters and "" escapes
 *   - CRLF / LF line endings
 *   - skip empty lines
 *
 * Returns headers (first non-empty row) and rows keyed by header.
 */
export function ingestCsv(buffer: Buffer, fileName: string): RawIngestion {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const allRows = parseCsv(text, delimiter);
  if (allRows.length === 0) {
    return { fileName, source: 'csv', rows: [], warnings: ['File CSV vuoto.'] };
  }
  const [headerRow, ...dataRows] = allRows;
  const headers = headerRow!.map((h) => h.trim());
  const rows = dataRows.map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (cols[i] ?? '').trim();
    });
    return record;
  });
  return { fileName, source: 'csv', headers, rows, warnings: [] };
}

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

function parseCsv(text: string, delim: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delim) {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim().length > 0)) out.push(row);
      row = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim().length > 0)) out.push(row);
  }
  return out;
}
