import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { getCurrentCompanyId } from '@/lib/auth';
import { getProduct } from '@/server/services/products.service';
import { updateProductAction } from '@/server/actions/products.actions';

interface Props { params: { id: string } }

export default async function EditProductPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const product = await getProduct(companyId, params.id);
  if (!product) notFound();

  async function handle(formData: FormData) {
    'use server';
    await updateProductAction(params.id, formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/products/${product.id}`}><ChevronLeft className="mr-1 h-4 w-4" /> Prodotto</Link>
        </Button>
        <h1 className="text-2xl font-bold">Modifica prodotto</h1>
      </div>
      <ProductForm initial={product} action={handle} submitLabel="Salva modifiche" />
    </div>
  );
}
