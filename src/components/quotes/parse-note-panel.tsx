'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ParseResult {
  originalText: string;
  warnings: string[];
  candidates: Array<{
    segment: string;
    productName: string;
    matchedProductId?: string;
    matchedProductSku?: string;
    quantity: number;
    widthCm: number | null;
    heightCm: number | null;
    lengthCm: number | null;
    color: string | null;
    material: string | null;
    variant: string | null;
    selectedOptionNames: string[];
    confidence: number;
    missingFields: string[];
    rawHints: string[];
  }>;
}

export function ParseNotePanel() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function parse() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await fetch('/api/quotes/parse-note', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Impossibile interpretare la nota.');
        return;
      }
      setResult(payload);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Parser nota libera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quote-note-parser">Appunti sopralluogo</Label>
          <Textarea
            id="quote-note-parser"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder="Esempio: zanzariera laterale bianca 120x240, quantità 2…"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Suggerisce righe candidate. NON crea righe da solo: serve conferma manuale.
          </p>
          <Button type="button" onClick={parse} disabled={isPending || text.trim().length === 0}>
            {isPending ? 'Analizzo…' : 'Analizza nota'}
          </Button>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-3">
            {result.warnings.map((warning) => (
              <p key={warning} className="text-sm text-amber-700">
                {warning}
              </p>
            ))}
            {result.candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna riga candidata trovata.</p>
            ) : (
              result.candidates.map((candidate, index) => (
                <div key={`${candidate.segment}-${index}`} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{candidate.productName}</strong>
                    {candidate.matchedProductSku && (
                      <Badge variant="secondary">{candidate.matchedProductSku}</Badge>
                    )}
                    <Badge variant={candidate.confidence >= 0.6 ? 'info' : 'warning'}>
                      conf. {Math.round(candidate.confidence * 100)}%
                    </Badge>
                  </div>
                  <dl className="mt-2 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                    <div>Quantità: {candidate.quantity}</div>
                    <div>
                      Misure:{' '}
                      {[candidate.widthCm, candidate.heightCm, candidate.lengthCm]
                        .filter((v) => v != null)
                        .join(' × ') || 'mancanti'}
                    </div>
                    <div>Colore: {candidate.color ?? '—'}</div>
                    <div>Materiale: {candidate.material ?? '—'}</div>
                  </dl>
                  {candidate.missingFields.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      Da completare: {candidate.missingFields.join(', ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
