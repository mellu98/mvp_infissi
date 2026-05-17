'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { addOptionAction, type ProductActionResult } from '@/server/actions/products.actions';
import { OPTION_PRICE_TYPE_LABELS } from '@/lib/categories';

interface Props { productId: string }

const initial: ProductActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? 'Aggiungo…' : 'Aggiungi optional'}</Button>;
}

export function OptionForm({ productId }: Props) {
  const boundAction = addOptionAction.bind(null, productId);
  const [state, action] = useFormState(boundAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state]);
  return (
    <form action={action} ref={formRef} className="grid gap-3 md:grid-cols-5">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="name">Nome optional</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Prezzo</Label>
        <Input id="price" name="price" type="number" step="0.01" defaultValue="0" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="priceType">Tipo prezzo</Label>
        <Select id="priceType" name="priceType" defaultValue="FIXED">
          {Object.entries(OPTION_PRICE_TYPE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </Select>
      </div>
      <div className="flex items-end">
        <SubmitButton />
      </div>
      {state.error && <p className="text-sm text-destructive md:col-span-5">{state.error}</p>}
    </form>
  );
}
