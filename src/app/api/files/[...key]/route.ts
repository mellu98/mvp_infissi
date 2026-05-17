import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStorageProvider, StorageError } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Authenticated file streaming for the local storage provider.
 * Coolify users that switch to Appwrite will go through Appwrite URLs directly.
 */
export async function GET(req: NextRequest, ctx: { params: { key: string[] } }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const key = ctx.params.key.map(decodeURIComponent).join('/');
  try {
    const storage = getStorageProvider();
    const buffer = await storage.readFile(key);
    const ext = key.split('.').pop()?.toLowerCase();
    const mime = guessMime(ext);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=0, no-store',
      },
    });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

function guessMime(ext?: string): string {
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
