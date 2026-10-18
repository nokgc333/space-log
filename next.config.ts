import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          isDevelopment: process.env.NODE_ENV === "development",
        }),
      },
    ];
  },
};

export default nextConfig;
