import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.systemed.fr',
      },
    ],
  },
};

export default nextConfig;
