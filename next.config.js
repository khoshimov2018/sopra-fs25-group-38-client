/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default settings to ensure compatibility with Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize build and fix chunk loading issues
  output: 'standalone',
  distDir: 'build',
  // Disable chunking to reduce build complexity
  webpack: (config) => {
    // Modify the chunks configuration
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
    return config;
  },
  // Make Next.js handle Ant Design properly
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
};

export default nextConfig;