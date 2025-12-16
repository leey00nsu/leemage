import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "objectstorage.ap-chuncheon-1.oraclecloud.com",
      },
      {
        protocol: "https",
        hostname: "assets.leey00nsu.com",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
