import { describe, expect, it } from 'vitest';
import { parsePricelistText } from '@/lib/ai';

describe('parsePricelistText', () => {
  it('extracts pipe-separated rows', () => {
    const txt = `Listino 2026
Zanzariera laterale bianca | ZAN-LAT-BIA | 45 €/mq
Serramento K5000 PVC | SER-K5000 | base 260 + 210 /mq
Porta blindata Zeus | PB-ZEUS | 950 €`;
    const rows = parsePricelistText(txt);
    expect(rows.length).toBe(3);
    expect(rows[0]!.pricePerSquareMeter).toBe(45);
    expect(rows[1]!.basePrice).toBe(260);
    expect(rows[1]!.pricePerSquareMeter).toBe(210);
    expect(rows[1]!.pricingFormula).toBe('BASE_PLUS_AREA');
    expect(rows[2]!.basePrice).toBe(950);
  });

  it('flags rows without recognizable price', () => {
    const txt = `Riga senza prezzo`;
    const rows = parsePricelistText(txt);
    expect(rows).toHaveLength(0);
  });

  it('caps confidence at 0.7 even with all fields', () => {
    const txt = `Zanzariera laterale bianca | ZAN-LAT-BIA | 45 €/mq`;
    const rows = parsePricelistText(txt);
    expect(rows[0]!.confidence).toBeLessThanOrEqual(0.7);
  });
});
