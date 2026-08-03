import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json at the repo root (outside this frontend/ package) makes Turbopack
  // misdetect the workspace root, which breaks routing entirely (every route 404s). Pin it here.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
