import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentCompanyId } from '@/lib/auth';
import { listPricelists } from '@/server/services/pricelists.service';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/categories';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  UPLOADED: { label: 'Caricato', variant: 'secondary' },
  EXTRACTED: { label: 'Estratto', variant: 'info' },
  NEEDS_REVIEW: { label: 'Da revisionare', variant: 'warning' },
  APPROVED: { label: 'Approvato', variant: 'success' },
  REJECTED: { label: 'Rifiutato', variant: 'destructive' },
};

export default async function PricelistsPage() {
  const companyId = await getCurrentCompanyId();
  const pricelists = await listPricelists(companyId);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listini</h1>
          <p className="text-sm text-muted-foreground">{pricelists.length} listini caricati.</p>
        </div>
        <Button asChild>
          <Link href="/pricelists/new"><Plus className="mr-2 h-4 w-4" /> Carica listino</Link>
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Tutti i listini</CardTitle></CardHeader>
        <CardContent>
          {pricelists.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nessun listino caricato.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Righe candidate</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Caricato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricelists.map((p) => {
                  const status = STATUS_LABELS[p.status] ?? { label: p.status, variant: 'default' as const };
                  return (
                    <TableRow key={p.id}>
                      <TableCell><Link className="font-medium hover:underline" href={`/pricelists/${p.id}`}>{p.name}</Link></TableCell>
                      <TableCell className="text-sm">{p.supplier ?? '—'}</TableCell>
                      <TableCell className="text-sm">{PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}</TableCell>
                      <TableCell className="text-sm">{p._count.candidates}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.uploadedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
