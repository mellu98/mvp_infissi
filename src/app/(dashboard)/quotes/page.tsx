import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerDisplayName } from '@/components/customers/customer-display-name';
import { getCurrentCompanyId } from '@/lib/auth';
import { quoteStatusLabel, quoteStatusVariant, QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/lib/quote-status';
import { formatCurrency, formatDate } from '@/lib/utils';
import { listQuotes } from '@/server/services/quotes.service';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { status?: string; customerId?: string };
}

export default async function QuotesPage({ searchParams }: PageProps) {
  const companyId = await getCurrentCompanyId();
  const quotes = await listQuotes(companyId, {
    status: searchParams.status,
    customerId: searchParams.customerId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Preventivi</h1>
          <p className="text-sm text-muted-foreground">
            {quotes.length} preventivi trovati.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus className="mr-2 h-4 w-4" /> Nuovo preventivo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form className="flex flex-wrap gap-2">
            <Select name="status" defaultValue={searchParams.status ?? ''} className="max-w-xs">
              <option value="">Tutti gli stati</option>
              {QUOTE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {QUOTE_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Filtra
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nessun preventivo ancora. Creane uno: il CRM senza preventivi è come un
              cantiere senza metro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Validità</TableHead>
                  <TableHead>Righe</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link href={`/quotes/${quote.id}`} className="font-medium hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{customerDisplayName(quote.customer)}</TableCell>
                    <TableCell>
                      <Badge variant={quoteStatusVariant(quote.status)}>
                        {quoteStatusLabel(quote.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(quote.validUntil)}</TableCell>
                    <TableCell className="text-sm">{quote._count.items}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.grandTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
