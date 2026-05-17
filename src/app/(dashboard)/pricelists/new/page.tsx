'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  uploadPricelistAction,
  type PricelistActionResult,
} from '@/server/actions/pricelists.actions';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/categories';

const initial: PricelistActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Carico ed estraggo…' : 'Carica ed estrai'}</Button>;
}

export default function NewPricelistPage() {
  const [state, action] = useFormState(uploadPricelistAction, initial);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pricelists"><ChevronLeft className="mr-1 h-4 w-4" /> Listini</Link>
        </Button>
        <h1 className="text-2xl font-bold">Carica un listino</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli listino</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4" encType="multipart/form-data">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome listino</Label>
                <Input id="name" name="name" required placeholder="Es. Listino zanzariere 2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornitore</Label>
                <Input id="supplier" name="supplier" placeholder="Es. Mosquito SRL" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="category">Categoria principale</Label>
                <Select id="category" name="category" defaultValue="OTHER">
                  {PRODUCT_CATEGORIES.map((k) => (
                    <option key={k} value={k}>{PRODUCT_CATEGORY_LABELS[k]}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file">File listino</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  required
                  accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,.png,.jpg,.jpeg"
                />
                <p className="text-xs text-muted-foreground">
                  Formati supportati: CSV, Excel, PDF testuale, Word. Immagini accettate ma OCR non implementato — verranno caricate per archivio.
                </p>
              </div>
            </div>

            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex justify-end">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
