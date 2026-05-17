export interface RawIngestion {
  fileName: string;
  source: 'csv' | 'xlsx' | 'pdf' | 'docx' | 'image';
  headers?: string[];
  rows: Array<Record<string, string>>;
  fullText?: string;
  warnings: string[];
}

export interface IngestionHints {
  category?: string;
  supplier?: string;
}
