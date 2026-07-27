/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/fund',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
