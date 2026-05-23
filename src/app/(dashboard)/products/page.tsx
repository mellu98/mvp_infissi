import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCurrentCompanyId } from '@/lib/auth';
import { listProducts } from '@/server/services/products.service';
import { PRICING_FORMULA_LABELS, PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { q?: string; category?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const companyId = await getCurrentCompanyId();
  const products = await listProducts(companyId, {
    search: searchParams.q,
    category: searchParams.category,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalogo prodotti</h1>
          <p className="text-sm text-muted-foreground">{products.length} articoli totali.</p>
        </div>
        <Button asChild>
          <Link href="/products/new"><Plus className="mr-2 h-4 w-4" /> Nuovo prodotto</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form className="flex flex-wrap gap-2">
            <Input
              name="q"
              placeholder="Cerca per nome o SKU…"
              defaultValue={searchParams.q ?? ''}
              className="max-w-sm"
            />
            <Select name="category" defaultValue={searchParams.category ?? ''} className="max-w-xs">
              <option value="">Tutte le categorie</option>
              {PRODUCT_CATEGORIES.map((k) => (
                <option key={k} value={k}>{PRODUCT_CATEGORY_LABELS[k]}</option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">Filtra</Button>
          </form>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nessun prodotto.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/products/${p.id}`}>{p.name}</Link>
                      {p.demoPrice && <Badge variant="warning" className="ml-2">DEMO</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{PRODUCT_CATEGORY_LABELS[p.category]}</TableCell>
                    <TableCell className="text-sm">{PRICING_FORMULA_LABELS[p.pricingFormula]}</TableCell>
                    <TableCell className="text-sm">
                      {p.pricingFormula === 'PER_LINEAR_METER' && p.pricePerLinearMeter != null
                        ? `${formatCurrency(p.pricePerLinearMeter)}/m`
                        : formatCurrency(p.basePrice)}
                    </TableCell>
                    <TableCell>
                      {p.active ? <Badge variant="success">Attivo</Badge> : <Badge variant="secondary">Inattivo</Badge>}
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
