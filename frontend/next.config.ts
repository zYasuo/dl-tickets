import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/lib/env";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const backend = env.BACKEND_INTERNAL_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend}/api/v1/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
