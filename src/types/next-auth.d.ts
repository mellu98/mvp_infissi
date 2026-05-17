import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

export type AppUserRole = 'ADMIN' | 'SALES' | 'TECHNICIAN';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      companyId: string;
      role: AppUserRole;
    };
  }
  interface User extends DefaultUser {
    id: string;
    companyId: string;
    role: AppUserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    companyId?: string;
    role?: AppUserRole;
  }
}
