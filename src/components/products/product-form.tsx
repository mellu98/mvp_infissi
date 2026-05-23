'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@prisma/client';
import {
  PRICING_FORMULA_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '@/lib/categories';

interface ProductFormProps {
  initial?: Product;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : label}</Button>
  );
}

export function ProductForm({ initial, action, submitLabel = 'Salva prodotto' }: ProductFormProps) {
  const [formula, setFormula] = useState(initial?.pricingFormula ?? 'FIXED_PRICE');
  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Identità prodotto</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={initial?.sku ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" name="category" defaultValue={initial?.category ?? 'OTHER'}>
              {PRODUCT_CATEGORIES.map((k) => (
                <option key={k} value={k}>{PRODUCT_CATEGORY_LABELS[k]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={initial?.name ?? ''} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea id="description" name="description" defaultValue={initial?.description ?? ''} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Materiale</Label>
            <Input id="material" name="material" defaultValue={initial?.material ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Colore</Label>
            <Input id="color" name="color" defaultValue={initial?.color ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unità di misura</Label>
            <Input id="unit" name="unit" defaultValue={initial?.unit ?? 'pz'} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier">Fornitore</Label>
            <Input id="supplier" name="supplier" defaultValue={initial?.supplier ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Prezzo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pricingFormula">Formula prezzo</Label>
            <Select id="pricingFormula" name="pricingFormula" value={formula} onChange={(e) => setFormula(e.target.value as Product['pricingFormula'])}>
              {Object.entries(PRICING_FORMULA_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="basePrice">Prezzo base (€)</Label>
            <Input id="basePrice" name="basePrice" type="number" step="0.01" defaultValue={initial?.basePrice ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerLinearMeter">Prezzo al metro lineare (€)</Label>
            <Input id="pricePerLinearMeter" name="pricePerLinearMeter" type="number" step="0.01" defaultValue={initial?.pricePerLinearMeter ?? ''} />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4" />
              Attivo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="demoPrice" defaultChecked={initial?.demoPrice ?? false} className="h-4 w-4" />
              Prezzo demo (non reale)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dimensioni standard (opzionali)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Se compilate, vengono pre-impostate quando il prodotto viene aggiunto a un preventivo.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="defaultWidthCm">Larghezza (cm)</Label>
            <Input id="defaultWidthCm" name="defaultWidthCm" type="number" step="0.1" defaultValue={initial?.defaultWidthCm ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultHeightCm">Altezza (cm)</Label>
            <Input id="defaultHeightCm" name="defaultHeightCm" type="number" step="0.1" defaultValue={initial?.defaultHeightCm ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultLengthCm">Lunghezza (cm)</Label>
            <Input id="defaultLengthCm" name="defaultLengthCm" type="number" step="0.1" defaultValue={initial?.defaultLengthCm ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Note tecniche</CardTitle></CardHeader>
        <CardContent>
          <Textarea name="technicalNotes" rows={3} defaultValue={initial?.technicalNotes ?? ''} />
        </CardContent>
      </Card>

      <div className="flex justify-end"><SubmitButton label={submitLabel} /></div>
    </form>
  );
}
