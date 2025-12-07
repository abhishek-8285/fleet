/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    emotion: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyB_QNXpGFl5naLPosEE_vzp3PgxblTk6Go',
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Note: Customer portal uses its own local API routes for tracking
  // No rewrites needed - let Next.js handle /api routes internally
}

module.exports = nextConfig
