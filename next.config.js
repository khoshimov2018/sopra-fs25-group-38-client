/** @type {import('next').NextConfig} */
const nextConfig = {
  // For deployment on Vercel, we need to use their expected defaults
  output: process.env.VERCEL ? undefined : 'standalone',
  distDir: process.env.VERCEL ? '.next' : 'build',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;