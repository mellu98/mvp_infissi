'use server';

import { z } from 'zod';
import { signIn } from '@/auth';

const schema = z.object({
  email: z.string().email('Email non valida.'),
  password: z.string().min(1, 'Password obbligatoria.'),
});

export interface LoginState {
  ok: boolean;
  error?: string;
}

export async function loginAction(_prev: LoginState | null, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi.' };
  }
  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: '/dashboard',
    });
    return { ok: true };
  } catch (err) {
    // NextAuth throws a redirect error on success — propagate it.
    if ((err as Error)?.message?.includes('NEXT_REDIRECT')) throw err;
    return { ok: false, error: 'Credenziali non valide.' };
  }
}
