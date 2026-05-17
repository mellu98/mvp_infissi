import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import type { CompanySettingsInput } from '@/lib/validation/settings';

export async function getCompanySettings(companyId: string) {
  return prisma.companySettings.findUnique({ where: { companyId } });
}

export async function updateCompanySettings(
  companyId: string,
  data: CompanySettingsInput,
  actor: { id: string; email: string }
) {
  const existing = await prisma.companySettings.findUnique({ where: { companyId } });
  const settings = existing
    ? await prisma.companySettings.update({
        where: { companyId },
        data: {
          legalName: data.legalName,
          vatNumber: data.vatNumber,
          taxCode: data.taxCode,
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country,
          email: data.email,
          phone: data.phone,
          website: data.website ?? null,
          defaultVatRate: data.defaultVatRate,
          currency: data.currency,
          quoteValidityDays: data.quoteValidityDays,
          quoteNumberPrefix: data.quoteNumberPrefix ?? '',
          quoteTerms: data.quoteTerms ?? '',
          contractTerms: data.contractTerms ?? '',
        },
      })
    : await prisma.companySettings.create({
        data: {
          companyId,
          legalName: data.legalName,
          vatNumber: data.vatNumber,
          taxCode: data.taxCode,
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country,
          email: data.email,
          phone: data.phone,
          website: data.website ?? null,
          defaultVatRate: data.defaultVatRate,
          currency: data.currency,
          quoteValidityDays: data.quoteValidityDays,
          quoteNumberPrefix: data.quoteNumberPrefix ?? '',
          quoteTerms: data.quoteTerms ?? '',
          contractTerms: data.contractTerms ?? '',
        },
      });

  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'settings.update',
    entityType: 'CompanySettings',
    entityId: settings.id,
  });
  return settings;
}

/**
 * Reserve the next quote number for the current year. Atomic per-company.
 * Format: `${prefix}${year}-${4-digit progressive}`.
 */
export async function reserveNextQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  if (!settings) throw new Error('Impostazioni azienda non configurate.');

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.companySettings.findUnique({ where: { companyId } });
    if (!fresh) throw new Error('Impostazioni azienda mancanti.');
    let nextValue = 1;
    if (fresh.quoteCounterYear === year) nextValue = fresh.quoteCounterValue + 1;
    await tx.companySettings.update({
      where: { companyId },
      data: { quoteCounterYear: year, quoteCounterValue: nextValue },
    });
    const prefix = fresh.quoteNumberPrefix ?? '';
    return `${prefix}${year}-${String(nextValue).padStart(4, '0')}`;
  });
}
