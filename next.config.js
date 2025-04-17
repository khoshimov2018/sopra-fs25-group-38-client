// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
  experimental: {
    optimizePackageImports: ['antd']
  },
  serverActions: {
    bodySizeLimit: '4mb' // Increase the body size limit to 4MB
  }
};

export default nextConfig;