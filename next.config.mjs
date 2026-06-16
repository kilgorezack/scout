/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // hotrod-src/ is reference source for the vendored Hotrod build; the built
  // static output lives in public/hotrod/. Keep the source out of serverless
  // function traces so it doesn't bloat the deploy.
  outputFileTracingExcludes: {
    '*': [
      './hotrod-src/**/*',
      // Keep the rest of Signal's source out of the function bundles —
      // we only need api/insights.js for the route handler. Vendored
      // public/* + signal-src files (scripts, lockfile, data scripts)
      // bloat traces without ever running on Vercel.
      './signal-src/public/**/*',
      './signal-src/scripts/**/*',
      './signal-src/src/**/*',
      './signal-src/package-lock.json',
      './signal-src/eslint.config.js'
    ]
  },
  // /hotrod and /signal route handlers read their respective
  // public/.../index.html files at runtime; force them into the function
  // bundle so they're available on Vercel.
  outputFileTracingIncludes: {
    '/coverage': ['./public/coverage/index.html'],
    '/markets': ['./public/markets/index.html']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' }
    ]
  },
  // Preserve old URLs after the /hotrod -> /coverage and /signal -> /markets
  // rename so existing bookmarks / external links keep working.
  async redirects() {
    return [
      { source: '/hotrod', destination: '/coverage', permanent: true },
      { source: '/hotrod/:path*', destination: '/coverage/:path*', permanent: true },
      { source: '/hotrod-api/:path*', destination: '/coverage-api/:path*', permanent: true },
      { source: '/signal', destination: '/markets', permanent: true },
      { source: '/signal/:path*', destination: '/markets/:path*', permanent: true },
      { source: '/signal-api/:path*', destination: '/markets-api/:path*', permanent: true }
    ];
  }
};

export default nextConfig;
