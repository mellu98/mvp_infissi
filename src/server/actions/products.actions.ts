'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  productCreateSchema,
  productOptionSchema,
  productUpdateSchema,
} from '@/lib/validation/product';
import { requireSession } from '@/lib/auth';
import {
  addProductOption,
  createProduct,
  deleteProduct,
  deleteProductOption,
  updateProduct,
} from '@/server/services/products.service';

export interface ProductActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function actorFromSession(session: Awaited<ReturnType<typeof requireSession>>) {
  return { id: session.user.id, email: session.user.email ?? '' };
}

export async function createProductAction(
  _prev: ProductActionResult | null,
  formData: FormData
): Promise<ProductActionResult> {
  const session = await requireSession();
  const parsed = productCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return zodToResult(parsed.error);
  const product = await createProduct(session.user.companyId, parsed.data, actorFromSession(session));
  revalidatePath('/products');
  redirect(`/products/${product.id}`);
}

export async function updateProductAction(id: string, formData: FormData): Promise<ProductActionResult> {
  const session = await requireSession();
  const parsed = productUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return zodToResult(parsed.error);
  await updateProduct(session.user.companyId, id, parsed.data, actorFromSession(session));
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProductAction(id: string): Promise<void> {
  const session = await requireSession();
  await deleteProduct(session.user.companyId, id, actorFromSession(session));
  revalidatePath('/products');
  redirect('/products');
}

export async function addOptionAction(
  productId: string,
  _prev: ProductActionResult | null,
  formData: FormData
): Promise<ProductActionResult> {
  const session = await requireSession();
  const parsed = productOptionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return zodToResult(parsed.error);
  await addProductOption(session.user.companyId, productId, parsed.data, actorFromSession(session));
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function deleteOptionAction(productId: string, optionId: string): Promise<void> {
  const session = await requireSession();
  await deleteProductOption(session.user.companyId, optionId, actorFromSession(session));
  revalidatePath(`/products/${productId}`);
}

function zodToResult(err: import('zod').ZodError): ProductActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    fieldErrors[issue.path[0]?.toString() ?? '_form'] = issue.message;
  }
  return { ok: false, error: 'Dati non validi.', fieldErrors };
}
