import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText, Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentCompanyId } from '@/lib/auth';
import { getCustomer } from '@/server/services/customers.service';
import { customerDisplayName, leadStatusLabel, leadStatusVariant } from '@/components/customers/customer-display-name';
import { NoteForm } from '@/components/customers/note-form';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface Props { params: { id: string } }

export default async function CustomerDetailPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const customer = await getCustomer(companyId, params.id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/customers"><ChevronLeft className="mr-1 h-4 w-4" /> Clienti</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customerDisplayName(customer)}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.type === 'BUSINESS' ? 'Azienda' : 'Privato'}
            </p>
          </div>
          <Badge variant={leadStatusVariant(customer.leadStatus)}>
            {leadStatusLabel(customer.leadStatus)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/customers/${customer.id}/edit`}><Pencil className="mr-1 h-4 w-4" />Modifica</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/quotes/new?customerId=${customer.id}`}><FileText className="mr-1 h-4 w-4" />Nuovo preventivo</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Field label="Email" value={customer.email} />
            <Field label="Telefono" value={customer.phone} />
            <Field label="Codice fiscale" value={customer.taxCode} />
            <Field label="Partita IVA" value={customer.vatNumber} />
            <Field label="Indirizzo" value={customer.address} />
            <Field label="Città" value={[customer.city, customer.province, customer.postalCode].filter(Boolean).join(' · ')} />
            {customer.notes && (
              <div className="md:col-span-2">
                <div className="text-xs uppercase text-muted-foreground">Note</div>
                <div className="whitespace-pre-line">{customer.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">Note interne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NoteForm customerId={customer.id} />
            <Separator />
            <div className="space-y-3">
              {customer.customerNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna nota.</p>
              ) : (
                customer.customerNotes.map((n) => (
                  <div key={n.id} className="rounded-md border bg-muted/40 p-3 text-sm">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)} · {n.user?.name ?? n.user?.email ?? 'sistema'}
                    </div>
                    <div className="whitespace-pre-line">{n.content}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Preventivi
            <Button asChild size="sm" variant="outline">
              <Link href={`/quotes/new?customerId=${customer.id}`}><Plus className="mr-1 h-4 w-4" />Nuovo</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun preventivo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Creato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell><Link className="hover:underline" href={`/quotes/${q.id}`}>{q.quoteNumber}</Link></TableCell>
                    <TableCell><Badge variant="secondary">{q.status}</Badge></TableCell>
                    <TableCell>{formatCurrency(q.grandTotal)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(q.createdAt)}</TableCell>
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div>{value && value.length > 0 ? value : '—'}</div>
    </div>
  );
}
