/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Optional: proxy all /api/* calls to a remote host (e.g. Vercel preview).
  // Set NEXT_PUBLIC_API_PROXY=https://trackflow-3jnc.vercel.app in .env.local to enable.
  async rewrites() {
    const proxy = process.env.NEXT_PUBLIC_API_PROXY
    if (!proxy) return []

    return {
      // beforeFiles runs before the local filesystem, so it overrides local route handlers.
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${proxy}/api/:path*`,
        },
      ],
    }
  },
}

module.exports = nextConfig
