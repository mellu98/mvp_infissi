'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createQuoteAction,
  type QuoteActionResult,
} from '@/server/actions/quotes.actions';

export interface QuoteCustomerOption {
  id: string;
  label: string;
}

interface Props {
  customers: QuoteCustomerOption[];
  defaultCustomerId?: string;
  defaultValidityDays: number;
  defaultVatRate: number;
}

const initialState: QuoteActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creo preventivo…' : 'Crea preventivo'}
    </Button>
  );
}

export function QuoteCreateForm({
  customers,
  defaultCustomerId,
  defaultValidityDays,
  defaultVatRate,
}: Props) {
  const [state, action] = useFormState(createQuoteAction, initialState);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dati preventivo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerId">Cliente</Label>
            <Select
              id="customerId"
              name="customerId"
              defaultValue={defaultCustomerId ?? customers[0]?.id ?? ''}
              required
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </Select>
            {state.fieldErrors?.customerId && (
              <p className="text-sm text-destructive">{state.fieldErrors.customerId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntilDays">Validità (giorni)</Label>
            <Input
              id="validUntilDays"
              name="validUntilDays"
              type="number"
              min={1}
              max={365}
              defaultValue={defaultValidityDays}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatRate">IVA (%)</Label>
            <Input
              id="vatRate"
              name="vatRate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaultVatRate}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Note cliente</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="internalNotes">Note interne</Label>
            <Textarea id="internalNotes" name="internalNotes" rows={3} />
          </div>

          {state.error && (
            <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
