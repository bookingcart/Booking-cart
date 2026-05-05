import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
