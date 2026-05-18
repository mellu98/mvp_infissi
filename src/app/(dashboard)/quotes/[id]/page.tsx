import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Copy, FileText, ScrollText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerDisplayName } from '@/components/customers/customer-display-name';
import { QuoteItemSection, type QuoteProductOption } from '@/components/quotes/quote-item-section';
import { QuoteStatusForm } from '@/components/quotes/quote-status-form';
import { getCurrentCompanyId } from '@/lib/auth';
import { unitPriceLabel } from '@/lib/categories';
import { quoteStatusLabel, quoteStatusVariant } from '@/lib/quote-status';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import {
  deleteQuoteAction,
  deleteQuoteItemAction,
  duplicateQuoteAction,
} from '@/server/actions/quotes.actions';
import { listProducts } from '@/server/services/products.service';
import { getQuote } from '@/server/services/quotes.service';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function QuoteDetailPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const [quote, products] = await Promise.all([
    getQuote(companyId, params.id),
    listProducts(companyId, { activeOnly: true }),
  ]);
  if (!quote) notFound();

  const productOptions: QuoteProductOption[] = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    pricingFormula: product.pricingFormula,
    unit: product.unit,
    basePrice: product.basePrice,
    pricePerSquareMeter: product.pricePerSquareMeter,
    pricePerLinearMeter: product.pricePerLinearMeter,
    minBillableQuantity: product.minBillableQuantity,
    defaultWidthCm: product.defaultWidthCm,
    defaultHeightCm: product.defaultHeightCm,
    defaultLengthCm: product.defaultLengthCm,
    demoPrice: product.demoPrice,
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      price: option.price,
      priceType: option.priceType,
    })),
  }));

  async function deleteQuote() {
    'use server';
    await deleteQuoteAction(params.id);
  }

  async function duplicateQuote() {
    'use server';
    await duplicateQuoteAction(params.id);
  }

  async function deleteItem(formData: FormData) {
    'use server';
    const itemId = formData.get('itemId') as string;
    await deleteQuoteItemAction(params.id, itemId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/quotes">
              <ChevronLeft className="mr-1 h-4 w-4" /> Preventivi
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Preventivo {quote.quoteNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Cliente:{' '}
              <Link href={`/customers/${quote.customer.id}`} className="hover:underline">
                {customerDisplayName(quote.customer)}
              </Link>{' '}
              · valido fino al {formatDate(quote.validUntil)}
            </p>
          </div>
          <Badge variant={quoteStatusVariant(quote.status)}>
            {quoteStatusLabel(quote.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
              <FileText className="mr-1 h-4 w-4" /> PDF preventivo
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/quotes/${quote.id}/contract`} target="_blank" rel="noreferrer">
              <ScrollText className="mr-1 h-4 w-4" /> Contratto
            </a>
          </Button>
          <QuoteStatusForm quoteId={quote.id} currentStatus={quote.status} />
          <form action={duplicateQuote}>
            <Button type="submit" variant="outline" size="sm">
              <Copy className="mr-1 h-4 w-4" /> Duplica
            </Button>
          </form>
          <form action={deleteQuote}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-1 h-4 w-4" /> Elimina
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <TotalCard title="Subtotale" value={formatCurrency(quote.subtotal)} />
        <TotalCard title="Sconti" value={formatCurrency(quote.discountTotal)} />
        <TotalCard title={`IVA ${formatNumber(quote.vatRate, 0)}%`} value={formatCurrency(quote.vatTotal)} />
        <TotalCard title="Totale" value={formatCurrency(quote.grandTotal)} emphasis />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Righe preventivo</CardTitle>
        </CardHeader>
        <CardContent>
          {quote.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nessuna riga: aggiungi un prodotto o una riga manuale.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Misure</TableHead>
                  <TableHead>Q.tà</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{item.description}</div>
                      {item.product?.demoPrice && (
                        <Badge variant="warning" className="mt-1">
                          DEMO
                        </Badge>
                      )}
                      {item.calculationExplanation && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.calculationExplanation}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatMeasures(item)}</TableCell>
                    <TableCell className="text-sm">{formatNumber(item.quantity, 2)}</TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(item.unitPrice)}
                      <span className="block text-xs text-muted-foreground">
                        {item.manualPriceOverride != null
                          ? 'manuale'
                          : unitPriceLabel(item.product?.pricingFormula)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.optionsTotal > 0
                        ? `${formatCurrency(item.optionsTotal)} ${formatOptionNames(item.selectedOptions)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuoteItemSection quoteId={quote.id} products={productOptions} />

      {(quote.notes || quote.internalNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {quote.notes && (
              <div>
                <h3 className="font-medium">Note cliente</h3>
                <p className="whitespace-pre-line text-muted-foreground">{quote.notes}</p>
              </div>
            )}
            {quote.notes && quote.internalNotes && <Separator />}
            {quote.internalNotes && (
              <div>
                <h3 className="font-medium">Note interne</h3>
                <p className="whitespace-pre-line text-muted-foreground">{quote.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {quote.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documenti generati</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Creato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <a
                        href={document.url ?? `/api/files/${encodeURIComponent(document.storageKey)}`}
                        className="font-medium hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {document.fileName}
                      </a>
                    </TableCell>
                    <TableCell>{document.type}</TableCell>
                    <TableCell>{formatDate(document.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TotalCard({
  title,
  value,
  emphasis = false,
}: {
  title: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={emphasis ? 'text-2xl font-bold' : 'text-xl font-semibold'}>{value}</div>
      </CardContent>
    </Card>
  );
}

function formatMeasures(item: {
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  areaMq: number | null;
  linearMeters: number | null;
}) {
  const parts: string[] = [];
  if (item.widthCm && item.heightCm) {
    parts.push(`${formatNumber(item.widthCm, 0)}×${formatNumber(item.heightCm, 0)} cm`);
  }
  if (item.lengthCm) parts.push(`${formatNumber(item.lengthCm, 0)} cm`);
  if (item.areaMq) parts.push(`${formatNumber(item.areaMq)} mq`);
  if (item.linearMeters) parts.push(`${formatNumber(item.linearMeters)} m`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function formatOptionNames(value: unknown): string {
  if (!Array.isArray(value)) return '';
  const names = value
    .map((item) =>
      item && typeof item === 'object' && 'name' in item
        ? String((item as { name?: unknown }).name ?? '')
        : ''
    )
    .filter(Boolean);
  return names.length > 0 ? `(${names.join(', ')})` : '';
}
