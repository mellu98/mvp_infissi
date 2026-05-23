import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileX, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentCompanyId } from '@/lib/auth';
import { getPricelist } from '@/server/services/pricelists.service';
import { ReviewRow } from '@/components/pricelists/review-row';
import {
  approvePricelistAction,
  rejectPricelistAction,
} from '@/server/actions/pricelists.actions';

interface Props { params: { id: string } }

export default async function ReviewPricelistPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const pricelist = await getPricelist(companyId, params.id);
  if (!pricelist) notFound();

  const approvedCount = pricelist.candidates.filter((c) => c.approved).length;

  async function approve() {
    'use server';
    await approvePricelistAction(params.id);
  }
  async function reject() {
    'use server';
    await rejectPricelistAction(params.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/pricelists/${pricelist.id}`}><ChevronLeft className="mr-1 h-4 w-4" /> Listino</Link>
          </Button>
          <h1 className="text-2xl font-bold">Revisione: {pricelist.name}</h1>
        </div>
        <div className="flex gap-2">
          <form action={reject}>
            <Button type="submit" variant="outline" size="sm"><FileX className="mr-1 h-4 w-4" />Rifiuta</Button>
          </form>
          <form action={approve}>
            <Button type="submit" size="sm" disabled={approvedCount === 0}>
              <Upload className="mr-1 h-4 w-4" />Importa {approvedCount > 0 ? `(${approvedCount})` : ''}
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {pricelist.candidates.length} righe candidate — {approvedCount} selezionate
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Verifica nome, SKU, prezzo e formula. Seleziona le righe da importare nel catalogo prodotti.
            Solo le righe approvate diventeranno prodotti.
          </p>
        </CardHeader>
        <CardContent>
          {pricelist.candidates.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nessuna riga estratta. Il file potrebbe essere un&apos;immagine, scansione o un formato non riconosciuto.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Confidenza</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricelist.candidates.map((c) => (
                  <ReviewRow
                    key={c.id}
                    pricelistId={pricelist.id}
                    candidate={{
                      id: c.id,
                      productName: c.productName,
                      sku: c.sku,
                      category: c.category,
                      basePrice: c.basePrice,
                      pricePerLinearMeter: c.pricePerLinearMeter,
                      pricingFormula: c.pricingFormula,
                      confidence: c.confidence,
                      approved: c.approved,
                      validationErrors: c.validationErrors,
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
