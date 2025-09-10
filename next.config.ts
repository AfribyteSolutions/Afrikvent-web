import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this block to configure external image hosts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;