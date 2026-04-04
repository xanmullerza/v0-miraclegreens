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
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/shopping',
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/pantry',
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/planner',
        destination: '/tracker',
        permanent: true,
      },
      {
        source: '/dashboard/library/meals',
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/mixes',
        destination: '/cookbook?tab=mixes',
        permanent: true,
      },
      {
        source: '/recipes',
        destination: '/cookbook',
        permanent: true,
      },
      {
        source: '/recipes/:path*',
        destination: '/cookbook/:path*',
        permanent: true,
      },
      {
        source: '/foods',
        destination: '/library',
        permanent: true,
      },
      {
        source: '/foods/:path*',
        destination: '/library/:path*',
        permanent: true,
      },
      {
        source: '/planner',
        destination: '/tracker',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
