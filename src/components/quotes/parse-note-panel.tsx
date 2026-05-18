'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, PlusCircle, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CandidatePrefill } from './quote-item-section';

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

interface Props {
  onUseCandidate?: (candidate: CandidatePrefill) => void;
}

export function ParseNotePanel({ onUseCandidate }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedIndexes, setUsedIndexes] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  function parse() {
    setError(null);
    setResult(null);
    setUsedIndexes(new Set());
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

  function applyCandidate(candidate: ParseResult['candidates'][number], index: number) {
    onUseCandidate?.({
      matchedProductId: candidate.matchedProductId,
      productName: candidate.productName,
      quantity: candidate.quantity,
      widthCm: candidate.widthCm,
      heightCm: candidate.heightCm,
    });
    setUsedIndexes((prev) => new Set([...prev, index]));
    // Scroll to the item form
    document.getElementById('quote-item-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            placeholder="Es: zanzariera laterale bianca 120x240 qta 2, K5000 80x120 con anta ribalta…"
            maxLength={2000}
          />
          <p className="text-right text-xs text-muted-foreground">{text.length}/2000</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Suggerisce righe candidate. Clicca &ldquo;Usa questa riga&rdquo; per pre-compilare il form.
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
                ⚠ {warning}
              </p>
            ))}

            {result.candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna riga candidata trovata.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {result.candidates.length} riga/e — clicca &ldquo;Usa questa riga&rdquo; per pre-compilare il form:
                </p>
                {result.candidates.map((candidate, index) => {
                  const used = usedIndexes.has(index);
                  return (
                    <div
                      key={`${candidate.segment}-${index}`}
                      className={`rounded-lg border p-3 transition-colors ${used ? 'border-green-200 bg-green-50' : ''}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm">{candidate.productName}</strong>
                          {candidate.matchedProductSku && (
                            <Badge variant="secondary" className="text-xs">
                              {candidate.matchedProductSku}
                            </Badge>
                          )}
                          <Badge
                            variant={candidate.confidence >= 0.6 ? 'info' : 'warning'}
                            className="text-xs"
                          >
                            conf. {Math.round(candidate.confidence * 100)}%
                          </Badge>
                          {!candidate.matchedProductId && (
                            <Badge variant="outline" className="text-xs text-amber-700">
                              prodotto non abbinato
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={used ? 'secondary' : 'default'}
                          onClick={() => applyCandidate(candidate, index)}
                        >
                          <PlusCircle className="mr-1 h-3.5 w-3.5" />
                          {used ? 'Aggiunto ✓' : 'Usa questa riga'}
                        </Button>
                      </div>

                      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                        <div>Quantità: <strong>{candidate.quantity}</strong></div>
                        <div>
                          Misure:{' '}
                          <strong>
                            {candidate.widthCm && candidate.heightCm
                              ? `${candidate.widthCm} × ${candidate.heightCm} cm`
                              : 'da inserire'}
                          </strong>
                        </div>
                        {candidate.color && <div>Colore: <strong>{candidate.color}</strong></div>}
                        {candidate.material && <div>Materiale: <strong>{candidate.material}</strong></div>}
                        {candidate.selectedOptionNames.length > 0 && (
                          <div className="md:col-span-2">
                            Servizi rilevati: <strong>{candidate.selectedOptionNames.join(', ')}</strong>
                          </div>
                        )}
                      </dl>

                      {candidate.missingFields.length > 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                          Da completare nel form: {candidate.missingFields.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
