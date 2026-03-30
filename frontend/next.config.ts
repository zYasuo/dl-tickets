import type { NextConfig } from "next";

const backend =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

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

export default nextConfig;
