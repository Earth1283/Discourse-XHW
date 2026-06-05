import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 + sharp are native deps that must stay external on the server.
  serverExternalPackages: ["better-sqlite3", "sharp"],
  experimental: {
    // allow larger multipart uploads to Route Handlers (images)
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
