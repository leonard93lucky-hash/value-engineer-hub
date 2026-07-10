/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/app',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
