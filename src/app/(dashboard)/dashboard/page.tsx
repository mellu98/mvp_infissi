import Link from 'next/link';
import { ArrowRight, FileText, Package, ScrollText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCompanyId } from '@/lib/auth';
import { getDashboardStats } from '@/server/services/dashboard.service';
import { customerDisplayName } from '@/components/customers/customer-display-name';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const companyId = await getCurrentCompanyId();
  const stats = await getDashboardStats(companyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Panoramica attività Link Infissi.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Clienti" value={stats.customerCount} href="/customers" />
        <StatCard icon={FileText} title="Preventivi" value={stats.quoteCount} href="/quotes" />
        <StatCard icon={Package} title="Prodotti attivi" value={stats.productActiveCount} href="/products" />
        <StatCard icon={ScrollText} title="Listini da revisionare" value={stats.pricelistReviewCount} href="/pricelists" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat title="Preventivi in bozza" value={stats.quoteDraftCount} />
        <MiniStat title="Preventivi inviati" value={stats.quoteSentCount} />
        <MiniStat title="Preventivi accettati" value={stats.quoteAcceptedCount} />
        <MiniStat title="Valore totale preventivi" value={formatCurrency(stats.quoteValueTotal)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ultimi clienti
              <Link href="/customers" className="text-xs font-normal text-muted-foreground hover:underline">
                Tutti <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun cliente.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.recentCustomers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link className="hover:underline" href={`/customers/${c.id}`}>
                      {customerDisplayName(c)}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ultimi preventivi
              <Link href="/quotes" className="text-xs font-normal text-muted-foreground hover:underline">
                Tutti <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun preventivo.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.recentQuotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between">
                    <Link className="hover:underline" href={`/quotes/${q.id}`}>
                      <strong>{q.quoteNumber}</strong>{' '}
                      <span className="text-muted-foreground">— {customerDisplayName(q.customer)}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{q.status}</Badge>
                      <span>{formatCurrency(q.grandTotal)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-md bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniStat({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
