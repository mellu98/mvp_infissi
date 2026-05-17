import { Prisma, type QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { calculateQuoteLine, calculateQuoteTotals } from '@/lib/pricing';
import { round2 } from '@/lib/pricing/rounding';
import type {
  LineCalculation,
  OptionSnapshot,
  ProductSnapshot,
} from '@/lib/pricing/types';
import type { QuoteCreateInput, QuoteItemInput } from '@/lib/validation/quote';
import { reserveNextQuoteNumber } from './settings.service';

type ProductWithOptions = Prisma.ProductGetPayload<{ include: { options: true } }>;
type QuoteWithItems = Prisma.QuoteGetPayload<{ include: { items: true } }>;

export async function listQuotes(
  companyId: string,
  filters?: { status?: string; customerId?: string }
) {
  return prisma.quote.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status as QuoteStatus } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      _count: { select: { items: true, documents: true } },
    },
  });
}

export async function getQuote(companyId: string, id: string) {
  return prisma.quote.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      items: {
        orderBy: { position: 'asc' },
        include: { product: true },
      },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function createQuote(
  companyId: string,
  data: QuoteCreateInput,
  actor: { id: string; email: string }
) {
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, companyId },
    select: { id: true },
  });
  if (!customer) throw new Error('Cliente non trovato.');

  const quoteNumber = await reserveNextQuoteNumber(companyId);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + data.validUntilDays);

  const quote = await prisma.quote.create({
    data: {
      companyId,
      customerId: data.customerId,
      quoteNumber,
      validUntil,
      notes: data.notes ?? null,
      internalNotes: data.internalNotes ?? null,
      vatRate: data.vatRate,
      globalDiscountPercentage: data.globalDiscountPercentage,
      status: 'DRAFT',
    },
  });

  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'quote.create',
    entityType: 'Quote',
    entityId: quote.id,
    metadata: { quoteNumber },
  });

  return quote;
}

export async function addQuoteItem(
  companyId: string,
  quoteId: string,
  data: QuoteItemInput,
  actor: { id: string; email: string }
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, companyId },
      include: { items: true },
    });
    if (!quote) throw new Error('Preventivo non trovato.');

    const product = data.productId
      ? await tx.product.findFirst({
          where: { id: data.productId, companyId, active: true },
          include: { options: true },
        })
      : null;

    if (!product && data.manualPriceOverride == null) {
      throw new Error(
        'Se non selezioni un prodotto, devi indicare un prezzo manuale.'
      );
    }

    const selectedOptionIds = [...new Set(data.selectedOptionIds ?? [])];
    const selectedOptions = await resolveSelectedOptions(
      tx,
      companyId,
      product,
      selectedOptionIds
    );
    const productSnapshot = product
      ? toProductSnapshot(product)
      : manualProductSnapshot(data.description, data.manualPriceOverride ?? 0);
    const optionSnapshots = selectedOptions.map(toOptionSnapshot);

    const calculation = calculateQuoteLine(
      {
        product: productSnapshot,
        quantity: data.quantity,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        lengthCm: data.lengthCm,
        selectedOptions: optionSnapshots,
        discountPercentage: data.discountPercentage,
        manualPriceOverride: data.manualPriceOverride,
        notes: data.notes,
      },
      { vatRate: quote.vatRate, currency: 'EUR' }
    );

    const maxPosition = quote.items.reduce((max, item) => Math.max(max, item.position), 0);
    const item = await tx.quoteItem.create({
      data: {
        companyId,
        quoteId,
        productId: product?.id ?? null,
        description: data.description || product?.name || productSnapshot.name,
        productSnapshot: toJsonObject(productSnapshot),
        quantity: data.quantity,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        lengthCm: data.lengthCm,
        areaMq: calculation.areaMq,
        billableAreaMq: calculation.billableAreaMq,
        linearMeters: calculation.linearMeters,
        unitPrice: calculation.unitPrice,
        optionsTotal: calculation.optionsTotal,
        selectedOptions: optionSnapshots.map((opt) => toJsonObject(opt)),
        discountPercentage: data.discountPercentage,
        subtotal: calculation.subtotal,
        vatRate: calculation.vatRate,
        vatAmount: calculation.vatAmount,
        total: calculation.total,
        manualPriceOverride: data.manualPriceOverride,
        calculationExplanation: calculation.explanation,
        position: maxPosition + 1,
      },
    });

    await recalculateQuoteTotalsTx(tx, companyId, quoteId);

    await logAuditEventTx(tx, {
      companyId,
      userId: actor.id,
      userEmail: actor.email,
      action: 'quote.item.create',
      entityType: 'QuoteItem',
      entityId: item.id,
      metadata: { quoteId, productId: product?.id ?? null },
    });

    return item;
  });
}

export async function deleteQuoteItem(
  companyId: string,
  quoteId: string,
  itemId: string,
  actor: { id: string; email: string }
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.quoteItem.findFirst({
      where: { id: itemId, quoteId, companyId },
      select: { id: true },
    });
    if (!item) throw new Error('Riga preventivo non trovata.');

    await tx.quoteItem.delete({ where: { id: itemId } });
    await recalculateQuoteTotalsTx(tx, companyId, quoteId);

    await logAuditEventTx(tx, {
      companyId,
      userId: actor.id,
      userEmail: actor.email,
      action: 'quote.item.delete',
      entityType: 'QuoteItem',
      entityId: itemId,
      metadata: { quoteId },
    });
  });
}

export async function updateQuoteStatus(
  companyId: string,
  quoteId: string,
  status: QuoteStatus,
  actor: { id: string; email: string }
) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, companyId } });
  if (!quote) throw new Error('Preventivo non trovato.');

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });

  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'quote.status.update',
    entityType: 'Quote',
    entityId: quoteId,
    metadata: { from: quote.status, to: status },
  });

  return updated;
}

export async function deleteQuote(
  companyId: string,
  quoteId: string,
  actor: { id: string; email: string }
) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, companyId } });
  if (!quote) throw new Error('Preventivo non trovato.');

  await prisma.quote.delete({ where: { id: quoteId } });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'quote.delete',
    entityType: 'Quote',
    entityId: quoteId,
    metadata: { quoteNumber: quote.quoteNumber },
  });
}

export async function duplicateQuote(
  companyId: string,
  quoteId: string,
  actor: { id: string; email: string }
) {
  const source = await prisma.quote.findFirst({
    where: { id: quoteId, companyId },
    include: { items: { orderBy: { position: 'asc' } } },
  });
  if (!source) throw new Error('Preventivo non trovato.');

  const quoteNumber = await reserveNextQuoteNumber(companyId);
  const duplicated = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        companyId,
        customerId: source.customerId,
        quoteNumber,
        status: 'DRAFT',
        validUntil: source.validUntil,
        notes: source.notes,
        internalNotes: source.internalNotes,
        globalDiscountPercentage: source.globalDiscountPercentage,
        vatRate: source.vatRate,
      },
    });

    for (const item of source.items) {
      await tx.quoteItem.create({
        data: {
          companyId,
          quoteId: quote.id,
          productId: item.productId,
          description: item.description,
          productSnapshot: jsonValueOrNull(item.productSnapshot),
          quantity: item.quantity,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          lengthCm: item.lengthCm,
          areaMq: item.areaMq,
          billableAreaMq: item.billableAreaMq,
          linearMeters: item.linearMeters,
          unitPrice: item.unitPrice,
          optionsTotal: item.optionsTotal,
          selectedOptions: jsonValueOrNull(item.selectedOptions),
          selectedVariant: item.selectedVariant,
          discountPercentage: item.discountPercentage,
          subtotal: item.subtotal,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          total: item.total,
          manualPriceOverride: item.manualPriceOverride,
          calculationExplanation: item.calculationExplanation,
          position: item.position,
        },
      });
    }

    await recalculateQuoteTotalsTx(tx, companyId, quote.id);
    return quote;
  });

  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'quote.duplicate',
    entityType: 'Quote',
    entityId: duplicated.id,
    metadata: { fromQuoteId: quoteId, quoteNumber },
  });

  return duplicated;
}

async function resolveSelectedOptions(
  tx: Prisma.TransactionClient,
  companyId: string,
  product: ProductWithOptions | null,
  selectedOptionIds: string[]
) {
  if (selectedOptionIds.length === 0) return [];
  if (!product) {
    throw new Error('Gli optional richiedono un prodotto catalogo.');
  }

  const options = await tx.productOption.findMany({
    where: {
      companyId,
      productId: product.id,
      active: true,
      id: { in: selectedOptionIds },
    },
  });

  if (options.length !== selectedOptionIds.length) {
    throw new Error('Uno o più optional selezionati non sono validi per questo prodotto.');
  }

  return options;
}

async function recalculateQuoteTotalsTx(
  tx: Prisma.TransactionClient,
  companyId: string,
  quoteId: string
) {
  const quote = await tx.quote.findFirst({
    where: { id: quoteId, companyId },
    include: { items: true },
  });
  if (!quote) throw new Error('Preventivo non trovato.');

  const lines = quote.items.map(itemToLineCalculation);
  const totals = calculateQuoteTotals(
    lines,
    quote.globalDiscountPercentage,
    quote.vatRate
  );
  const nextStatus =
    quote.items.length === 0
      ? 'DRAFT'
      : quote.status === 'DRAFT'
        ? 'CALCULATED'
        : quote.status;

  await tx.quote.update({
    where: { id: quoteId },
    data: {
      status: nextStatus,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      vatTotal: totals.vatTotal,
      grandTotal: totals.grandTotal,
    },
  });
}

function itemToLineCalculation(item: QuoteWithItems['items'][number]): LineCalculation {
  const discountAmount = round2(item.subtotal * (clampPercentage(item.discountPercentage) / 100));
  const taxableAmount = round2(item.subtotal - discountAmount);

  return {
    areaMq: item.areaMq,
    billableAreaMq: item.billableAreaMq,
    linearMeters: item.linearMeters,
    unitPrice: item.unitPrice,
    optionsTotal: item.optionsTotal,
    optionDetails: [],
    subtotal: item.subtotal,
    discountAmount,
    taxableAmount,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    total: item.total,
    explanation: item.calculationExplanation ?? '',
    manualOverrideApplied: item.manualPriceOverride != null,
    warnings: [],
  };
}

function toProductSnapshot(product: ProductWithOptions): ProductSnapshot {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    unit: product.unit,
    basePrice: product.basePrice,
    pricePerSquareMeter: product.pricePerSquareMeter,
    pricePerLinearMeter: product.pricePerLinearMeter,
    minBillableQuantity: product.minBillableQuantity,
    pricingFormula: product.pricingFormula,
    demoPrice: product.demoPrice,
  };
}

function manualProductSnapshot(description: string, price: number): ProductSnapshot {
  return {
    name: description,
    unit: 'pz',
    basePrice: price,
    pricePerSquareMeter: null,
    pricePerLinearMeter: null,
    minBillableQuantity: null,
    pricingFormula: 'FIXED_PRICE',
    demoPrice: false,
  };
}

function toOptionSnapshot(option: ProductWithOptions['options'][number]): OptionSnapshot {
  return {
    id: option.id,
    name: option.name,
    price: option.price,
    priceType: option.priceType,
  };
}

function toJsonObject(value: object): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as Prisma.InputJsonObject;
}

function jsonValueOrNull(
  value: Prisma.JsonValue | null
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function clampPercentage(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

async function logAuditEventTx(
  tx: Prisma.TransactionClient,
  data: {
    companyId: string;
    userId?: string | null;
    userEmail?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  await tx.auditLog.create({
    data: {
      companyId: data.companyId,
      userId: data.userId ?? null,
      userEmail: data.userEmail ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata ?? undefined,
    },
  });
}
