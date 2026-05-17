import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { createProductAction } from '@/server/actions/products.actions';

export default function NewProductPage() {
  async function handle(formData: FormData) {
    'use server';
    await createProductAction(null, formData);
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/products"><ChevronLeft className="mr-1 h-4 w-4" /> Catalogo</Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuovo prodotto</h1>
      </div>
      <ProductForm action={handle} submitLabel="Crea prodotto" />
    </div>
  );
}
