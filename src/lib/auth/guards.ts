import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export type AppUserRole = 'ADMIN' | 'SALES' | 'TECHNICIAN';

/**
 * Server-side session getter. Returns null if not authenticated.
 * For pages, prefer `requireSession()` which redirects.
 */
export async function getSession() {
  return auth();
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Returns the authenticated user with companyId and role guaranteed.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session;
}

/**
 * Require one of the given roles. Throws if the role does not match.
 * Use inside server actions / API routes after `requireSession`.
 */
export async function requireRole(roles: AppUserRole[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as AppUserRole)) {
    throw new Error(`Forbidden: role ${session.user.role} not in [${roles.join(', ')}]`);
  }
  return session;
}

/** Convenience: returns the active companyId or redirects to /login. */
export async function getCurrentCompanyId(): Promise<string> {
  const session = await requireSession();
  if (!session.user.companyId) {
    throw new Error('Sessione senza companyId — utente non collegato a nessuna azienda.');
  }
  return session.user.companyId;
}
