import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import type { ProductInput, ProductOptionInput } from '@/lib/validation/product';

export async function listProducts(companyId: string, filters?: { search?: string; category?: string; activeOnly?: boolean }) {
  return prisma.product.findMany({
    where: {
      companyId,
      ...(filters?.activeOnly ? { active: true } : {}),
      ...(filters?.category ? { category: filters.category as never } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { sku: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { options: { where: { active: true } } },
  });
}

export async function listCatalogLite(companyId: string) {
  return prisma.product.findMany({
    where: { companyId, active: true },
    orderBy: { name: 'asc' },
    select: { id: true, sku: true, name: true, category: true, material: true, pricingFormula: true },
  });
}

export async function getProduct(companyId: string, id: string) {
  return prisma.product.findFirst({
    where: { id, companyId },
    include: { options: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function createProduct(
  companyId: string,
  data: ProductInput,
  actor: { id: string; email: string }
) {
  const product = await prisma.product.create({
    data: {
      companyId,
      sku: data.sku,
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      material: data.material ?? null,
      color: data.color ?? null,
      unit: data.unit,
      basePrice: data.basePrice,
      pricePerSquareMeter: data.pricePerSquareMeter,
      pricePerLinearMeter: data.pricePerLinearMeter,
      minBillableQuantity: data.minBillableQuantity,
      pricingFormula: data.pricingFormula,
      active: data.active,
      supplier: data.supplier ?? null,
      technicalNotes: data.technicalNotes ?? null,
      demoPrice: data.demoPrice,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'product.create',
    entityType: 'Product',
    entityId: product.id,
  });
  return product;
}

export async function updateProduct(
  companyId: string,
  id: string,
  data: ProductInput,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, id);
  const product = await prisma.product.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      material: data.material ?? null,
      color: data.color ?? null,
      unit: data.unit,
      basePrice: data.basePrice,
      pricePerSquareMeter: data.pricePerSquareMeter,
      pricePerLinearMeter: data.pricePerLinearMeter,
      minBillableQuantity: data.minBillableQuantity,
      pricingFormula: data.pricingFormula,
      active: data.active,
      supplier: data.supplier ?? null,
      technicalNotes: data.technicalNotes ?? null,
      demoPrice: data.demoPrice,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'product.update',
    entityType: 'Product',
    entityId: product.id,
  });
  return product;
}

export async function deleteProduct(
  companyId: string,
  id: string,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, id);
  await prisma.product.delete({ where: { id } });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'product.delete',
    entityType: 'Product',
    entityId: id,
  });
}

export async function addProductOption(
  companyId: string,
  productId: string,
  data: ProductOptionInput,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, productId);
  const opt = await prisma.productOption.create({
    data: {
      companyId,
      productId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      priceType: data.priceType,
      active: data.active,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'product.option.create',
    entityType: 'ProductOption',
    entityId: opt.id,
    metadata: { productId },
  });
  return opt;
}

export async function deleteProductOption(
  companyId: string,
  optionId: string,
  actor: { id: string; email: string }
) {
  const opt = await prisma.productOption.findFirst({ where: { id: optionId, companyId } });
  if (!opt) throw new Error('Optional non trovato.');
  await prisma.productOption.delete({ where: { id: optionId } });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'product.option.delete',
    entityType: 'ProductOption',
    entityId: optionId,
  });
}

async function ensureOwn(companyId: string, productId: string) {
  const p = await prisma.product.findFirst({ where: { id: productId, companyId } });
  if (!p) throw new Error('Prodotto non trovato.');
  return p;
}
