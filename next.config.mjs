/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/nutrients',
        destination: '/dashboard/nutrients/welcome',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
