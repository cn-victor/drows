import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second copy of the app (for testing) can use its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@libsql/client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
