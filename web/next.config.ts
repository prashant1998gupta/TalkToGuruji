import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Separate build dirs let several dev servers run side by side (NEXT_DIST_DIR=.next-3001)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  experimental: { optimizePackageImports: ['lucide-react', 'framer-motion', '@react-three/drei'] },
  async redirects() {
    return [
      // old site used a capitalised path
      { source: '/astrology-services/Panchang', destination: '/astrology-services/panchang', permanent: true },
    ];
  },
};

export default nextConfig;
