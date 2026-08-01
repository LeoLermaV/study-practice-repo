import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Inlined at build time so client-side fetches of /public assets can prefix it.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
