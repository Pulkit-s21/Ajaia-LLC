import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  turbopack: {
    // Point to monorepo root so Turbopack resolves hoisted node_modules (next, react, etc.)
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
