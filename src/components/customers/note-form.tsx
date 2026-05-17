'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  addCustomerNoteAction,
  type ActionResult,
} from '@/server/actions/customers.actions';

interface NoteFormProps {
  customerId: string;
}

const initial: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? 'Aggiungo…' : 'Aggiungi nota'}
    </Button>
  );
}

export function NoteForm({ customerId }: NoteFormProps) {
  const boundAction = addCustomerNoteAction.bind(null, customerId);
  const [state, action] = useFormState(boundAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={formRef} className="space-y-2">
      <Textarea name="content" placeholder="Appunti da sopralluogo, telefonata, decisione cliente…" rows={3} required />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end"><SubmitButton /></div>
    </form>
  );
}
