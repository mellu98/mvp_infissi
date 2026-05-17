import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/customers/customer-form';
import { createCustomerAction } from '@/server/actions/customers.actions';

export default function NewCustomerPage() {
  async function handle(formData: FormData) {
    'use server';
    await createCustomerAction(null, formData);
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/customers"><ChevronLeft className="mr-1 h-4 w-4" /> Clienti</Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuovo cliente</h1>
      </div>
      <CustomerForm action={handle} submitLabel="Crea cliente" />
    </div>
  );
}
