import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages read live data from Redis on each request, so Cache Components stays off.
  cacheComponents: false,
  turbopack: {
    // A stray lockfile in a parent folder confuses root detection.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
