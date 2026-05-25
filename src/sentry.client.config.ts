import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || 'https://53e76bd846604f22bc954578f3407ea6@glitchtip.app.easlydev.online/1',
  tracesSampleRate: 0.1,
  tunnel: '/api/glitchtip-tunnel',
});
