import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the Go backend during development
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ]
  },
};

export default nextConfig;
