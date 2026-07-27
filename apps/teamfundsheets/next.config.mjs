/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/fund',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
