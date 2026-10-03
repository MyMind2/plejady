import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] }, poweredByHeader: false,
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://*.supabase.co data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
  ] }] }
}
export default nextConfig
