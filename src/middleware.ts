import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: [
    // Match everything except: NextAuth API, Next.js internals, static files (with extensions),
    // and the /api/files/ route (handled inline so it can stream binary content).
    '/((?!api/auth|api/files|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
