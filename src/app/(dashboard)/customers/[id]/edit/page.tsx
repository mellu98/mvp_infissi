import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCurrentCompanyId } from '@/lib/auth';
import { getCustomer } from '@/server/services/customers.service';
import { updateCustomerAction } from '@/server/actions/customers.actions';

interface Props { params: { id: string } }

export default async function EditCustomerPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const customer = await getCustomer(companyId, params.id);
  if (!customer) notFound();

  async function handle(formData: FormData) {
    'use server';
    await updateCustomerAction(params.id, formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/customers/${params.id}`}><ChevronLeft className="mr-1 h-4 w-4" /> Scheda cliente</Link>
        </Button>
        <h1 className="text-2xl font-bold">Modifica cliente</h1>
      </div>
      <CustomerForm initial={customer} action={handle} submitLabel="Salva modifiche" />
    </div>
  );
}
