import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { getStorageProvider } from '@/lib/storage';
import { ingestAndNormalize } from '@/lib/ingestion';
import type { CandidateRow } from '@/lib/ai';
import type { PricelistMetaInput } from '@/lib/validation/pricelist';

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = ['csv', 'xlsx', 'xls', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'];

export interface UploadPricelistParams {
  meta: PricelistMetaInput;
  file: { buffer: Buffer; fileName: string; mimeType: string; size: number };
  actor: { id: string; email: string; companyId: string };
}

export async function uploadAndIngestPricelist(p: UploadPricelistParams) {
  if (p.file.size > MAX_FILE_BYTES) {
    throw new Error(`File troppo grande (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`);
  }
  const ext = (p.file.fileName.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Estensione non supportata: ${ext}.`);
  }

  const storage = getStorageProvider();
  const upload = await storage.uploadFile({
    buffer: p.file.buffer,
    fileName: p.file.fileName,
    mimeType: p.file.mimeType,
    prefix: `pricelists/${p.actor.companyId}`,
  });

  const pricelist = await prisma.pricelist.create({
    data: {
      companyId: p.actor.companyId,
      name: p.meta.name,
      supplier: p.meta.supplier ?? null,
      category: p.meta.category,
      fileName: p.file.fileName,
      storageKey: upload.key,
      mimeType: p.file.mimeType,
      fileSize: p.file.size,
      status: 'UPLOADED',
      notes: p.meta.notes ?? null,
    },
  });

  const { candidates, raw } = await ingestAndNormalize({
    buffer: p.file.buffer,
    fileName: p.file.fileName,
    mimeType: p.file.mimeType,
    hints: { category: p.meta.category, supplier: p.meta.supplier ?? undefined },
  });

  const created = await persistCandidates(p.actor.companyId, pricelist.id, candidates);

  await prisma.pricelist.update({
    where: { id: pricelist.id },
    data: {
      status: created > 0 ? 'NEEDS_REVIEW' : 'EXTRACTED',
      notes: raw.warnings.length > 0
        ? `${p.meta.notes ?? ''}\n[Ingestion] ${raw.warnings.join(' / ')}`.trim()
        : p.meta.notes ?? null,
    },
  });

  await logAuditEvent({
    companyId: p.actor.companyId,
    userId: p.actor.id,
    userEmail: p.actor.email,
    action: 'pricelist.upload',
    entityType: 'Pricelist',
    entityId: pricelist.id,
    metadata: { candidates: created, warnings: raw.warnings.length },
  });

  return { pricelistId: pricelist.id, candidates: created, warnings: raw.warnings };
}

async function persistCandidates(
  companyId: string,
  pricelistId: string,
  rows: CandidateRow[]
): Promise<number> {
  if (rows.length === 0) return 0;
  await prisma.pricelistItemCandidate.createMany({
    data: rows.map((r) => ({
      companyId,
      pricelistId,
      productName: r.productName,
      category: r.category as never,
      sku: r.sku,
      description: r.description,
      basePrice: r.basePrice,
      pricePerSquareMeter: r.pricePerSquareMeter,
      pricePerLinearMeter: r.pricePerLinearMeter,
      unit: r.unit,
      minBillableQuantity: r.minBillableQuantity,
      color: r.color,
      material: r.material,
      variant: r.variant,
      pricingFormula: r.pricingFormula,
      confidence: r.confidence,
      rawText: r.rawText,
      validationErrors: r.validationErrors as unknown as object,
      approved: false,
    })),
  });
  return rows.length;
}

export async function listPricelists(companyId: string) {
  return prisma.pricelist.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { candidates: true } } },
  });
}

export async function getPricelist(companyId: string, id: string) {
  return prisma.pricelist.findFirst({
    where: { id, companyId },
    include: {
      candidates: { orderBy: [{ approved: 'desc' }, { confidence: 'desc' }, { productName: 'asc' }] },
    },
  });
}

export async function setCandidateApproved(
  companyId: string,
  candidateId: string,
  approved: boolean
) {
  const c = await prisma.pricelistItemCandidate.findFirst({ where: { id: candidateId, companyId } });
  if (!c) throw new Error('Riga candidata non trovata.');
  return prisma.pricelistItemCandidate.update({
    where: { id: candidateId },
    data: { approved },
  });
}

export async function updateCandidate(
  companyId: string,
  candidateId: string,
  data: Partial<{
    productName: string;
    sku: string | null;
    basePrice: number | null;
    pricePerSquareMeter: number | null;
    pricePerLinearMeter: number | null;
    minBillableQuantity: number | null;
    pricingFormula: string;
    category: string;
    color: string | null;
    material: string | null;
    variant: string | null;
  }>
) {
  const c = await prisma.pricelistItemCandidate.findFirst({ where: { id: candidateId, companyId } });
  if (!c) throw new Error('Riga candidata non trovata.');
  return prisma.pricelistItemCandidate.update({
    where: { id: candidateId },
    data: data as never,
  });
}

export async function importApprovedCandidatesToCatalog(
  companyId: string,
  pricelistId: string,
  actor: { id: string; email: string }
): Promise<{ created: number; updated: number; skipped: number }> {
  const candidates = await prisma.pricelistItemCandidate.findMany({
    where: { pricelistId, companyId, approved: true },
  });
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (!c.productName) {
      skipped++;
      continue;
    }
    const sku = c.sku && c.sku.trim().length > 0 ? c.sku.trim() : `AUTO-${randomUUID().slice(0, 8)}`;
    const existing = await prisma.product.findFirst({
      where: { companyId, sku },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: c.productName,
          category: c.category,
          description: c.description ?? existing.description,
          basePrice: c.basePrice ?? existing.basePrice,
          pricePerSquareMeter: c.pricePerSquareMeter ?? existing.pricePerSquareMeter,
          pricePerLinearMeter: c.pricePerLinearMeter ?? existing.pricePerLinearMeter,
          minBillableQuantity: c.minBillableQuantity ?? existing.minBillableQuantity,
          pricingFormula: c.pricingFormula,
          material: c.material ?? existing.material,
          color: c.color ?? existing.color,
          unit: c.unit ?? existing.unit,
          sourcePricelistId: pricelistId,
          active: true,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          companyId,
          sku,
          name: c.productName,
          category: c.category,
          description: c.description,
          basePrice: c.basePrice ?? 0,
          pricePerSquareMeter: c.pricePerSquareMeter,
          pricePerLinearMeter: c.pricePerLinearMeter,
          minBillableQuantity: c.minBillableQuantity,
          pricingFormula: c.pricingFormula,
          material: c.material,
          color: c.color,
          unit: c.unit ?? 'pz',
          sourcePricelistId: pricelistId,
          active: true,
          demoPrice: false,
        },
      });
      created++;
    }
  }

  await prisma.pricelist.update({
    where: { id: pricelistId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });

  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'pricelist.approve',
    entityType: 'Pricelist',
    entityId: pricelistId,
    metadata: { created, updated, skipped },
  });

  return { created, updated, skipped };
}

export async function rejectPricelist(
  companyId: string,
  id: string,
  actor: { id: string; email: string }
) {
  const p = await prisma.pricelist.findFirst({ where: { id, companyId } });
  if (!p) throw new Error('Listino non trovato.');
  await prisma.pricelist.update({ where: { id }, data: { status: 'REJECTED' } });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'pricelist.reject',
    entityType: 'Pricelist',
    entityId: id,
  });
}
