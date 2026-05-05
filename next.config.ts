import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Produce a standalone server bundle for minimal Docker images
  output: 'standalone',
  // Pin tracing root to this project to avoid leaking parent monorepo paths
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Keep images from external sources working
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Allow legacy public/js scripts (no strict mode violations)
  reactStrictMode: true,
};

export default nextConfig;
