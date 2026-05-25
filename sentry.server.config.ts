import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_RELEASE = process.env.SENTRY_RELEASE;

Sentry.init({
  dsn: SENTRY_DSN || 'https://53e76bd846604f22bc954578f3407ea6@glitchtip.app.easlydev.online/1',
  release: SENTRY_RELEASE || 'development',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

console.log('[Sentry Server] Initialized', SENTRY_RELEASE || 'development');
