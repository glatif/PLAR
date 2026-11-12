import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Phones on the same Wi-Fi reach the dev server by this machine's network address (npm run dev:phone).
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal)
  .map((a) => a!.address);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  allowedDevOrigins: lanAddresses,
  // Heavy native/WASM libraries used by identity verification: load them from node_modules at runtime.
  serverExternalPackages: ["@techstark/opencv-js", "sharp"],
  partialPrefetching: true,
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
