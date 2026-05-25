'use server';

import '../../../sentry.server.config';
import * as Sentry from '@sentry/nextjs';

export async function triggerServerError() {
  console.log('[Debug Action] triggerServerError called');
  const error = new Error('Test server error from debug page');
  Sentry.captureException(error);
  throw error;
}

export async function triggerSlowTransaction() {
  return Sentry.startSpan(
    {
      op: 'test.slow-transaction',
      name: 'Debug Slow Transaction',
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, duration: '2000ms' };
    }
  );
}
