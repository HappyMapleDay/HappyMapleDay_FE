import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'open.api.nexon.com',
        port: '',
        pathname: '/static/maplestory/character/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://158.179.173.107:8080/api/:path*'
      }
    ];
  }
};

export default nextConfig;
