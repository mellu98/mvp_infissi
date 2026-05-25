import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

prisma.$use(async (params, next) => {
  const { model, action, args } = params;
  const description = model ? `${model}.${action}` : action;

  return Sentry.startSpan(
    {
      op: 'db.sql.prisma',
      name: description,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': action,
        ...(model ? { 'db.prisma.model': model } : {}),
      },
    },
    async () => next(params)
  );
});
