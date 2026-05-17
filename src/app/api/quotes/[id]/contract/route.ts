import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateContractPdfDocument } from '@/server/services/documents.service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
  }

  try {
    const { document, buffer } = await generateContractPdfDocument(
      session.user.companyId,
      params.id,
      { id: session.user.id, email: session.user.email ?? '' }
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, max-age=0, no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Errore generazione contratto.' },
      { status: 500 }
    );
  }
}
