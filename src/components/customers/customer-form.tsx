'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Customer } from '@prisma/client';

interface CustomerFormProps {
  initial?: Customer;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvataggio…' : label}
    </Button>
  );
}

export function CustomerForm({ initial, action, submitLabel = 'Salva cliente' }: CustomerFormProps) {
  const [type, setType] = useState<'PRIVATE' | 'BUSINESS'>(initial?.type ?? 'PRIVATE');
  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo cliente</Label>
            <Select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'PRIVATE' | 'BUSINESS')}
            >
              <option value="PRIVATE">Privato</option>
              <option value="BUSINESS">Azienda</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadStatus">Stato lead</Label>
            <Select id="leadStatus" name="leadStatus" defaultValue={initial?.leadStatus ?? 'NEW'}>
              <option value="NEW">Nuovo</option>
              <option value="CONTACTED">Contattato</option>
              <option value="SURVEY">Sopralluogo</option>
              <option value="QUOTE_SENT">Preventivo inviato</option>
              <option value="ACCEPTED">Accettato</option>
              <option value="LOST">Perso</option>
            </Select>
          </div>

          {type === 'BUSINESS' ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyName">Ragione sociale</Label>
              <Input id="companyName" name="companyName" defaultValue={initial?.companyName ?? ''} required />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" name="firstName" defaultValue={initial?.firstName ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input id="lastName" name="lastName" defaultValue={initial?.lastName ?? ''} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="taxCode">Codice fiscale</Label>
            <Input id="taxCode" name="taxCode" defaultValue={initial?.taxCode ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatNumber">Partita IVA</Label>
            <Input id="vatNumber" name="vatNumber" defaultValue={initial?.vatNumber ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indirizzo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" defaultValue={initial?.address ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Città</Label>
            <Input id="city" name="city" defaultValue={initial?.city ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Provincia</Label>
            <Input id="province" name="province" defaultValue={initial?.province ?? ''} maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">CAP</Label>
            <Input id="postalCode" name="postalCode" defaultValue={initial?.postalCode ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" rows={4} defaultValue={initial?.notes ?? ''} placeholder="Note generali sul cliente…" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
