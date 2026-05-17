import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAIProvider } from '@/lib/ai';
import { parseNoteSchema } from '@/lib/validation/quote';
import { listCatalogLite } from '@/server/services/products.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido.' }, { status: 400 });
  }

  const parsed = parseNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Nota non valida.' },
      { status: 400 }
    );
  }

  const catalog = await listCatalogLite(session.user.companyId);
  const result = await getAIProvider().parseQuoteNote(parsed.data.text, catalog);
  return NextResponse.json(result);
}
