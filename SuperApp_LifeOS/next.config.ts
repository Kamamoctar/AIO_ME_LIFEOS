import type { NextConfig } from "next";
import path from "node:path";

const isStaticExport = process.env.BUILD_TARGET === "apk" || process.env.STATIC_EXPORT === "true";
const clerkStubPath = path.resolve(__dirname, "src/lib/clerk-stub.tsx");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStaticExport ? "export" : "standalone",
  images: {
    unoptimized: isStaticExport,
  },
  turbopack: isStaticExport
    ? {
        resolveAlias: {
          "@clerk/nextjs": "./src/lib/clerk-stub.tsx",
          "@clerk/nextjs/server": "./src/lib/clerk-stub.tsx",
        },
      }
    : {},
  webpack: (config) => {
    if (isStaticExport) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias["@clerk/nextjs"] = clerkStubPath;
      config.resolve.alias["@clerk/nextjs/server"] = clerkStubPath;
    }
    return config;
  },
};

export default nextConfig;
