import { describe, expect, it } from 'vitest';
import { ingestCsv } from '@/lib/ingestion/csv';
import { normalizeIngestion } from '@/lib/ingestion';

describe('ingestCsv', () => {
  it('parses comma-separated CSV with header', () => {
    const csv = Buffer.from(
      `nome,sku,prezzo\nZanzariera laterale,ZAN-1,"45,00"\nPorta blindata,PB-1,"950"`
    );
    const raw = ingestCsv(csv, 'listino.csv');
    expect(raw.rows).toHaveLength(2);
    expect(raw.rows[0]!.nome).toBe('Zanzariera laterale');
    expect(raw.rows[0]!.prezzo).toBe('45,00');
  });

  it('parses semicolon-separated CSV (Italian default)', () => {
    const csv = Buffer.from(`Nome;SKU;Prezzo\nZanzariera laterale;ZAN-1;45,00`);
    const raw = ingestCsv(csv, 'listino.csv');
    expect(raw.rows).toHaveLength(1);
    expect(raw.rows[0]!['Nome']).toBe('Zanzariera laterale');
  });
});

describe('normalizeIngestion', () => {
  it('maps Italian headers to candidate rows', () => {
    const csv = Buffer.from(
      `Nome,SKU,Prezzo mq,Categoria\nZanzariera laterale,ZAN-1,"45,00",MOSQUITO_SCREEN`
    );
    const raw = ingestCsv(csv, 'listino.csv');
    const rows = normalizeIngestion(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.productName).toBe('Zanzariera laterale');
    expect(rows[0]!.sku).toBe('ZAN-1');
    expect(rows[0]!.pricePerSquareMeter).toBe(45);
    expect(rows[0]!.pricingFormula).toBe('PER_SQUARE_METER');
    expect(rows[0]!.category).toBe('MOSQUITO_SCREEN');
  });

  it('emits validation error when price is missing', () => {
    const csv = Buffer.from(`Nome,SKU\nProdotto senza prezzo,X-1`);
    const raw = ingestCsv(csv, 'listino.csv');
    const rows = normalizeIngestion(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.validationErrors.length).toBeGreaterThan(0);
  });
});
