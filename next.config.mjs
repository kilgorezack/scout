/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // hotrod-src/ is reference source for the vendored Hotrod build; the built
  // static output lives in public/hotrod/. Keep the source out of serverless
  // function traces so it doesn't bloat the deploy.
  outputFileTracingExcludes: {
    '*': [
      './hotrod-src/**/*'
    ]
  },
  // The /hotrod route handler reads public/hotrod/index.html at runtime to
  // inject the MapKit token. Force the file into the function's bundle so
  // it's available on Vercel.
  outputFileTracingIncludes: {
    '/hotrod': ['./public/hotrod/index.html']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' }
    ]
  }
};

export default nextConfig;
