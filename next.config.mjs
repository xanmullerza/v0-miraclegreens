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
        destination: '/tracker?tab=nutrients',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/shopping',
        destination: '/tracker?tab=shopping',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/pantry',
        destination: '/tracker?tab=pantry',
        permanent: true,
      },
      {
        source: '/dashboard/meal-o-matic/planner',
        destination: '/tracker?tab=planner',
        permanent: true,
      },
      {
        source: '/dashboard/library/meals',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/tracker',
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
