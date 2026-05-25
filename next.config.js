const { withSentryConfig } = require('@sentry/nextjs');
const { execSync } = require('child_process');

function getRelease() {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'development';
  }
}

const release = getRelease();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: release,
    SENTRY_RELEASE: release,
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@prisma/client',
      'bcryptjs',
      '@react-pdf/renderer',
      'pdf-parse',
      'mammoth',
      'xlsx',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: 'linkinfissi',
  project: 'mvp-infissi',
  sentryUrl: 'https://glitchtip.app.easlydev.online',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release,
  widenClientFileUpload: true,
  silent: true,
});
