import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cloudinary"],
  outputFileTracingIncludes: {
    "/*": ["node_modules/@libsql/**/*"],
  },
};

export default nextConfig;
