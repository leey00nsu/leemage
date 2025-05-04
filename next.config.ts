import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "objectstorage.ap-chuncheon-1.oraclecloud.com",
      },
    ],
  },
};

export default nextConfig;
