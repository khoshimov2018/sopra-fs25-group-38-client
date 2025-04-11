/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: 'build',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;