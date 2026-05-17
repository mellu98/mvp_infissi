'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { pricelistMetaSchema, candidateRowUpdateSchema } from '@/lib/validation/pricelist';
import {
  importApprovedCandidatesToCatalog,
  rejectPricelist,
  setCandidateApproved,
  updateCandidate,
  uploadAndIngestPricelist,
} from '@/server/services/pricelists.service';

export interface PricelistActionResult {
  ok: boolean;
  error?: string;
  warnings?: string[];
  pricelistId?: string;
  candidates?: number;
}

function actor(session: Awaited<ReturnType<typeof requireSession>>) {
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    companyId: session.user.companyId,
  };
}

export async function uploadPricelistAction(
  _prev: PricelistActionResult | null,
  formData: FormData
): Promise<PricelistActionResult> {
  const session = await requireSession();
  const meta = pricelistMetaSchema.safeParse({
    name: formData.get('name'),
    supplier: formData.get('supplier'),
    category: formData.get('category'),
    notes: formData.get('notes'),
  });
  if (!meta.success) {
    return { ok: false, error: meta.error.issues[0]?.message ?? 'Dati listino non validi.' };
  }
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'File mancante.' };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await uploadAndIngestPricelist({
      meta: meta.data,
      file: {
        buffer,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      },
      actor: actor(session),
    });
    revalidatePath('/pricelists');
    revalidatePath('/dashboard');
    redirect(`/pricelists/${result.pricelistId}/review`);
  } catch (err) {
    if ((err as Error)?.message?.includes('NEXT_REDIRECT')) throw err;
    return { ok: false, error: (err as Error).message };
  }
}

export async function toggleCandidateAction(
  pricelistId: string,
  candidateId: string,
  approved: boolean
): Promise<void> {
  const session = await requireSession();
  await setCandidateApproved(session.user.companyId, candidateId, approved);
  revalidatePath(`/pricelists/${pricelistId}/review`);
}

export async function updateCandidateAction(
  pricelistId: string,
  candidateId: string,
  formData: FormData
): Promise<void> {
  const session = await requireSession();
  const parsed = candidateRowUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dati non validi.');
  }
  await updateCandidate(session.user.companyId, candidateId, parsed.data);
  revalidatePath(`/pricelists/${pricelistId}/review`);
}

export async function approvePricelistAction(pricelistId: string): Promise<void> {
  const session = await requireSession();
  await importApprovedCandidatesToCatalog(session.user.companyId, pricelistId, {
    id: session.user.id,
    email: session.user.email ?? '',
  });
  revalidatePath('/pricelists');
  revalidatePath('/products');
  redirect(`/pricelists/${pricelistId}`);
}

export async function rejectPricelistAction(pricelistId: string): Promise<void> {
  const session = await requireSession();
  await rejectPricelist(session.user.companyId, pricelistId, {
    id: session.user.id,
    email: session.user.email ?? '',
  });
  revalidatePath('/pricelists');
  redirect('/pricelists');
}
