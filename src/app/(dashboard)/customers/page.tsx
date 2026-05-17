import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentCompanyId } from '@/lib/auth';
import { listCustomers } from '@/server/services/customers.service';
import { customerDisplayName, leadStatusLabel, leadStatusVariant } from '@/components/customers/customer-display-name';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { q?: string };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const companyId = await getCurrentCompanyId();
  const customers = await listCustomers(companyId, searchParams.q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clienti</h1>
          <p className="text-sm text-muted-foreground">{customers.length} schede in archivio.</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" /> Nuovo cliente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <form className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Cerca per nome, ragione sociale, email…"
                defaultValue={searchParams.q ?? ''}
                className="max-w-md"
              />
              <Button type="submit" variant="secondary" size="sm">
                Cerca
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nessun cliente trovato.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Preventivi</TableHead>
                  <TableHead>Creato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/customers/${c.id}`}>
                        {customerDisplayName(c)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {c.type === 'BUSINESS' ? 'Azienda' : 'Privato'}
                        {c.city ? ` · ${c.city}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.email ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? '—'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={leadStatusVariant(c.leadStatus)}>
                        {leadStatusLabel(c.leadStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c._count.quotes}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.createdAt)}
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
