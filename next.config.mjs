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
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/shopping',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/pantry',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/planner',
        destination: '/planner',
        permanent: true,
      },
      {
        source: '/dashboard/library/meals',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/mixes',
        destination: '/recipes?tab=mixes',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
