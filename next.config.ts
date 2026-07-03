import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["cloudinary"],
  outputFileTracingIncludes: {
    "/*": ["node_modules/@libsql/**/*"],
  },
};

export default nextConfig;
