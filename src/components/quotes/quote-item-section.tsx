'use client';

import { useState } from 'react';
import { QuoteItemForm, type QuoteProductOption } from './quote-item-form';
import { ParseNotePanel } from './parse-note-panel';

// Re-export so consuming pages only import from this file
export type { QuoteProductOption } from './quote-item-form';

export interface CandidatePrefill {
  matchedProductId?: string;
  productName: string;
  quantity: number;
  widthCm: number | null;
  heightCm: number | null;
}

interface Props {
  quoteId: string;
  products: QuoteProductOption[];
}

/**
 * Client wrapper that lifts state between the note parser and the item form.
 * When the user clicks "Usa questa riga" on a parsed candidate, the form
 * is pre-filled with the extracted product, quantity, and dimensions.
 */
const SHOW_NOTE_PARSER = false;

export function QuoteItemSection({ quoteId, products }: Props) {
  const [prefill, setPrefill] = useState<CandidatePrefill | undefined>(undefined);
  const [prefillKey, setPrefillKey] = useState(0);

  function handleUseCandidate(candidate: CandidatePrefill) {
    setPrefill(candidate);
    setPrefillKey((k) => k + 1);
    document.getElementById('quote-item-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={SHOW_NOTE_PARSER ? "grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]" : "grid gap-6"}>
      <div id="quote-item-form">
        <QuoteItemForm
          key={prefillKey}
          quoteId={quoteId}
          products={products}
        />
      </div>
      {SHOW_NOTE_PARSER && <ParseNotePanel onUseCandidate={handleUseCandidate} />}
    </div>
  );
}
