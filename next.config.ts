import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: {
    position: 'bottom-right',
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    return [
      {
        source: '/storage/:path*',
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
