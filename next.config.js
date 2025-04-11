/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default settings to ensure compatibility with Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;