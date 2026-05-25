const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
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
  widenClientFileUpload: true,
  silent: true,
});
