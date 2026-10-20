import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // Pacotes do monorepo são TypeScript puro, sem build próprio.
  transpilePackages: ['@sr/shared', '@sr/tokens', '@sr/db'],
  poweredByHeader: false,
  // Textos legais lidos de docs/legal em tempo de execução.
  outputFileTracingIncludes: {
    '/privacidade': ['../../docs/legal/*.md'],
    '/termos': ['../../docs/legal/*.md'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
