import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe NextAuth config. Used by the middleware (which runs on the edge
 * runtime and cannot import Prisma/bcrypt). The full config in src/auth.ts
 * extends this with the Credentials provider.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isLoginPage = pathname.startsWith('/login');
      const isPublicApi =
        pathname.startsWith('/api/auth') ||
        pathname === '/api/health' ||
        pathname.startsWith('/_next');

      if (isPublicApi) return true;

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id ?? session.user.id;
        session.user.companyId = token.companyId ?? '';
        session.user.role = (token.role ?? 'SALES') as 'ADMIN' | 'SALES' | 'TECHNICIAN';
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
