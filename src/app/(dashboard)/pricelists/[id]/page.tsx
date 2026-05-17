import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileEdit, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCompanyId } from '@/lib/auth';
import { getPricelist } from '@/server/services/pricelists.service';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/categories';
import { formatDate } from '@/lib/utils';

interface Props { params: { id: string } }

export default async function PricelistDetailPage({ params }: Props) {
  const companyId = await getCurrentCompanyId();
  const p = await getPricelist(companyId, params.id);
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pricelists"><ChevronLeft className="mr-1 h-4 w-4" /> Listini</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-muted-foreground">{p.supplier ?? '—'} · {PRODUCT_CATEGORY_LABELS[p.category]}</p>
        </div>
        <Badge variant="secondary">{p.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Righe candidate</CardTitle></CardHeader><CardContent><div className="text-xl font-semibold">{p.candidates.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Approvate</CardTitle></CardHeader><CardContent><div className="text-xl font-semibold">{p.candidates.filter((c) => c.approved).length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Caricato</CardTitle></CardHeader><CardContent><div className="text-sm">{formatDate(p.uploadedAt)}</div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Button asChild><Link href={`/pricelists/${p.id}/review`}><FileEdit className="mr-1 h-4 w-4" />Revisiona righe</Link></Button>
        <Button asChild variant="outline"><Link href={`/api/files/${encodeURIComponent(p.storageKey)}`} target="_blank">Scarica file originale</Link></Button>
      </div>

      {p.notes && (
        <Card>
          <CardHeader><CardTitle>Note</CardTitle></CardHeader>
          <CardContent className="whitespace-pre-line text-sm">{p.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
