import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { getCurrentCompanyId } from '@/lib/auth';
import { getProduct } from '@/server/services/products.service';
import {
  deleteOptionAction,
  deleteProductAction,
} from '@/server/actions/products.actions';
import { OptionForm } from '@/components/products/option-form';
import {
  OPTION_PRICE_TYPE_LABELS,
  PRICING_FORMULA_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';

interface Props { params: { id: string } }

export default async function ProductDetailPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const product = await getProduct(companyId, params.id);
  if (!product) notFound();

  async function deleteProduct() {
    'use server';
    await deleteProductAction(params.id);
  }
  async function deleteOption(formData: FormData) {
    'use server';
    const optionId = formData.get('optionId') as string;
    await deleteOptionAction(params.id, optionId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/products"><ChevronLeft className="mr-1 h-4 w-4" /> Catalogo</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              {PRODUCT_CATEGORY_LABELS[product.category]} · SKU <span className="font-mono">{product.sku}</span>
            </p>
          </div>
          {product.demoPrice && <Badge variant="warning">DEMO</Badge>}
          {!product.active && <Badge variant="secondary">Inattivo</Badge>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${product.id}/edit`}><Pencil className="mr-1 h-4 w-4" />Modifica</Link>
          </Button>
          <form action={deleteProduct}>
            <Button type="submit" variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Elimina</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Formula</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-semibold">{PRICING_FORMULA_LABELS[product.pricingFormula]}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Prezzo base</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatCurrency(product.basePrice)}</div>
            {product.pricePerLinearMeter != null && (
              <div className="text-xs text-muted-foreground">{formatCurrency(product.pricePerLinearMeter)} / m</div>
            )}
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader><CardTitle>Optional disponibili</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <OptionForm productId={product.id} />
          <Separator />
          {product.options.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun optional configurato.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo prezzo</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.options.map((opt) => (
                  <TableRow key={opt.id}>
                    <TableCell>{opt.name}</TableCell>
                    <TableCell>{OPTION_PRICE_TYPE_LABELS[opt.priceType]}</TableCell>
                    <TableCell>
                      {opt.priceType === 'PERCENTAGE' ? `${opt.price}%` : formatCurrency(opt.price)}
                    </TableCell>
                    <TableCell>
                      {opt.active ? <Badge variant="success">Attivo</Badge> : <Badge variant="secondary">Off</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteOption}>
                        <input type="hidden" name="optionId" value={opt.id} />
                        <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {product.technicalNotes && (
        <Card>
          <CardHeader><CardTitle>Note tecniche</CardTitle></CardHeader>
          <CardContent className="whitespace-pre-line text-sm">{product.technicalNotes}</CardContent>
        </Card>
      )}
    </div>
  );
}
