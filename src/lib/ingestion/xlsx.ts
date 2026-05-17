import * as XLSX from 'xlsx';
import type { RawIngestion } from './types';

/**
 * Parse an Excel workbook and return the first sheet's rows as records keyed
 * by the header row. Multi-sheet workbooks are flattened (sheet name prepended
 * to row data via the synthetic header "__sheet").
 */
export function ingestXlsx(buffer: Buffer, fileName: string): RawIngestion {
  const warnings: string[] = [];
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  if (workbook.SheetNames.length === 0) {
    return { fileName, source: 'xlsx', rows: [], warnings: ['Workbook senza fogli.'] };
  }
  if (workbook.SheetNames.length > 1) {
    warnings.push(
      `Trovati ${workbook.SheetNames.length} fogli — verranno uniti (colonna __sheet).`
    );
  }

  let headers: string[] = [];
  const allRows: Array<Record<string, string>> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]!;
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
    });
    if (json.length === 0) continue;

    const sheetHeaders = (json[0] as unknown as string[]).map((h) => String(h ?? '').trim());
    if (headers.length === 0) headers = ['__sheet', ...sheetHeaders];

    for (let r = 1; r < json.length; r++) {
      const row = json[r] as unknown as Array<string | number>;
      const record: Record<string, string> = { __sheet: sheetName };
      sheetHeaders.forEach((h, i) => {
        const v = row[i];
        record[h] = v == null ? '' : String(v).trim();
      });
      if (Object.values(record).some((v) => v && v !== sheetName)) {
        allRows.push(record);
      }
    }
  }

  return { fileName, source: 'xlsx', headers, rows: allRows, warnings };
}
