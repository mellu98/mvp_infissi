import { describe, expect, it } from 'vitest';
import { parseQuoteNoteHeuristic } from '@/lib/ai';
import type { CatalogProductLite } from '@/lib/ai';

const CATALOG: CatalogProductLite[] = [
  {
    id: 'p1',
    sku: 'ZAN-AVV-LAT-BIA',
    name: 'Zanzariera avvolgibile laterale bianca',
    category: 'MOSQUITO_SCREEN',
    pricingFormula: 'PER_SQUARE_METER',
  },
  {
    id: 'p2',
    sku: 'SER-K5000',
    name: 'Serramento K5000 PVC tripla guarnizione',
    category: 'WINDOW',
    pricingFormula: 'BASE_PLUS_AREA',
  },
  {
    id: 'p3',
    sku: 'PB-ZEUS',
    name: 'Porta blindata 1 anta classe 3 modello Zeus',
    category: 'ARMORED_DOOR',
    pricingFormula: 'FIXED_PRICE',
  },
  {
    id: 'p4',
    sku: 'TAP-ALU-1455',
    name: 'Tapparella alluminio 14x55',
    category: 'SHUTTER',
    pricingFormula: 'PER_SQUARE_METER',
  },
  {
    id: 'p5',
    sku: 'PER-VOGUE-ALU',
    name: 'Persiana Vogue alluminio',
    category: 'PERSIANA',
    pricingFormula: 'PER_SQUARE_METER',
  },
  {
    id: 'p6',
    sku: 'SER-COVERAL',
    name: 'Serramento Coveral PVC-Alluminio',
    category: 'WINDOW',
    pricingFormula: 'BASE_PLUS_AREA',
  },
  {
    id: 'p7',
    sku: 'PI-METROPOLITAN',
    name: 'Porta interna linea Metropolitan',
    category: 'INTERIOR_DOOR',
    pricingFormula: 'FIXED_PRICE',
  },
  {
    id: 'pos',
    sku: 'POSA',
    name: 'Posa serramento',
    category: 'INSTALLATION',
    pricingFormula: 'FIXED_PRICE',
  },
];

describe('parseQuoteNoteHeuristic', () => {
  it('extracts 3 zanzariere 120x240', () => {
    const r = parseQuoteNoteHeuristic(
      'Cliente vuole 3 zanzariere avvolgibili laterali bianche 120x240.',
      CATALOG
    );
    expect(r.candidates).toHaveLength(1);
    const c = r.candidates[0]!;
    expect(c.quantity).toBe(3);
    expect(c.widthCm).toBe(120);
    expect(c.heightCm).toBe(240);
    expect(c.color).toMatch(/bian/);
    expect(c.matchedProductId).toBe('p1');
    expect(c.confidence).toBeGreaterThan(0.3);
  });

  it('extracts explicit trailing quantity after dimensions', () => {
    const r = parseQuoteNoteHeuristic(
      'zanzariera laterale bianca 120x240 quantità 2',
      CATALOG
    );
    expect(r.candidates).toHaveLength(1);
    const c = r.candidates[0]!;
    expect(c.quantity).toBe(2);
    expect(c.widthCm).toBe(120);
    expect(c.heightCm).toBe(240);
    expect(c.matchedProductId).toBe('p1');
  });

  it('extracts K5000 80x120 colore bianco', () => {
    const r = parseQuoteNoteHeuristic(
      'Sostituzione serramento K5000 PVC tripla guarnizione 80x120 colore bianco.',
      CATALOG
    );
    expect(r.candidates).toHaveLength(1);
    const c = r.candidates[0]!;
    expect(c.matchedProductId).toBe('p2');
    expect(c.widthCm).toBe(80);
    expect(c.heightCm).toBe(120);
    expect(c.material).toBe('pvc');
  });

  it('extracts Zeus + posa option', () => {
    const r = parseQuoteNoteHeuristic(
      'Porta blindata 1 anta classe 3 modello Zeus con posa.',
      CATALOG
    );
    expect(r.candidates).toHaveLength(1);
    const c = r.candidates[0]!;
    expect(c.matchedProductId).toBe('p3');
    expect(c.selectedOptionNames).toContain('Posa');
  });

  it('handles "Due tapparelle alluminio 14x55 misura 100x220" choosing measurement', () => {
    const r = parseQuoteNoteHeuristic(
      'Due tapparelle alluminio 14x55 misura 100x220.',
      CATALOG
    );
    expect(r.candidates).toHaveLength(1);
    const c = r.candidates[0]!;
    expect(c.quantity).toBe(2);
    expect(c.matchedProductId).toBe('p4');
    expect(c.widthCm).toBe(100);
    expect(c.heightCm).toBe(220);
  });

  it('extracts Metropolitan scorrevole', () => {
    const r = parseQuoteNoteHeuristic(
      'Porta interna linea Metropolitan scorrevole interno muro con inserti vetro.',
      CATALOG
    );
    const c = r.candidates[0]!;
    expect(c.matchedProductId).toBe('p7');
    expect(c.variant).toMatch(/scorrevol|intern/);
  });

  it('extracts Persiana Vogue 90x130', () => {
    const r = parseQuoteNoteHeuristic(
      'Persiana Vogue in alluminio misura 90x130.',
      CATALOG
    );
    const c = r.candidates[0]!;
    expect(c.matchedProductId).toBe('p5');
    expect(c.widthCm).toBe(90);
    expect(c.heightCm).toBe(130);
    expect(c.material).toBe('alluminio');
  });

  it('extracts Coveral 100x140 with trasporto and posa', () => {
    const r = parseQuoteNoteHeuristic(
      'Finestra Coveral PVC-alluminio 100x140 più trasporto e posa.',
      CATALOG
    );
    const c = r.candidates[0]!;
    expect(c.matchedProductId).toBe('p6');
    expect(c.widthCm).toBe(100);
    expect(c.heightCm).toBe(140);
    expect(c.selectedOptionNames).toEqual(expect.arrayContaining(['Trasporto', 'Posa']));
  });

  it('splits multi-product notes', () => {
    const r = parseQuoteNoteHeuristic(
      '3 zanzariere laterali bianche 120x240, una finestra K5000 80x120, una porta blindata Zeus con posa.',
      CATALOG
    );
    expect(r.candidates.length).toBeGreaterThanOrEqual(3);
    const ids = r.candidates.map((c) => c.matchedProductId);
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p2', 'p3']));
  });

  it('warns when no product can be identified', () => {
    const r = parseQuoteNoteHeuristic('Nessun prodotto identificabile qui.', CATALOG);
    expect(r.candidates).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('handles empty input gracefully', () => {
    const r = parseQuoteNoteHeuristic('', CATALOG);
    expect(r.candidates).toHaveLength(0);
    expect(r.warnings).toContain('Nota vuota.');
  });
});
