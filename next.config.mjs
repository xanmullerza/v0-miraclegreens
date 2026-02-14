/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
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
