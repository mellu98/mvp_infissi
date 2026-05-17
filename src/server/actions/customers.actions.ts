'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  customerCreateSchema,
  customerNoteSchema,
  customerUpdateSchema,
} from '@/lib/validation/customer';
import { requireSession } from '@/lib/auth';
import {
  addCustomerNote,
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from '@/server/services/customers.service';

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  customerId?: string;
}

function actorFromSession(session: Awaited<ReturnType<typeof requireSession>>) {
  return { id: session.user.id, email: session.user.email ?? '' };
}

export async function createCustomerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = customerCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return zodToResult(parsed.error);
  }
  const customer = await createCustomer(session.user.companyId, parsed.data, actorFromSession(session));
  revalidatePath('/customers');
  revalidatePath('/dashboard');
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(id: string, formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = customerUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return zodToResult(parsed.error);
  await updateCustomer(session.user.companyId, id, parsed.data, actorFromSession(session));
  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function addCustomerNoteAction(
  customerId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = customerNoteSchema.safeParse({ content: formData.get('content') });
  if (!parsed.success) return zodToResult(parsed.error);
  await addCustomerNote(session.user.companyId, customerId, parsed.data, actorFromSession(session));
  revalidatePath(`/customers/${customerId}`);
  return { ok: true, customerId };
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  await deleteCustomer(session.user.companyId, id, actorFromSession(session));
  revalidatePath('/customers');
  revalidatePath('/dashboard');
  redirect('/customers');
}

function zodToResult(err: import('zod').ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path[0]?.toString() ?? '_form';
    fieldErrors[path] = issue.message;
  }
  return { ok: false, error: 'Dati non validi.', fieldErrors };
}
