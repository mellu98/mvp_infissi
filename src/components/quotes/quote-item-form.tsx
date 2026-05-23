'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  addQuoteItemAction,
  type QuoteActionResult,
} from '@/server/actions/quotes.actions';
import {
  OPTION_PRICE_TYPE_LABELS,
} from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';


export interface QuoteProductOption {
  id: string;
  sku: string;
  name: string;
  pricingFormula: string;
  unit: string;
  basePrice: number;
  pricePerSquareMeter: number | null;
  pricePerLinearMeter: number | null;
  minBillableQuantity: number | null;
  defaultWidthCm: number | null;
  defaultHeightCm: number | null;
  defaultLengthCm: number | null;
  demoPrice: boolean;
  options: Array<{
    id: string;
    name: string;
    price: number;
    priceType: string;
  }>;
}

interface Props {
  quoteId: string;
  products: QuoteProductOption[];
}

const initialState: QuoteActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Aggiungo…' : 'Aggiungi riga'}
    </Button>
  );
}

export function QuoteItemForm({ quoteId, products }: Props) {
  const boundAction = addQuoteItemAction.bind(null, quoteId);
  const [state, action] = useFormState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [productId, setProductId] = useState(products[0]?.id ?? '');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [productId, products]
  );

  const [description, setDescription] = useState(selectedProduct?.name ?? '');

  useEffect(() => {
    setDescription(selectedProduct?.name ?? '');
  }, [selectedProduct?.id, selectedProduct?.name]);

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    const fallback = products[0];
    setProductId(fallback?.id ?? '');
    setDescription(fallback?.name ?? '');
  }, [state.ok, products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggiungi riga preventivo</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="productId">Prodotto catalogo</Label>
              <Select
                id="productId"
                name="productId"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} — {product.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedProduct && selectedProduct.demoPrice && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:col-span-2">
                <Badge variant="warning">DEMO</Badge>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrizione riga</Label>
              <Input
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
              {state.fieldErrors?.description && (
                <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
              )}
            </div>

            <ControlledNumberField
              id="quantity"
              label="Quantità"
              initialValue={1}
              min="0.01"
            />
            <NumberField id="discountPercentage" label="Sconto riga (%)" defaultValue="0" min="0" max="100" />
            <NumberField id="installationPrice" label="Manodopera (€)" min="0" />
          </div>

          {selectedProduct?.options.length ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="text-sm font-medium">Optional</h3>
                <p className="text-xs text-muted-foreground">
                  Gli optional sono calcolati dal motore prezzi, non dal browser.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedProduct.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-2 rounded-md border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="selectedOptionIds"
                      value={option.id}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="font-medium">{option.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {option.priceType === 'PERCENTAGE'
                          ? `${option.price}%`
                          : formatCurrency(option.price)}{' '}
                        · {OPTION_PRICE_TYPE_LABELS[option.priceType]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Note riga</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Il prezzo finale viene calcolato lato server dal motore deterministico. Qui NON
            stiamo &ldquo;facendo conti a occhio&rdquo;: il browser raccoglie dati, il dominio calcola.
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}



function ControlledNumberField({
  id,
  label,
  initialValue,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  initialValue?: number | null;
  value?: string;
  onChange?: (next: string) => void;
  min?: string;
  max?: string;
}) {
  const isExternallyControlled = value !== undefined && onChange !== undefined;
  const [internal, setInternal] = useState(
    initialValue != null ? String(initialValue) : ''
  );
  const currentValue = isExternallyControlled ? (value as string) : internal;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={min}
        max={max}
        value={currentValue}
        onChange={(e) =>
          isExternallyControlled ? onChange!(e.target.value) : setInternal(e.target.value)
        }
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  defaultValue,
  min,
  max,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={min}
        max={max}
        defaultValue={defaultValue}
      />
    </div>
  );
}


