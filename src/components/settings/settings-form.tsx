'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateSettingsAction, type SettingsActionResult } from '@/server/actions/settings.actions';
import type { CompanySettings } from '@prisma/client';

interface Props {
  initial: CompanySettings | null;
}

const initial: SettingsActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvataggio…' : 'Salva impostazioni'}
    </Button>
  );
}

export function SettingsForm({ initial: data }: Props) {
  const [state, action] = useFormState(updateSettingsAction, initial);
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ragione sociale" name="legalName" defaultValue={data?.legalName} required error={state?.fieldErrors?.legalName} />
        <Field label="Partita IVA" name="vatNumber" defaultValue={data?.vatNumber} required error={state?.fieldErrors?.vatNumber} />
        <Field label="Codice fiscale" name="taxCode" defaultValue={data?.taxCode} required error={state?.fieldErrors?.taxCode} />
        <Field label="Email" name="email" type="email" defaultValue={data?.email} required error={state?.fieldErrors?.email} />
        <Field label="Telefono / WhatsApp" name="phone" defaultValue={data?.phone} required error={state?.fieldErrors?.phone} />
        <Field label="Sito web" name="website" defaultValue={data?.website ?? ''} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Indirizzo" name="address" defaultValue={data?.address} required className="md:col-span-2" />
        <Field label="Città" name="city" defaultValue={data?.city} required />
        <Field label="Provincia" name="province" defaultValue={data?.province} required />
        <Field label="CAP" name="postalCode" defaultValue={data?.postalCode} required />
        <Field label="Stato" name="country" defaultValue={data?.country ?? 'Italia'} required />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="IVA default (%)" name="defaultVatRate" type="number" step="0.01" defaultValue={data?.defaultVatRate ?? 22} />
        <Field label="Valuta" name="currency" defaultValue={data?.currency ?? 'EUR'} />
        <Field label="Validità preventivo (giorni)" name="quoteValidityDays" type="number" defaultValue={data?.quoteValidityDays ?? 30} />
        <Field label="Prefisso numero preventivo" name="quoteNumberPrefix" defaultValue={data?.quoteNumberPrefix ?? ''} className="md:col-span-3" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quoteTerms">Condizioni standard preventivo</Label>
        <Textarea id="quoteTerms" name="quoteTerms" rows={5} defaultValue={data?.quoteTerms ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractTerms">Condizioni standard contratto</Label>
        <Textarea id="contractTerms" name="contractTerms" rows={5} defaultValue={data?.contractTerms ?? ''} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Impostazioni salvate.</p>}

      <div className="flex justify-end"><SubmitButton /></div>
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Field({ label, error, name, className, ...rest }: FieldProps) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...rest} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
