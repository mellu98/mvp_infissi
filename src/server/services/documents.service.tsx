import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { ContractPdf } from '@/lib/documents/contract-pdf';
import { QuotePdf } from '@/lib/documents/quote-pdf';
import type { PdfCompanySettings, PdfQuote } from '@/lib/documents/types';
import { getStorageProvider } from '@/lib/storage';

export async function generateQuotePdfDocument(
  companyId: string,
  quoteId: string,
  actor: { id: string; email: string }
) {
  const { quote, settings } = await loadQuotePdfData(companyId, quoteId);
  const buffer = await renderToBuffer(<QuotePdf quote={quote} settings={settings} />);
  return persistGeneratedDocument({
    companyId,
    quoteId,
    customerId: quote.customerId,
    fileName: `preventivo-${quote.quoteNumber}.pdf`,
    type: 'QUOTE_PDF',
    buffer,
    actor,
  });
}

export async function generateContractPdfDocument(
  companyId: string,
  quoteId: string,
  actor: { id: string; email: string }
) {
  const { quote, settings } = await loadQuotePdfData(companyId, quoteId);
  const buffer = await renderToBuffer(<ContractPdf quote={quote} settings={settings} />);
  return persistGeneratedDocument({
    companyId,
    quoteId,
    customerId: quote.customerId,
    fileName: `contratto-${quote.quoteNumber}.pdf`,
    type: 'CONTRACT_PDF',
    buffer,
    actor,
  });
}

async function loadQuotePdfData(companyId: string, quoteId: string) {
  const [quote, settings] = await Promise.all([
    prisma.quote.findFirst({
      where: { id: quoteId, companyId },
      include: {
        customer: true,
        items: { orderBy: { position: 'asc' } },
      },
    }),
    prisma.companySettings.findUnique({ where: { companyId } }),
  ]);

  if (!quote) throw new Error('Preventivo non trovato.');
  if (!settings) throw new Error('Impostazioni azienda non configurate.');

  return {
    quote: {
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      validUntil: quote.validUntil,
      notes: quote.notes,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      vatTotal: quote.vatTotal,
      grandTotal: quote.grandTotal,
      globalDiscountPercentage: quote.globalDiscountPercentage,
      vatRate: quote.vatRate,
      createdAt: quote.createdAt,
      customerId: quote.customerId,
      customer: quote.customer,
      items: quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        widthCm: item.widthCm,
        heightCm: item.heightCm,
        lengthCm: item.lengthCm,
        areaMq: item.areaMq,
        unitPrice: item.unitPrice,
        optionsTotal: item.optionsTotal,
        discountPercentage: item.discountPercentage,
        subtotal: item.subtotal,
        vatAmount: item.vatAmount,
        total: item.total,
        calculationExplanation: item.calculationExplanation,
      })),
    } satisfies PdfQuote & { customerId: string },
    settings: {
      legalName: settings.legalName,
      vatNumber: settings.vatNumber,
      taxCode: settings.taxCode,
      address: settings.address,
      city: settings.city,
      province: settings.province,
      postalCode: settings.postalCode,
      country: settings.country,
      email: settings.email,
      phone: settings.phone,
      website: settings.website,
      quoteTerms: settings.quoteTerms,
      contractTerms: settings.contractTerms,
    } satisfies PdfCompanySettings,
  };
}

async function persistGeneratedDocument(params: {
  companyId: string;
  quoteId: string;
  customerId: string;
  fileName: string;
  type: 'QUOTE_PDF' | 'CONTRACT_PDF';
  buffer: Buffer;
  actor: { id: string; email: string };
}) {
  const storage = getStorageProvider();
  const upload = await storage.uploadFile({
    buffer: params.buffer,
    fileName: params.fileName,
    mimeType: 'application/pdf',
    prefix: `documents/${params.companyId}/quotes/${params.quoteId}`,
  });

  const document = await prisma.document.create({
    data: {
      companyId: params.companyId,
      customerId: params.customerId,
      quoteId: params.quoteId,
      type: params.type,
      fileName: params.fileName,
      storageKey: upload.key,
      url: upload.url,
      mimeType: 'application/pdf',
      fileSize: params.buffer.byteLength,
    },
  });

  await logAuditEvent({
    companyId: params.companyId,
    userId: params.actor.id,
    userEmail: params.actor.email,
    action: params.type === 'QUOTE_PDF' ? 'quote.pdf.generate' : 'quote.contract.generate',
    entityType: 'Document',
    entityId: document.id,
    metadata: { quoteId: params.quoteId, storageKey: upload.key },
  });

  return { document, buffer: params.buffer };
}
