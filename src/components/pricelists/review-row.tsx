'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  toggleCandidateAction,
  updateCandidateAction,
} from '@/server/actions/pricelists.actions';
import {
  PRICING_FORMULA_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '@/lib/categories';

interface RowProps {
  pricelistId: string;
  candidate: {
    id: string;
    productName: string | null;
    sku: string | null;
    category: string;
    basePrice: number | null;
    pricePerLinearMeter: number | null;
    pricingFormula: string;
    confidence: number;
    approved: boolean;
    validationErrors: unknown;
  };
}

export function ReviewRow({ pricelistId, candidate }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const errors = Array.isArray(candidate.validationErrors)
    ? (candidate.validationErrors as string[])
    : [];

  function toggleApprove(approved: boolean) {
    startTransition(async () => {
      await toggleCandidateAction(pricelistId, candidate.id, approved);
    });
  }

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateCandidateAction(pricelistId, candidate.id, formData);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={8}>
          <form action={handleSave} className="grid gap-2 md:grid-cols-6">
            <Input name="productName" defaultValue={candidate.productName ?? ''} placeholder="Nome prodotto" required />
            <Input name="sku" defaultValue={candidate.sku ?? ''} placeholder="SKU" />
            <Select name="category" defaultValue={candidate.category}>
              {PRODUCT_CATEGORIES.map((k) => <option key={k} value={k}>{PRODUCT_CATEGORY_LABELS[k]}</option>)}
            </Select>
            <Select name="pricingFormula" defaultValue={candidate.pricingFormula}>
              {Object.entries(PRICING_FORMULA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input name="basePrice" type="number" step="0.01" defaultValue={candidate.basePrice ?? ''} placeholder="Base €" />
            <div className="flex gap-2 md:col-span-6">
              <Button type="submit" size="sm" disabled={pending}>Salva</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Annulla</Button>
            </div>
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          checked={candidate.approved}
          onChange={(e) => toggleApprove(e.target.checked)}
          disabled={pending}
        />
      </TableCell>
      <TableCell className="font-medium">
        {candidate.productName ?? <span className="italic text-muted-foreground">(senza nome)</span>}
      </TableCell>
      <TableCell className="font-mono text-xs">{candidate.sku ?? '—'}</TableCell>
      <TableCell className="text-sm">{PRODUCT_CATEGORY_LABELS[candidate.category] ?? candidate.category}</TableCell>
      <TableCell className="text-sm">{PRICING_FORMULA_LABELS[candidate.pricingFormula]}</TableCell>
      <TableCell className="text-sm">
        {candidate.basePrice != null ? `${candidate.basePrice.toFixed(2)} €` : '—'}
      </TableCell>
      <TableCell>
        <ConfidenceBadge value={candidate.confidence} />
        {errors.length > 0 && <div className="mt-1 text-xs text-amber-700">⚠ {errors.join(', ')}</div>}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Modifica</Button>
      </TableCell>
    </TableRow>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  if (value >= 0.7) return <Badge variant="success">Alta</Badge>;
  if (value >= 0.4) return <Badge variant="warning">Media</Badge>;
  return <Badge variant="destructive">Bassa</Badge>;
}
