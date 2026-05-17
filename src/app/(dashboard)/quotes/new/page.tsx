import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { customerDisplayName } from '@/components/customers/customer-display-name';
import { QuoteCreateForm } from '@/components/quotes/quote-create-form';
import { getCurrentCompanyId } from '@/lib/auth';
import { getCompanySettings } from '@/server/services/settings.service';
import { listCustomers } from '@/server/services/customers.service';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { customerId?: string };
}

export default async function NewQuotePage({ searchParams }: PageProps) {
  const companyId = await getCurrentCompanyId();
  const [customers, settings] = await Promise.all([
    listCustomers(companyId),
    getCompanySettings(companyId),
  ]);

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: customerDisplayName(customer),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/quotes">
            <ChevronLeft className="mr-1 h-4 w-4" /> Preventivi
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuovo preventivo</h1>
          <p className="text-sm text-muted-foreground">
            Prima crei il contenitore, poi aggiungi righe calcolate dal motore prezzi.
          </p>
        </div>
      </div>

      {customerOptions.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Serve almeno un cliente prima di creare un preventivo.
            </p>
            <Button asChild>
              <Link href="/customers/new">Crea cliente</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <QuoteCreateForm
          customers={customerOptions}
          defaultCustomerId={searchParams.customerId}
          defaultValidityDays={settings?.quoteValidityDays ?? 30}
          defaultVatRate={settings?.defaultVatRate ?? 22}
        />
      )}
    </div>
  );
}
