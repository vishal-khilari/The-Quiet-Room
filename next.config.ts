import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  images: {
    domains: [],
  },
};

export default nextConfig;
