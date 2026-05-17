'use server';

import type { QuoteStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import {
  parseNoteSchema,
  quoteCreateSchema,
  quoteItemSchema,
  quoteStatusUpdateSchema,
} from '@/lib/validation/quote';
import {
  addQuoteItem,
  createQuote,
  deleteQuote,
  deleteQuoteItem,
  duplicateQuote,
  updateQuoteStatus,
} from '@/server/services/quotes.service';

export interface QuoteActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function actorFromSession(session: Awaited<ReturnType<typeof requireSession>>) {
  return { id: session.user.id, email: session.user.email ?? '' };
}

export async function createQuoteAction(
  _prev: QuoteActionResult | null,
  formData: FormData
): Promise<QuoteActionResult> {
  const session = await requireSession();
  const parsed = quoteCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return zodToResult(parsed.error);

  try {
    const quote = await createQuote(
      session.user.companyId,
      parsed.data,
      actorFromSession(session)
    );
    revalidatePath('/quotes');
    revalidatePath('/dashboard');
    redirect(`/quotes/${quote.id}`);
  } catch (err) {
    if ((err as Error)?.message?.includes('NEXT_REDIRECT')) throw err;
    return { ok: false, error: (err as Error).message };
  }
}

export async function addQuoteItemAction(
  quoteId: string,
  _prev: QuoteActionResult | null,
  formData: FormData
): Promise<QuoteActionResult> {
  const session = await requireSession();
  const parsed = quoteItemSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    selectedOptionIds: formData.getAll('selectedOptionIds').map(String),
  });
  if (!parsed.success) return zodToResult(parsed.error);

  try {
    await addQuoteItem(
      session.user.companyId,
      quoteId,
      parsed.data,
      actorFromSession(session)
    );
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath('/quotes');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteQuoteItemAction(quoteId: string, itemId: string): Promise<void> {
  const session = await requireSession();
  await deleteQuoteItem(session.user.companyId, quoteId, itemId, actorFromSession(session));
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath('/quotes');
  revalidatePath('/dashboard');
}

export async function updateQuoteStatusAction(
  quoteId: string,
  formData: FormData
): Promise<void> {
  const session = await requireSession();
  const parsed = quoteStatusUpdateSchema.safeParse({ status: formData.get('status') });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Stato preventivo non valido.');
  }

  await updateQuoteStatus(
    session.user.companyId,
    quoteId,
    parsed.data.status as QuoteStatus,
    actorFromSession(session)
  );
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath('/quotes');
  revalidatePath('/dashboard');
}

export async function deleteQuoteAction(quoteId: string): Promise<void> {
  const session = await requireSession();
  await deleteQuote(session.user.companyId, quoteId, actorFromSession(session));
  revalidatePath('/quotes');
  revalidatePath('/dashboard');
  redirect('/quotes');
}

export async function duplicateQuoteAction(quoteId: string): Promise<void> {
  const session = await requireSession();
  const quote = await duplicateQuote(session.user.companyId, quoteId, actorFromSession(session));
  revalidatePath('/quotes');
  revalidatePath('/dashboard');
  redirect(`/quotes/${quote.id}`);
}

export async function validateParseNoteActionText(text: unknown): Promise<QuoteActionResult> {
  const parsed = parseNoteSchema.safeParse({ text });
  if (!parsed.success) return zodToResult(parsed.error);
  return { ok: true };
}

function zodToResult(err: import('zod').ZodError): QuoteActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    fieldErrors[issue.path[0]?.toString() ?? '_form'] = issue.message;
  }
  return { ok: false, error: 'Dati non validi.', fieldErrors };
}
