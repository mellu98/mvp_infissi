'use server';

import { revalidatePath } from 'next/cache';
import { companySettingsSchema } from '@/lib/validation/settings';
import { requireRole } from '@/lib/auth';
import { updateCompanySettings } from '@/server/services/settings.service';

export interface SettingsActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateSettingsAction(
  _prev: SettingsActionResult | null,
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await requireRole(['ADMIN']);
  const parsed = companySettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0]?.toString() ?? '_form'] = issue.message;
    }
    return { ok: false, error: 'Dati non validi.', fieldErrors };
  }
  await updateCompanySettings(session.user.companyId, parsed.data, {
    id: session.user.id,
    email: session.user.email ?? '',
  });
  revalidatePath('/settings');
  return { ok: true };
}
